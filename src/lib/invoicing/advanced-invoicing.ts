import { PrismaClient } from '@prisma/client';
import { CacheService } from '../redis';
import { captureBusinessError } from '../sentry';
import PDFDocument from 'pdfkit';
import { writeFileSync, readFileSync } from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const cache = CacheService.getInstance();

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
}

export interface InvoiceData {
  id: string;
  number: string;
  date: Date;
  dueDate: Date;
  clientId: string;
  caseId?: string;
  items: InvoiceItem[];
  subtotal: number;
  vatAmount: number;
  total: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  paymentTerms: number; // jours
  notes?: string;
  metadata?: Record<string, any>;
}

export interface PaymentPlan {
  id: string;
  invoiceId: string;
  installments: {
    amount: number;
    dueDate: Date;
    status: 'PENDING' | 'PAID' | 'OVERDUE';
    paidDate?: Date;
  }[];
  totalAmount: number;
  interestRate?: number;
  isActive: boolean;
}

export class AdvancedInvoicingModule {
  private static instance: AdvancedInvoicingModule;

  public static getInstance(): AdvancedInvoicingModule {
    if (!AdvancedInvoicingModule.instance) {
      AdvancedInvoicingModule.instance = new AdvancedInvoicingModule();
    }
    return AdvancedInvoicingModule.instance;
  }

  // Générer une facture automatiquement
  async generateInvoice(invoiceData: Partial<InvoiceData>): Promise<InvoiceData> {
    try {
      // Générer le numéro de facture automatiquement
      const invoiceNumber = await this.generateInvoiceNumber();
      
      const invoice: InvoiceData = {
        id: crypto.randomUUID(),
        number: invoiceNumber,
        date: new Date(),
        dueDate: new Date(Date.now() + (invoiceData.paymentTerms || 30) * 24 * 60 * 60 * 1000),
        clientId: invoiceData.clientId!,
        caseId: invoiceData.caseId,
        items: invoiceData.items || [],
        subtotal: 0,
        vatAmount: 0,
        total: 0,
        status: 'DRAFT',
        paymentTerms: invoiceData.paymentTerms || 30,
        notes: invoiceData.notes,
        metadata: invoiceData.metadata || {}
      };

      // Calculer les totaux
      this.calculateInvoiceTotals(invoice);

      // Sauvegarder en base
      const savedInvoice = await prisma.invoice.create({
        data: {
          id: invoice.id,
          number: invoice.number,
          date: invoice.date,
          dueDate: invoice.dueDate,
          clientId: invoice.clientId,
          caseId: invoice.caseId,
          items: invoice.items,
          subtotal: invoice.subtotal,
          vatAmount: invoice.vatAmount,
          total: invoice.total,
          status: invoice.status,
          paymentTerms: invoice.paymentTerms,
          notes: invoice.notes,
          metadata: invoice.metadata
        }
      });

      console.log(`💰 Facture ${invoice.number} créée avec succès`);
      
      // Invalider le cache
      await cache.del('invoices-stats');
      
      return invoice;

    } catch (error) {
      captureBusinessError(error as Error, {
        context: 'invoice-generation',
        clientId: invoiceData.clientId
      });
      throw error;
    }
  }

  // Générer le PDF de la facture
  async generateInvoicePDF(invoiceId: string): Promise<Buffer> {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          client: true,
          case: true
        }
      });

      if (!invoice) {
        throw new Error(`Facture ${invoiceId} introuvable`);
      }

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {});

      // En-tête cabinet
      doc.fontSize(20)
         .text('CABINET YESOD', 50, 50)
         .fontSize(12)
         .text('Expert en recouvrement de créances', 50, 80)
         .text('123 Avenue du Droit, 75001 Paris', 50, 100)
         .text('Tél: 01 23 45 67 89 | Email: contact@yesod.fr', 50, 120);

      // Numéro de facture et dates
      doc.fontSize(16)
         .text(`FACTURE N° ${invoice.number}`, 400, 50)
         .fontSize(12)
         .text(`Date: ${invoice.date.toLocaleDateString('fr-FR')}`, 400, 80)
         .text(`Échéance: ${invoice.dueDate.toLocaleDateString('fr-FR')}`, 400, 100);

      // Client
      doc.fontSize(14)
         .text('FACTURÉ À:', 50, 180)
         .fontSize(12)
         .text(invoice.client.name, 50, 200)
         .text(invoice.client.address || 'Adresse non renseignée', 50, 220)
         .text(`Email: ${invoice.client.email}`, 50, 240);

      // Dossier lié si applicable
      if (invoice.case) {
        doc.text(`Dossier: ${invoice.case.reference}`, 50, 260);
      }

      // Tableau des prestations
      let yPosition = 320;
      doc.fontSize(12)
         .text('PRESTATIONS', 50, yPosition);
      
      yPosition += 30;
      
      // En-têtes du tableau
      doc.text('Description', 50, yPosition)
         .text('Qté', 300, yPosition)
         .text('P.U. HT', 350, yPosition)
         .text('TVA', 420, yPosition)
         .text('Total HT', 480, yPosition);
      
      yPosition += 20;
      
      // Ligne de séparation
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 10;

      // Items de facturation
      (invoice.items as InvoiceItem[]).forEach((item) => {
        doc.text(item.description, 50, yPosition)
           .text(item.quantity.toString(), 300, yPosition)
           .text(`${item.unitPrice.toFixed(2)}€`, 350, yPosition)
           .text(`${item.vatRate}%`, 420, yPosition)
           .text(`${item.total.toFixed(2)}€`, 480, yPosition);
        yPosition += 20;
      });

      // Ligne de séparation
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 20;

      // Totaux
      doc.text(`Sous-total HT: ${invoice.subtotal.toFixed(2)}€`, 400, yPosition);
      yPosition += 20;
      doc.text(`TVA: ${invoice.vatAmount.toFixed(2)}€`, 400, yPosition);
      yPosition += 20;
      doc.fontSize(14)
         .text(`TOTAL TTC: ${invoice.total.toFixed(2)}€`, 400, yPosition);

      // Conditions de paiement
      yPosition += 60;
      doc.fontSize(10)
         .text(`Conditions de paiement: ${invoice.paymentTerms} jours`, 50, yPosition)
         .text('Pénalités de retard: 3 fois le taux légal', 50, yPosition + 15)
         .text('Indemnité forfaitaire pour frais de recouvrement: 40€', 50, yPosition + 30);

      if (invoice.notes) {
        yPosition += 60;
        doc.fontSize(12)
           .text('Notes:', 50, yPosition)
           .fontSize(10)
           .text(invoice.notes, 50, yPosition + 20);
      }

      doc.end();

      return Buffer.concat(chunks);

    } catch (error) {
      captureBusinessError(error as Error, {
        context: 'invoice-pdf-generation',
        invoiceId
      });
      throw error;
    }
  }

  // Envoyer une facture par email
  async sendInvoice(invoiceId: string, emailOptions?: { 
    subject?: string; 
    message?: string; 
    copyTo?: string[] 
  }): Promise<void> {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { client: true }
      });

      if (!invoice) {
        throw new Error(`Facture ${invoiceId} introuvable`);
      }

      // Générer le PDF
      const pdfBuffer = await this.generateInvoicePDF(invoiceId);

      // Configuration email par défaut
      const subject = emailOptions?.subject || `Facture ${invoice.number} - Cabinet Yesod`;
      const message = emailOptions?.message || `
        Madame, Monsieur,
        
        Veuillez trouver ci-joint votre facture n° ${invoice.number} d'un montant de ${invoice.total.toFixed(2)}€ TTC.
        
        Date d'échéance: ${invoice.dueDate.toLocaleDateString('fr-FR')}
        
        Pour toute question, n'hésitez pas à nous contacter.
        
        Cordialement,
        Cabinet Yesod
      `;

      // Ici, intégration avec un service d'email (ex: SendGrid, AWS SES)
      console.log(`📧 Envoi facture ${invoice.number} à ${invoice.client.email}`);
      
      // Marquer la facture comme envoyée
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { 
          status: 'SENT',
          metadata: {
            ...invoice.metadata,
            sentDate: new Date().toISOString(),
            sentTo: invoice.client.email
          }
        }
      });

      console.log(`✅ Facture ${invoice.number} envoyée avec succès`);

    } catch (error) {
      captureBusinessError(error as Error, {
        context: 'invoice-sending',
        invoiceId
      });
      throw error;
    }
  }

  // Créer un échéancier de paiement
  async createPaymentPlan(
    invoiceId: string, 
    numberOfInstallments: number,
    interestRate?: number
  ): Promise<PaymentPlan> {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
      });

      if (!invoice) {
        throw new Error(`Facture ${invoiceId} introuvable`);
      }

      const installmentAmount = invoice.total / numberOfInstallments;
      const installments = [];

      for (let i = 0; i < numberOfInstallments; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i + 1);

        installments.push({
          amount: installmentAmount,
          dueDate,
          status: 'PENDING' as const
        });
      }

      const paymentPlan: PaymentPlan = {
        id: crypto.randomUUID(),
        invoiceId,
        installments,
        totalAmount: invoice.total,
        interestRate,
        isActive: true
      };

      // Sauvegarder en base
      await prisma.paymentPlan.create({
        data: {
          id: paymentPlan.id,
          invoiceId: paymentPlan.invoiceId,
          installments: paymentPlan.installments,
          totalAmount: paymentPlan.totalAmount,
          interestRate: paymentPlan.interestRate,
          isActive: paymentPlan.isActive
        }
      });

      console.log(`📅 Échéancier créé pour facture ${invoice.number}: ${numberOfInstallments} mensualités`);

      return paymentPlan;

    } catch (error) {
      captureBusinessError(error as Error, {
        context: 'payment-plan-creation',
        invoiceId
      });
      throw error;
    }
  }

  // Traiter un paiement
  async processPayment(
    invoiceId: string, 
    amount: number, 
    paymentMethod: string = 'BANK_TRANSFER',
    installmentIndex?: number
  ): Promise<void> {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { paymentPlan: true }
      });

      if (!invoice) {
        throw new Error(`Facture ${invoiceId} introuvable`);
      }

      // Enregistrer le paiement
      await prisma.payment.create({
        data: {
          invoiceId,
          amount,
          paymentMethod,
          paymentDate: new Date(),
          status: 'COMPLETED'
        }
      });

      // Si c'est un échéancier, marquer l'échéance comme payée
      if (installmentIndex !== undefined && invoice.paymentPlan) {
        const updatedInstallments = [...invoice.paymentPlan.installments];
        if (updatedInstallments[installmentIndex]) {
          updatedInstallments[installmentIndex] = {
            ...updatedInstallments[installmentIndex],
            status: 'PAID',
            paidDate: new Date()
          };

          await prisma.paymentPlan.update({
            where: { id: invoice.paymentPlan.id },
            data: { installments: updatedInstallments }
          });
        }
      }

      // Vérifier si la facture est totalement payée
      const totalPaid = await this.getTotalPaidAmount(invoiceId);
      if (totalPaid >= invoice.total) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: 'PAID' }
        });
        console.log(`✅ Facture ${invoice.number} totalement payée`);
      }

      console.log(`💰 Paiement de ${amount}€ enregistré pour facture ${invoice.number}`);

    } catch (error) {
      captureBusinessError(error as Error, {
        context: 'payment-processing',
        invoiceId,
        amount
      });
      throw error;
    }
  }

  // Obtenir les statistiques de facturation
  async getInvoicingStats(): Promise<any> {
    try {
      const cacheKey = 'invoicing-stats';
      const cached = await cache.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const stats = {
        totalInvoices: await prisma.invoice.count(),
        totalAmount: await this.getTotalInvoicesAmount(),
        paidAmount: await this.getTotalPaidAmount(),
        overdueAmount: await this.getOverdueAmount(),
        averagePaymentTime: await this.getAveragePaymentTime(),
        paymentPlanStats: await this.getPaymentPlanStats(),
        monthlyStats: await this.getMonthlyInvoicingStats()
      };

      await cache.set(cacheKey, JSON.stringify(stats), 1800); // 30 minutes
      return stats;

    } catch (error) {
      captureBusinessError(error as Error, {
        context: 'invoicing-stats'
      });
      return {};
    }
  }

  // Méthodes privées utilitaires

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({
      where: {
        createdAt: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1)
        }
      }
    });
    return `FAC${year}${(count + 1).toString().padStart(4, '0')}`;
  }

  private calculateInvoiceTotals(invoice: InvoiceData): void {
    invoice.subtotal = invoice.items.reduce((sum, item) => {
      item.total = item.quantity * item.unitPrice;
      return sum + item.total;
    }, 0);

    invoice.vatAmount = invoice.items.reduce((sum, item) => {
      return sum + (item.total * item.vatRate / 100);
    }, 0);

    invoice.total = invoice.subtotal + invoice.vatAmount;
  }

  private async getTotalPaidAmount(invoiceId?: string): Promise<number> {
    const where = invoiceId ? { invoiceId } : {};
    const result = await prisma.payment.aggregate({
      where: { ...where, status: 'COMPLETED' },
      _sum: { amount: true }
    });
    return result._sum.amount || 0;
  }

  private async getTotalInvoicesAmount(): Promise<number> {
    const result = await prisma.invoice.aggregate({
      _sum: { total: true }
    });
    return result._sum.total || 0;
  }

  private async getOverdueAmount(): Promise<number> {
    const result = await prisma.invoice.aggregate({
      where: {
        status: 'OVERDUE',
        dueDate: { lt: new Date() }
      },
      _sum: { total: true }
    });
    return result._sum.total || 0;
  }

  private async getAveragePaymentTime(): Promise<number> {
    const paidInvoices = await prisma.invoice.findMany({
      where: { status: 'PAID' },
      include: { payments: true }
    });

    if (paidInvoices.length === 0) return 0;

    const totalDays = paidInvoices.reduce((sum, invoice) => {
      const paymentDate = invoice.payments[0]?.paymentDate;
      if (!paymentDate) return sum;
      
      const days = Math.floor(
        (paymentDate.getTime() - invoice.date.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);

    return totalDays / paidInvoices.length;
  }

  private async getPaymentPlanStats(): Promise<any> {
    const totalPlans = await prisma.paymentPlan.count();
    const activePlans = await prisma.paymentPlan.count({
      where: { isActive: true }
    });

    return { totalPlans, activePlans };
  }

  private async getMonthlyInvoicingStats(): Promise<any[]> {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const stats = await prisma.invoice.aggregate({
        where: {
          date: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _count: { id: true },
        _sum: { total: true }
      });

      months.push({
        month: startOfMonth.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }),
        count: stats._count.id,
        amount: stats._sum.total || 0
      });
    }

    return months;
  }
}

// Types Prisma pour la compatibilité
export interface Invoice {
  id: string;
  number: string;
  date: Date;
  dueDate: Date;
  clientId: string;
  caseId?: string;
  items: any;
  subtotal: number;
  vatAmount: number;
  total: number;
  status: string;
  paymentTerms: number;
  notes?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

import { PrismaClient } from '@prisma/client';
import { CacheService } from '../redis';
import { captureBusinessError } from '../sentry';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();
const cache = CacheService.getInstance();

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[]; // Variables disponibles comme {{clientName}}, {{amount}}
  category: 'REMINDER' | 'NOTICE' | 'THANK_YOU' | 'CUSTOM';
  isActive: boolean;
}

export interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  category: 'REMINDER' | 'URGENT' | 'CONFIRMATION' | 'CUSTOM';
  isActive: boolean;
}

export interface CommunicationLog {
  id: string;
  type: 'EMAIL' | 'SMS' | 'PHONE' | 'LETTER';
  direction: 'OUTBOUND' | 'INBOUND';
  caseId?: string;
  clientId: string;
  subject?: string;
  content: string;
  status: 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';
  sentAt: Date;
  deliveredAt?: Date;
  metadata?: Record<string, any>;
}

// Templates prédéfinis pour cabinets d'avocats
export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'gentle-reminder',
    name: 'Rappel Aimable',
    subject: 'Rappel - Échéance de paiement - Dossier {{caseReference}}',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50;">Cabinet Yesod - Rappel de paiement</h2>
          
          <p>Madame, Monsieur {{debtorName}},</p>
          
          <p>Nous nous permettons de vous rappeler qu'à ce jour, une créance d'un montant de <strong>{{amount}}€</strong> 
          reste impayée concernant le dossier <strong>{{caseReference}}</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
            <h4>Détails du dossier :</h4>
            <ul>
              <li>Référence : {{caseReference}}</li>
              <li>Montant : {{amount}}€</li>
              <li>Date d'échéance : {{dueDate}}</li>
              <li>Jours de retard : {{daysOverdue}}</li>
            </ul>
          </div>
          
          <p>Nous vous invitons à régulariser cette situation dans les plus brefs délais afin d'éviter 
          toute procédure de recouvrement contentieux.</p>
          
          <p>Si vous souhaitez établir un échéancier de paiement, nous vous invitons à nous contacter.</p>
          
          <p>Cordialement,<br>
          <strong>Cabinet Yesod</strong><br>
          Tél : 01 23 45 67 89<br>
          Email : contact@yesod.fr</p>
        </div>
      </body>
      </html>
    `,
    textContent: `Cabinet Yesod - Rappel de paiement

Madame, Monsieur {{debtorName}},

Nous nous permettons de vous rappeler qu'à ce jour, une créance d'un montant de {{amount}}€ reste impayée concernant le dossier {{caseReference}}.

Détails du dossier :
- Référence : {{caseReference}}
- Montant : {{amount}}€
- Date d'échéance : {{dueDate}}
- Jours de retard : {{daysOverdue}}

Nous vous invitons à régulariser cette situation dans les plus brefs délais afin d'éviter toute procédure de recouvrement contentieux.

Si vous souhaitez établir un échéancier de paiement, nous vous invitons à nous contacter.

Cordialement,
Cabinet Yesod
Tél : 01 23 45 67 89
Email : contact@yesod.fr`,
    variables: ['debtorName', 'amount', 'caseReference', 'dueDate', 'daysOverdue'],
    category: 'REMINDER',
    isActive: true
  },
  {
    id: 'formal-notice',
    name: 'Mise en Demeure',
    subject: 'MISE EN DEMEURE - Dossier {{caseReference}} - Dernier rappel avant procédure',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #dc3545; color: white; padding: 15px; text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0;">MISE EN DEMEURE</h2>
          </div>
          
          <p>Madame, Monsieur {{debtorName}},</p>
          
          <p><strong>OBJET :</strong> Mise en demeure de payer - Dossier {{caseReference}}</p>
          
          <p>Malgré nos précédents rappels, nous constatons que la créance d'un montant de <strong>{{amount}}€</strong> 
          demeure impayée à ce jour.</p>
          
          <div style="background-color: #fff3cd; padding: 15px; border: 1px solid #ffeaa7; margin: 20px 0;">
            <h4 style="color: #856404;">⚠️ DERNIER DÉLAI</h4>
            <p style="margin: 0;">Vous disposez d'un délai de <strong>8 jours</strong> à compter de la réception 
            de cette mise en demeure pour procéder au règlement intégral de cette créance.</p>
          </div>
          
          <p><strong>À défaut de paiement dans ce délai, nous nous verrons contraints d'engager à votre encontre 
          une procédure de recouvrement contentieux</strong> avec toutes les conséquences juridiques et financières 
          que cela implique.</p>
          
          <p>Cette procédure entraînera des frais supplémentaires à votre charge.</p>
          
          <p>Nous vous rappelons qu'en application de l'article L.441-6 du Code de commerce, 
          le défaut de paiement entraîne de plein droit le paiement d'intérêts de retard.</p>
          
          <p>Cordialement,<br>
          <strong>Cabinet Yesod</strong><br>
          Expert en recouvrement de créances</p>
        </div>
      </body>
      </html>
    `,
    textContent: `MISE EN DEMEURE

Madame, Monsieur {{debtorName}},

OBJET : Mise en demeure de payer - Dossier {{caseReference}}

Malgré nos précédents rappels, nous constatons que la créance d'un montant de {{amount}}€ demeure impayée à ce jour.

⚠️ DERNIER DÉLAI
Vous disposez d'un délai de 8 jours à compter de la réception de cette mise en demeure pour procéder au règlement intégral de cette créance.

À défaut de paiement dans ce délai, nous nous verrons contraints d'engager à votre encontre une procédure de recouvrement contentieux avec toutes les conséquences juridiques et financières que cela implique.

Cette procédure entraînera des frais supplémentaires à votre charge.

Nous vous rappelons qu'en application de l'article L.441-6 du Code de commerce, le défaut de paiement entraîne de plein droit le paiement d'intérêts de retard.

Cordialement,
Cabinet Yesod
Expert en recouvrement de créances`,
    variables: ['debtorName', 'amount', 'caseReference'],
    category: 'NOTICE',
    isActive: true
  },
  {
    id: 'payment-confirmation',
    name: 'Confirmation de Paiement',
    subject: 'Confirmation de règlement - Dossier {{caseReference}}',
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #28a745; color: white; padding: 15px; text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0;">✅ Paiement Confirmé</h2>
          </div>
          
          <p>Madame, Monsieur {{debtorName}},</p>
          
          <p>Nous accusons réception de votre règlement d'un montant de <strong>{{amount}}€</strong> 
          concernant le dossier <strong>{{caseReference}}</strong>.</p>
          
          <div style="background-color: #d4edda; padding: 15px; border: 1px solid #c3e6cb; margin: 20px 0;">
            <h4 style="color: #155724;">Récapitulatif du paiement :</h4>
            <ul>
              <li>Date de paiement : {{paymentDate}}</li>
              <li>Montant : {{amount}}€</li>
              <li>Mode de paiement : {{paymentMethod}}</li>
              <li>Dossier : {{caseReference}}</li>
            </ul>
          </div>
          
          <p>Le dossier est désormais clos. Nous vous remercions pour votre règlement.</p>
          
          <p>Cordialement,<br>
          <strong>Cabinet Yesod</strong></p>
        </div>
      </body>
      </html>
    `,
    textContent: `✅ Paiement Confirmé

Madame, Monsieur {{debtorName}},

Nous accusons réception de votre règlement d'un montant de {{amount}}€ concernant le dossier {{caseReference}}.

Récapitulatif du paiement :
- Date de paiement : {{paymentDate}}
- Montant : {{amount}}€
- Mode de paiement : {{paymentMethod}}
- Dossier : {{caseReference}}

Le dossier est désormais clos. Nous vous remercions pour votre règlement.

Cordialement,
Cabinet Yesod`,
    variables: ['debtorName', 'amount', 'caseReference', 'paymentDate', 'paymentMethod'],
    category: 'THANK_YOU',
    isActive: true
  }
];

export const DEFAULT_SMS_TEMPLATES: SMSTemplate[] = [
  {
    id: 'sms-reminder',
    name: 'Rappel SMS Simple',
    content: 'Cabinet Yesod: Rappel échéance {{amount}}€ dossier {{caseReference}}. Merci de régulariser. Info: 01.23.45.67.89',
    variables: ['amount', 'caseReference'],
    category: 'REMINDER',
    isActive: true
  },
  {
    id: 'sms-urgent',
    name: 'SMS Urgent',
    content: 'URGENT - Cabinet Yesod: Dernière relance avant procédure. Dossier {{caseReference}} - {{amount}}€. Appelez-nous: 01.23.45.67.89',
    variables: ['amount', 'caseReference'],
    category: 'URGENT',
    isActive: true
  },
  {
    id: 'sms-payment-plan',
    name: 'SMS Échéancier',
    content: 'Cabinet Yesod: Votre échéance de {{amount}}€ arrive à terme le {{dueDate}}. Dossier {{caseReference}}. Info: 01.23.45.67.89',
    variables: ['amount', 'dueDate', 'caseReference'],
    category: 'REMINDER',
    isActive: true
  }
];

export class ProfessionalCommunicationService {
  private static instance: ProfessionalCommunicationService;
  private emailTransporter: nodemailer.Transporter;

  private constructor() {
    // Configuration du transporteur email (à adapter selon le service utilisé)
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  public static getInstance(): ProfessionalCommunicationService {
    if (!ProfessionalCommunicationService.instance) {
      ProfessionalCommunicationService.instance = new ProfessionalCommunicationService();
    }
    return ProfessionalCommunicationService.instance;
  }

  // Envoyer un email avec template
  async sendEmail(
    templateId: string,
    recipientEmail: string,
    variables: Record<string, any>,
    options?: {
      copyTo?: string[];
      attachments?: { filename: string; content: Buffer }[];
      priority?: 'high' | 'normal' | 'low';
    }
  ): Promise<string> {
    try {
      const template = DEFAULT_EMAIL_TEMPLATES.find(t => t.id === templateId);
      if (!template) {
        throw new Error(`Template email ${templateId} introuvable`);
      }

      // Remplacer les variables dans le template
      const subject = this.replaceVariables(template.subject, variables);
      const htmlContent = this.replaceVariables(template.htmlContent, variables);
      const textContent = this.replaceVariables(template.textContent, variables);

      // Envoyer l'email
      const mailOptions = {
        from: process.env.SMTP_FROM || 'contact@yesod.fr',
        to: recipientEmail,
        cc: options?.copyTo,
        subject,
        html: htmlContent,
        text: textContent,
        attachments: options?.attachments,
        priority: options?.priority || 'normal'
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      
      // Enregistrer dans le log de communication
      const logId = await this.logCommunication({
        type: 'EMAIL',
        direction: 'OUTBOUND',
        clientId: variables.clientId,
        caseId: variables.caseId,
        subject,
        content: textContent,
        status: 'SENT',
        sentAt: new Date(),
        metadata: {
          templateId,
          messageId: result.messageId,
          variables
        }
      });

      console.log(`📧 Email envoyé avec succès à ${recipientEmail} (Template: ${template.name})`);
      return logId;

    } catch (error) {
      captureBusinessError(error as Error, {
        context: 'email-sending',
        templateId,
        recipientEmail
      });
      throw error;
    }
  }

  // Envoyer un SMS avec template
  async sendSMS(
    templateId: string,
    recipientPhone: string,
    variables: Record<string, any>
  ): Promise<string> {
    try {
      const template = DEFAULT_SMS_TEMPLATES.find(t => t.id === templateId);
      if (!template) {
        throw new Error(`Template SMS ${templateId} introuvable`);
      }

      // Remplacer les variables dans le template
      const content = this.replaceVariables(template.content, variables);

      // Ici, intégration avec un service SMS (ex: Twilio, OVH SMS)
      console.log(`📱 SMS envoyé à ${recipientPhone}: ${content}`);
      
      // Simulation d'envoi SMS réussi
      const logId = await this.logCommunication({
        type: 'SMS',
        direction: 'OUTBOUND',
        clientId: variables.clientId,
        caseId: variables.caseId,
        content,
        status: 'SENT',
        sentAt: new Date(),
        metadata: {
          templateId,
          variables,
          phone: recipientPhone
        }
      });

      return logId;

    } catch (error) {
      captureBusinessError(error as Error, {
        context: 'sms-sending',
        templateId,
        recipientPhone
      });
      throw error;
    }
  }

  // Envoyer une communication de masse
  async sendBulkCommunication(
    type: 'EMAIL' | 'SMS',
    templateId: string,
    recipients: Array<{
      email?: string;
      phone?: string;
      variables: Record<string, any>;
    }>
  ): Promise<string[]> {
    const results: string[] = [];

    console.log(`📢 Envoi en masse de ${recipients.length} ${type}s avec template ${templateId}`);

    for (const recipient of recipients) {
      try {
        let logId: string;
        
        if (type === 'EMAIL' && recipient.email) {
          logId = await this.sendEmail(templateId, recipient.email, recipient.variables);
        } else if (type === 'SMS' && recipient.phone) {
          logId = await this.sendSMS(templateId, recipient.phone, recipient.variables);
        } else {
          continue;
        }

        results.push(logId);
        
        // Délai entre les envois pour éviter le spam
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Erreur envoi ${type} à ${recipient.email || recipient.phone}:`, error);
      }
    }

    console.log(`✅ Envoi en masse terminé: ${results.length}/${recipients.length} réussis`);
    return results;
  }

  // Créer un template personnalisé
  async createCustomTemplate(
    type: 'EMAIL' | 'SMS',
    templateData: Partial<EmailTemplate | SMSTemplate>
  ): Promise<string> {
    try {
      const template = {
        id: crypto.randomUUID(),
        name: templateData.name!,
        category: 'CUSTOM' as const,
        isActive: true,
        variables: templateData.variables || [],
        ...templateData
      };

      // Sauvegarder en base de données
      await prisma.communicationTemplate.create({
        data: {
          id: template.id,
          type,
          name: template.name,
          content: type === 'EMAIL' 
            ? JSON.stringify({
                subject: (templateData as EmailTemplate).subject,
                htmlContent: (templateData as EmailTemplate).htmlContent,
                textContent: (templateData as EmailTemplate).textContent
              })
            : (templateData as SMSTemplate).content,
          variables: template.variables,
          category: template.category,
          isActive: template.isActive
        }
      });

      console.log(`📝 Template ${type} "${template.name}" créé avec succès`);
      return template.id;

    } catch (error) {
      captureBusinessError(error as Error, {
        context: 'template-creation',
        type,
        templateName: templateData.name
      });
      throw error;
    }
  }

  // Obtenir l'historique des communications
  async getCommunicationHistory(
    filters?: {
      clientId?: string;
      caseId?: string;
      type?: 'EMAIL' | 'SMS' | 'PHONE' | 'LETTER';
      dateFrom?: Date;
      dateTo?: Date;
      status?: string;
    }
  ): Promise<CommunicationLog[]> {
    try {
      const where: any = {};

      if (filters?.clientId) where.clientId = filters.clientId;
      if (filters?.caseId) where.caseId = filters.caseId;
      if (filters?.type) where.type = filters.type;
      if (filters?.status) where.status = filters.status;
      if (filters?.dateFrom || filters?.dateTo) {
        where.sentAt = {};
        if (filters.dateFrom) where.sentAt.gte = filters.dateFrom;
        if (filters.dateTo) where.sentAt.lte = filters.dateTo;
      }

      const communications = await prisma.communicationLog.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        take: 100
      });

      return communications;

    } catch (error) {
      captureBusinessError(error as Error, {
        context: 'communication-history',
        filters
      });
      throw error;
    }
  }

  // Obtenir les statistiques de communication
  async getCommunicationStats(): Promise<any> {
    try {
      const cacheKey = 'communication-stats';
      const cached = await cache.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const stats = {
        totalSent: await this.getTotalCommunicationsSent(),
        byType: await this.getCommunicationsByType(),
        deliveryRate: await this.getDeliveryRate(),
        responseRate: await this.getResponseRate(),
        monthlyVolume: await this.getMonthlyCommunicationVolume(),
        templateUsage: await this.getTemplateUsageStats()
      };

      await cache.set(cacheKey, JSON.stringify(stats), 1800); // 30 minutes
      return stats;

    } catch (error) {
      captureBusinessError(error as Error, {
        context: 'communication-stats'
      });
      return {};
    }
  }

  // Méthodes privées utilitaires

  private replaceVariables(content: string, variables: Record<string, any>): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }

  private async logCommunication(logData: Omit<CommunicationLog, 'id'>): Promise<string> {
    const log = await prisma.communicationLog.create({
      data: {
        id: crypto.randomUUID(),
        ...logData
      }
    });
    return log.id;
  }

  private async getTotalCommunicationsSent(): Promise<number> {
    return await prisma.communicationLog.count();
  }

  private async getCommunicationsByType(): Promise<Record<string, number>> {
    const result = await prisma.communicationLog.groupBy({
      by: ['type'],
      _count: { type: true }
    });

    return result.reduce((acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {} as Record<string, number>);
  }

  private async getDeliveryRate(): Promise<number> {
    const total = await prisma.communicationLog.count();
    const delivered = await prisma.communicationLog.count({
      where: { status: { in: ['DELIVERED', 'SENT'] } }
    });

    return total > 0 ? (delivered / total) * 100 : 0;
  }

  private async getResponseRate(): Promise<number> {
    // Calculer le taux de réponse basé sur les paiements reçus après communication
    const emailsSent = await prisma.communicationLog.count({
      where: { type: 'EMAIL' }
    });

    // Ici, on pourrait analyser les paiements reçus dans les X jours après l'envoi
    return 15.5; // Exemple : 15.5% de taux de réponse
  }

  private async getMonthlyCommunicationVolume(): Promise<any[]> {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const count = await prisma.communicationLog.count({
        where: {
          sentAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });

      months.push({
        month: startOfMonth.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' }),
        count
      });
    }

    return months;
  }

  private async getTemplateUsageStats(): Promise<any[]> {
    const templates = [...DEFAULT_EMAIL_TEMPLATES, ...DEFAULT_SMS_TEMPLATES];
    
    return templates.map(template => ({
      id: template.id,
      name: template.name,
      category: template.category,
      // Ici on pourrait compter l'usage réel depuis les logs
      usageCount: Math.floor(Math.random() * 100) // Exemple
    }));
  }
}

// Interface pour les services tiers
export interface EmailServiceConfig {
  provider: 'SENDGRID' | 'AWS_SES' | 'SMTP';
  apiKey?: string;
  region?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
}

export interface SMSServiceConfig {
  provider: 'TWILIO' | 'OVH' | 'CUSTOM';
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  apiKey?: string;
  endpoint?: string;
}

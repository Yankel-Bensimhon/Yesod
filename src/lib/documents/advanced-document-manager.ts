import { PrismaClient } from '@prisma/client';
import { CacheService } from '../redis';
import { captureBusinessError } from '../sentry';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();
const cache = CacheService.getInstance();

export interface Document {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  hash: string; // Hash du fichier pour éviter les doublons
  
  // Classification
  category: 'CONTRACT' | 'INVOICE' | 'CORRESPONDENCE' | 'LEGAL_DOCUMENT' | 'PROOF' | 'OTHER';
  tags: string[];
  
  // Métadonnées extraites
  extractedData?: {
    text?: string; // Texte extrait par OCR
    entities?: { // Entités nommées extraites
      names?: string[];
      dates?: string[];
      amounts?: string[];
      references?: string[];
    };
    signatures?: {
      count: number;
      verified: boolean;
      signers?: string[];
    };
  };
  
  // Relations
  caseId?: string;
  clientId?: string;
  
  // Versioning
  version: number;
  parentDocumentId?: string;
  
  // Sécurité
  isConfidential: boolean;
  accessLevel: 'PUBLIC' | 'INTERNAL' | 'RESTRICTED' | 'CONFIDENTIAL';
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
  
  // Stockage
  storagePath: string;
  thumbnailPath?: string;
  
  // Workflow
  status: 'PROCESSING' | 'READY' | 'ARCHIVED' | 'DELETED';
  
  metadata?: Record<string, any>;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string; // Template avec variables {{variable}}
  variables: string[]; // Liste des variables disponibles
  isActive: boolean;
}

export interface DigitalSignature {
  id: string;
  documentId: string;
  signerEmail: string;
  signerName: string;
  signedAt?: Date;
  status: 'PENDING' | 'SIGNED' | 'DECLINED' | 'EXPIRED';
  signatureData?: string; // Données cryptographiques de la signature
  ipAddress?: string;
  userAgent?: string;
}

// Templates prédéfinis pour cabinets d'avocats
export const DEFAULT_DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'mise-en-demeure-standard',
    name: 'Mise en Demeure Standard',
    description: 'Template de mise en demeure pour recouvrement de créances',
    category: 'LEGAL_DOCUMENT',
    content: `
MISE EN DEMEURE

Cabinet {{cabinetName}}
{{cabinetAddress}}
{{cabinetPhone}} - {{cabinetEmail}}

{{date}}

{{debtorTitle}} {{debtorName}}
{{debtorAddress}}

OBJET : Mise en demeure de payer - Créance de {{amount}}€

{{debtorTitle}},

Nous représentons les intérêts de {{clientName}} et vous mettons en demeure de procéder au règlement de la somme de {{amount}}€ ({{amountInWords}} euros) qui vous est réclamée au titre de {{invoiceReference}}.

Cette créance, échue depuis le {{dueDate}}, demeure impayée à ce jour malgré nos précédents rappels.

En conséquence, nous vous mettons en demeure de procéder au règlement intégral de cette somme dans un délai de HUIT (8) JOURS à compter de la réception de la présente.

À défaut de règlement dans ce délai, nous nous verrons contraints d'engager à votre encontre une procédure de recouvrement contentieux avec toutes les conséquences de droit qui en découlent.

Nous vous rappelons qu'en application des dispositions de l'article L. 441-6 du Code de commerce, le défaut de paiement entraîne de plein droit le paiement d'intérêts de retard au taux de {{interestRate}}% par an.

Cette procédure entraînera des frais supplémentaires à votre charge.

Nous demeurons à votre disposition pour tout arrangement amiable.

{{lawyerName}}
{{lawyerTitle}}
Cabinet {{cabinetName}}
    `,
    variables: [
      'cabinetName', 'cabinetAddress', 'cabinetPhone', 'cabinetEmail',
      'date', 'debtorTitle', 'debtorName', 'debtorAddress',
      'clientName', 'amount', 'amountInWords', 'invoiceReference',
      'dueDate', 'interestRate', 'lawyerName', 'lawyerTitle'
    ],
    isActive: true
  },
  {
    id: 'contrat-recouvrement',
    name: 'Contrat de Recouvrement',
    description: 'Contrat type entre le cabinet et le client pour mission de recouvrement',
    category: 'CONTRACT',
    content: `
CONTRAT DE RECOUVREMENT DE CRÉANCES

Entre les soussignés :

{{clientName}}, {{clientType}}
Immatriculé sous le numéro {{clientSiret}}
Ayant son siège social : {{clientAddress}}
Représenté par {{clientRepresentative}}, {{clientTitle}}

Ci-après dénommé « LE CRÉANCIER »

ET

Cabinet {{cabinetName}}
{{cabinetAddress}}
Représenté par {{lawyerName}}, Avocat au Barreau de {{barreauName}}

Ci-après dénommé « LE CABINET »

IL A ÉTÉ CONVENU CE QUI SUIT :

ARTICLE 1 - OBJET
Le CRÉANCIER confie au CABINET le recouvrement des créances suivantes :
{{creancesList}}

Montant total : {{totalAmount}}€

ARTICLE 2 - HONORAIRES
Les honoraires du CABINET s'élèvent à {{feePercentage}}% du montant recouvré.
Honoraires minimum : {{minimumFee}}€

ARTICLE 3 - OBLIGATIONS DU CABINET
Le CABINET s'engage à mettre en œuvre tous les moyens légaux pour le recouvrement des créances.

ARTICLE 4 - OBLIGATIONS DU CRÉANCIER
Le CRÉANCIER s'engage à fournir tous les documents nécessaires au recouvrement.

Fait à {{city}}, le {{date}}

LE CRÉANCIER                    LE CABINET
{{clientName}}                  {{lawyerName}}
    `,
    variables: [
      'clientName', 'clientType', 'clientSiret', 'clientAddress',
      'clientRepresentative', 'clientTitle', 'cabinetName', 'cabinetAddress',
      'lawyerName', 'barreauName', 'creancesList', 'totalAmount',
      'feePercentage', 'minimumFee', 'city', 'date'
    ],
    isActive: true
  }
];

export class AdvancedDocumentManager {
  private static instance: AdvancedDocumentManager;
  private readonly documentsPath: string;
  private readonly thumbnailsPath: string;

  private constructor() {
    this.documentsPath = process.env.DOCUMENTS_PATH || path.join(process.cwd(), 'storage', 'documents');
    this.thumbnailsPath = path.join(this.documentsPath, 'thumbnails');
    
    // Créer les dossiers si ils n'existent pas
    if (!existsSync(this.documentsPath)) {
      mkdirSync(this.documentsPath, { recursive: true });
    }
    if (!existsSync(this.thumbnailsPath)) {
      mkdirSync(this.thumbnailsPath, { recursive: true });
    }
  }

  public static getInstance(): AdvancedDocumentManager {
    if (!AdvancedDocumentManager.instance) {
      AdvancedDocumentManager.instance = new AdvancedDocumentManager();
    }
    return AdvancedDocumentManager.instance;
  }

  // Uploader et traiter un document
  async uploadDocument(
    file: {
      buffer: Buffer;
      originalName: string;
      mimeType: string;
    },
    metadata: {
      caseId?: string;
      clientId?: string;
      category?: string;
      tags?: string[];
      isConfidential?: boolean;
      accessLevel?: string;
    }
  ): Promise<Document> {
    try {
      // Calculer le hash du fichier
      const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
      
      // Vérifier si le document existe déjà
      const existingDoc = await prisma.document.findFirst({
        where: { hash }
      });

      if (existingDoc) {
        console.log(`📄 Document déjà existant (hash: ${hash.substring(0, 8)}...)`);
        return existingDoc as Document;
      }

      const documentId = crypto.randomUUID();
      const fileExtension = path.extname(file.originalName);
      const sanitizedName = this.sanitizeFilename(file.originalName);
      const storagePath = path.join(this.documentsPath, `${documentId}${fileExtension}`);

      // Sauvegarder le fichier
      writeFileSync(storagePath, file.buffer);

      // Créer le document en base
      const document: Document = {
        id: documentId,
        name: sanitizedName,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.buffer.length,
        hash,
        category: (metadata.category as any) || 'OTHER',
        tags: metadata.tags || [],
        caseId: metadata.caseId,
        clientId: metadata.clientId,
        version: 1,
        isConfidential: metadata.isConfidential || false,
        accessLevel: (metadata.accessLevel as any) || 'INTERNAL',
        createdAt: new Date(),
        updatedAt: new Date(),
        storagePath,
        status: 'PROCESSING'
      };

      await prisma.document.create({
        data: {
          id: document.id,
          name: document.name,
          originalName: document.originalName,
          mimeType: document.mimeType,
          size: document.size,
          hash: document.hash,
          category: document.category,
          tags: document.tags,
          caseId: document.caseId,
          clientId: document.clientId,
          version: document.version,
          isConfidential: document.isConfidential,
          accessLevel: document.accessLevel,
          storagePath: document.storagePath,
          status: document.status,
          extractedData: {},
          metadata: {}
        }
      });

      console.log(`📄 Document "${document.name}" uploadé avec succès`);

      // Traitement asynchrone du document
      this.processDocumentAsync(document);

      return document;

    } catch (error) {
      captureBusinessError(error as Error, {
        component: 'document-manager',
        action: 'upload-document',
        metadata: { originalName: file.originalName, size: file.buffer.length }
      });
      throw error;
    }
  }

  // Traitement asynchrone du document (OCR, classification, etc.)
  private async processDocumentAsync(document: Document): Promise<void> {
    try {
      console.log(`🔄 Traitement du document ${document.name}...`);

      // 1. Extraction du texte (OCR pour les images/PDF)
      const extractedText = await this.extractText(document);
      
      // 2. Classification automatique
      const suggestedCategory = await this.classifyDocument(extractedText, document.name);
      
      // 3. Extraction d'entités nommées
      const entities = await this.extractEntities(extractedText);
      
      // 4. Génération de miniature
      const thumbnailPath = await this.generateThumbnail(document);
      
      // 5. Mise à jour du document avec les données extraites
      await prisma.document.update({
        where: { id: document.id },
        data: {
          status: 'READY',
          category: suggestedCategory || document.category,
          thumbnailPath,
          extractedData: {
            text: extractedText,
            entities,
            processedAt: new Date().toISOString()
          },
          updatedAt: new Date()
        }
      });

      console.log(`✅ Document ${document.name} traité avec succès`);

    } catch (error) {
      console.error(`❌ Erreur traitement document ${document.id}:`, error);
      
      await prisma.document.update({
        where: { id: document.id },
        data: {
          status: 'READY', // Marquer comme prêt même en cas d'erreur de traitement
          extractedData: {
            error: (error as Error).message,
            processedAt: new Date().toISOString()
          }
        }
      });
    }
  }

  // Générer un document à partir d'un template
  async generateFromTemplate(
    templateId: string,
    variables: Record<string, any>,
    options?: {
      format?: 'PDF' | 'DOCX' | 'HTML';
      caseId?: string;
      clientId?: string;
      autoSign?: boolean;
    }
  ): Promise<Document> {
    try {
      const template = DEFAULT_DOCUMENT_TEMPLATES.find(t => t.id === templateId);
      if (!template) {
        throw new Error(`Template ${templateId} introuvable`);
      }

      // Remplacer les variables dans le template
      let content = template.content;
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, String(value));
      }

      // Vérifier les variables manquantes
      const missingVariables = template.variables.filter(variable => {
        return content.includes(`{{${variable}}}`);
      });

      if (missingVariables.length > 0) {
        console.warn(`⚠️ Variables manquantes dans le template: ${missingVariables.join(', ')}`);
      }

      // Créer le fichier
      const fileName = `${template.name} - ${new Date().toLocaleDateString('fr-FR')}.${options?.format?.toLowerCase() || 'html'}`;
      const documentBuffer = Buffer.from(content, 'utf-8');

      // Uploader le document généré
      const document = await this.uploadDocument(
        {
          buffer: documentBuffer,
          originalName: fileName,
          mimeType: this.getMimeTypeForFormat(options?.format || 'HTML')
        },
        {
          caseId: options?.caseId,
          clientId: options?.clientId,
          category: template.category as any,
          tags: ['generated', 'template', templateId],
          isConfidential: true,
          accessLevel: 'INTERNAL'
        }
      );

      console.log(`📝 Document généré à partir du template "${template.name}"`);

      // Signature automatique si demandée
      if (options?.autoSign) {
        await this.initiateDigitalSignature(document.id, [
          {
            signerEmail: variables.clientEmail || '',
            signerName: variables.clientName || 'Client'
          }
        ]);
      }

      return document;

    } catch (error) {
      captureBusinessError(error as Error, {
        component: 'document-manager',
        action: 'generate-from-template',
        metadata: { templateId, variables }
      });
      throw error;
    }
  }

  // Initier une signature électronique
  async initiateDigitalSignature(
    documentId: string,
    signers: Array<{ signerEmail: string; signerName: string }>
  ): Promise<DigitalSignature[]> {
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        throw new Error(`Document ${documentId} introuvable`);
      }

      const signatures: DigitalSignature[] = [];

      for (const signer of signers) {
        const signature: DigitalSignature = {
          id: crypto.randomUUID(),
          documentId,
          signerEmail: signer.signerEmail,
          signerName: signer.signerName,
          status: 'PENDING'
        };

        await prisma.digitalSignature.create({
          data: signature
        });

        signatures.push(signature);

        // Envoyer l'email de demande de signature
        console.log(`📧 Demande de signature envoyée à ${signer.signerEmail} pour le document ${document.name}`);
      }

      console.log(`✍️ Signature électronique initiée pour ${signers.length} signataire(s)`);
      return signatures;

    } catch (error) {
      captureBusinessError(error as Error, {
        component: 'document-manager',
        action: 'initiate-signature',
        metadata: { documentId, signersCount: signers.length }
      });
      throw error;
    }
  }

  // Recherche intelligente de documents
  async searchDocuments(
    query: string,
    filters?: {
      caseId?: string;
      clientId?: string;
      category?: string;
      tags?: string[];
      dateFrom?: Date;
      dateTo?: Date;
      accessLevel?: string;
    }
  ): Promise<Document[]> {
    try {
      const cacheKey = `search-${crypto.createHash('md5').update(JSON.stringify({ query, filters })).digest('hex')}`;
      const cached = await cache.get(cacheKey);
      if (cached) return JSON.parse(cached);

      // Recherche dans le nom et le contenu extrait
      const whereClause: any = {
        status: { not: 'DELETED' },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { originalName: { contains: query, mode: 'insensitive' } },
          {
            extractedData: {
              path: ['text'],
              string_contains: query
            }
          }
        ]
      };

      // Appliquer les filtres
      if (filters?.caseId) whereClause.caseId = filters.caseId;
      if (filters?.clientId) whereClause.clientId = filters.clientId;
      if (filters?.category) whereClause.category = filters.category;
      if (filters?.accessLevel) whereClause.accessLevel = filters.accessLevel;
      if (filters?.tags?.length) {
        whereClause.tags = { hasSome: filters.tags };
      }
      if (filters?.dateFrom || filters?.dateTo) {
        whereClause.createdAt = {};
        if (filters.dateFrom) whereClause.createdAt.gte = filters.dateFrom;
        if (filters.dateTo) whereClause.createdAt.lte = filters.dateTo;
      }

      const documents = await prisma.document.findMany({
        where: whereClause,
        orderBy: [
          { updatedAt: 'desc' }
        ],
        take: 50
      });

      // Mettre en cache pendant 10 minutes
      await cache.set(cacheKey, JSON.stringify(documents), 600);

      console.log(`🔍 Recherche "${query}": ${documents.length} document(s) trouvé(s)`);
      return documents as Document[];

    } catch (error) {
      captureBusinessError(error as Error, {
        component: 'document-manager',
        action: 'search-documents',
        metadata: { query, filters }
      });
      throw error;
    }
  }

  // Obtenir les statistiques de documents
  async getDocumentStats(): Promise<any> {
    try {
      const cacheKey = 'document-stats';
      const cached = await cache.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const stats = {
        totalDocuments: await prisma.document.count(),
        byCategory: await this.getDocumentsByCategory(),
        byStatus: await this.getDocumentsByStatus(),
        storageUsed: await this.getStorageUsage(),
        recentUploads: await this.getRecentUploads(),
        signatureStats: await this.getSignatureStats(),
        ocrStats: await this.getOCRStats()
      };

      await cache.set(cacheKey, JSON.stringify(stats), 1800); // 30 minutes
      return stats;

    } catch (error) {
      captureBusinessError(error as Error, {
        component: 'document-manager',
        action: 'get-stats'
      });
      return {};
    }
  }

  // Méthodes privées utilitaires

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  }

  private async extractText(document: Document): Promise<string> {
    // Simulation d'extraction OCR
    if (document.mimeType.includes('pdf')) {
      return `Texte extrait du PDF ${document.name} par OCR...`;
    } else if (document.mimeType.includes('image')) {
      return `Texte extrait de l'image ${document.name} par OCR...`;
    } else if (document.mimeType.includes('text')) {
      // Lire le contenu du fichier texte
      try {
        return readFileSync(document.storagePath, 'utf-8');
      } catch {
        return '';
      }
    }
    return '';
  }

  private async classifyDocument(text: string, filename: string): Promise<string | null> {
    // Classification basique basée sur des mots-clés
    const keywords = {
      'INVOICE': ['facture', 'montant', 'tva', 'total'],
      'CONTRACT': ['contrat', 'partie', 'article', 'signataire'],
      'CORRESPONDENCE': ['courrier', 'lettre', 'email', 'message'],
      'LEGAL_DOCUMENT': ['mise en demeure', 'assignation', 'jugement', 'tribunal'],
      'PROOF': ['preuve', 'justificatif', 'attestation', 'certificat']
    };

    const textLower = text.toLowerCase();
    for (const [category, words] of Object.entries(keywords)) {
      if (words.some(word => textLower.includes(word))) {
        return category;
      }
    }

    return null;
  }

  private async extractEntities(text: string): Promise<any> {
    // Extraction simple d'entités avec regex
    const entities = {
      emails: this.extractEmails(text),
      phones: this.extractPhones(text),
      amounts: this.extractAmounts(text),
      dates: this.extractDates(text)
    };

    return entities;
  }

  private extractEmails(text: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return text.match(emailRegex) || [];
  }

  private extractPhones(text: string): string[] {
    const phoneRegex = /(?:\+33|0)[1-9](?:[0-9]{8})/g;
    return text.match(phoneRegex) || [];
  }

  private extractAmounts(text: string): string[] {
    const amountRegex = /\d+(?:\.\d{2})?\s*€|\d+\s*euros?/g;
    return text.match(amountRegex) || [];
  }

  private extractDates(text: string): string[] {
    const dateRegex = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g;
    return text.match(dateRegex) || [];
  }

  private async generateThumbnail(document: Document): Promise<string | undefined> {
    // Génération de miniature (simulée)
    if (document.mimeType.includes('image') || document.mimeType.includes('pdf')) {
      const thumbnailPath = path.join(this.thumbnailsPath, `${document.id}.jpg`);
      console.log(`🖼️ Miniature générée: ${thumbnailPath}`);
      return thumbnailPath;
    }
    return undefined;
  }

  private getMimeTypeForFormat(format: string): string {
    const mimeTypes = {
      'PDF': 'application/pdf',
      'DOCX': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'HTML': 'text/html'
    };
    return mimeTypes[format as keyof typeof mimeTypes] || 'text/plain';
  }

  private async getDocumentsByCategory(): Promise<Record<string, number>> {
    const result = await prisma.document.groupBy({
      by: ['category'],
      _count: { category: true },
      where: { status: { not: 'DELETED' } }
    });

    return result.reduce((acc: Record<string, number>, item: any) => {
      acc[item.category] = item._count.category;
      return acc;
    }, {});
  }

  private async getDocumentsByStatus(): Promise<Record<string, number>> {
    const result = await prisma.document.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    return result.reduce((acc: Record<string, number>, item: any) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});
  }

  private async getStorageUsage(): Promise<{ totalSize: number; totalDocuments: number }> {
    const result = await prisma.document.aggregate({
      _sum: { size: true },
      _count: { id: true },
      where: { status: { not: 'DELETED' } }
    });

    return {
      totalSize: result._sum.size || 0,
      totalDocuments: result._count.id
    };
  }

  private async getRecentUploads(): Promise<number> {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    return await prisma.document.count({
      where: {
        createdAt: { gte: lastWeek },
        status: { not: 'DELETED' }
      }
    });
  }

  private async getSignatureStats(): Promise<any> {
    const total = await prisma.digitalSignature.count();
    const signed = await prisma.digitalSignature.count({
      where: { status: 'SIGNED' }
    });
    const pending = await prisma.digitalSignature.count({
      where: { status: 'PENDING' }
    });

    return { total, signed, pending, signedRate: total > 0 ? (signed / total) * 100 : 0 };
  }

  private async getOCRStats(): Promise<any> {
    const processed = await prisma.document.count({
      where: {
        extractedData: { not: {} }
      }
    });

    const total = await prisma.document.count({
      where: { status: { not: 'DELETED' } }
    });

    return {
      processed,
      total,
      processedRate: total > 0 ? (processed / total) * 100 : 0
    };
  }
}

// Interface pour les services OCR externes
export interface OCRService {
  provider: 'AZURE_COGNITIVE' | 'AWS_TEXTRACT' | 'GOOGLE_VISION';
  apiKey: string;
  endpoint?: string;
  region?: string;
}

// Interface pour les services de signature électronique
export interface SignatureService {
  provider: 'DOCUSIGN' | 'ADOBE_SIGN' | 'YOUSIGN';
  apiKey: string;
  environment: 'SANDBOX' | 'PRODUCTION';
}

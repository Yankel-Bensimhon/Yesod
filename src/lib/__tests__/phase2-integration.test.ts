import { RecoveryWorkflowEngine } from '../workflow/recovery-engine';
import { AdvancedInvoicingModule } from '../invoicing/advanced-invoicing';
import { ProfessionalCommunicationService } from '../communication/professional-communication';
import { IntelligentCalendarService } from '../calendar/intelligent-calendar';
import { AdvancedDocumentManager } from '../documents/advanced-document-manager';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    case: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockResolvedValue({ id: 'test-case-id' }),
      update: jest.fn().mockResolvedValue({ id: 'test-case-id' })
    },
    action: {
      create: jest.fn().mockResolvedValue({ id: 'test-action-id' }),
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([])
    },
    invoice: {
      create: jest.fn().mockResolvedValue({ id: 'test-invoice-id', number: 'FAC20250001' }),
      findUnique: jest.fn().mockResolvedValue(null),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _sum: { total: 0 }, _count: { id: 0 } })
    },
    payment: {
      create: jest.fn().mockResolvedValue({ id: 'test-payment-id' }),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: 0 } })
    },
    paymentPlan: {
      create: jest.fn().mockResolvedValue({ id: 'test-plan-id' })
    },
    calendarEvent: {
      create: jest.fn().mockResolvedValue({ id: 'test-event-id' }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([])
    },
    document: {
      create: jest.fn().mockResolvedValue({ id: 'test-doc-id' }),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({ id: 'test-doc-id' }),
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({ _sum: { size: 0 }, _count: { id: 0 } })
    },
    digitalSignature: {
      create: jest.fn().mockResolvedValue({ id: 'test-signature-id' }),
      count: jest.fn().mockResolvedValue(0)
    },
    communicationLog: {
      create: jest.fn().mockResolvedValue({ id: 'test-comm-id' }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      groupBy: jest.fn().mockResolvedValue([])
    },
    communicationTemplate: {
      create: jest.fn().mockResolvedValue({ id: 'test-template-id' })
    },
    client: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'test-client-id',
        name: 'Test Client',
        email: 'client@test.com'
      })
    }
  }))
}));

// Mock des autres dépendances
jest.mock('../redis', () => ({
  CacheService: {
    getInstance: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true),
      del: jest.fn().mockResolvedValue(true)
    })
  }
}));

jest.mock('../sentry', () => ({
  captureBusinessError: jest.fn()
}));

jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('test content'),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn()
}));

jest.mock('nodemailer', () => ({
  createTransporter: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  })
}));

describe('Phase 2 - CRM Avancé', () => {
  describe('RecoveryWorkflowEngine', () => {
    it('devrait évaluer les dossiers en retard', async () => {
      const engine = RecoveryWorkflowEngine.getInstance();
      
      expect(engine).toBeDefined();
      expect(typeof engine.evaluateAllCases).toBe('function');
      
      // Test de l'évaluation sans erreur
      await expect(engine.evaluateAllCases()).resolves.not.toThrow();
    });

    it('devrait retourner des statistiques de workflow', async () => {
      const engine = RecoveryWorkflowEngine.getInstance();
      const stats = await engine.getWorkflowStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });
  });

  describe('AdvancedInvoicingModule', () => {
    it('devrait créer une facture', async () => {
      const invoicing = AdvancedInvoicingModule.getInstance();
      
      const invoiceData = {
        clientId: 'test-client-id',
        items: [
          {
            description: 'Prestation de recouvrement',
            quantity: 1,
            unitPrice: 1000,
            vatRate: 20,
            total: 1000
          }
        ],
        paymentTerms: 30
      };

      const invoice = await invoicing.generateInvoice(invoiceData);
      
      expect(invoice).toBeDefined();
      expect(invoice.id).toBeDefined();
      expect(invoice.clientId).toBe('test-client-id');
      expect(invoice.items).toHaveLength(1);
    });

    // Test PDF generation
    it.skip('devrait générer un PDF de facture', async () => {
      const invoicing = AdvancedInvoicingModule.getInstance();
      
      // Mock du retour de findUnique pour la facture
      const mockInvoice = {
        id: 'test-invoice-id',
        number: 'FAC20250001',
        date: new Date(),
        dueDate: new Date(),
        total: 1200,
        subtotal: 1000,
        vatAmount: 200,
        items: [{
          description: 'Test item',
          quantity: 1,
          unitPrice: 1000,
          vatRate: 20,
          total: 1000
        }],
        client: {
          name: 'Test Client',
          email: 'client@test.com',
          address: 'Test Address'
        },
        case: null
      };

      require('@prisma/client').PrismaClient().invoice.findUnique.mockResolvedValue(mockInvoice);

      const pdfBuffer = await invoicing.generateInvoicePDF('test-invoice-id');
      
      expect(pdfBuffer).toBeDefined();
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    });

    it('devrait retourner des statistiques de facturation', async () => {
      const invoicing = AdvancedInvoicingModule.getInstance();
      const stats = await invoicing.getInvoicingStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });
  });

  describe('ProfessionalCommunicationService', () => {
    it('devrait envoyer un email avec template', async () => {
      const communication = ProfessionalCommunicationService.getInstance();
      
      const variables = {
        clientId: 'test-client-id',
        debtorName: 'Test Debtor',
        amount: '1000',
        caseReference: 'TEST-001',
        dueDate: '31/12/2024',
        daysOverdue: '15'
      };

      const logId = await communication.sendEmail(
        'gentle-reminder',
        'debtor@test.com',
        variables
      );
      
      expect(logId).toBeDefined();
      expect(typeof logId).toBe('string');
    });

    it('devrait envoyer un SMS avec template', async () => {
      const communication = ProfessionalCommunicationService.getInstance();
      
      const variables = {
        clientId: 'test-client-id',
        amount: '1000',
        caseReference: 'TEST-001'
      };

      const logId = await communication.sendSMS(
        'sms-reminder',
        '+33123456789',
        variables
      );
      
      expect(logId).toBeDefined();
      expect(typeof logId).toBe('string');
    });

    it('devrait retourner des statistiques de communication', async () => {
      const communication = ProfessionalCommunicationService.getInstance();
      const stats = await communication.getCommunicationStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });
  });

  describe('IntelligentCalendarService', () => {
    it('devrait créer un événement', async () => {
      const calendar = IntelligentCalendarService.getInstance();
      
      const eventData = {
        title: 'Rendez-vous client',
        startDate: new Date('2025-08-01T10:00:00'),
        endDate: new Date('2025-08-01T11:00:00'),
        type: 'APPOINTMENT' as const,
        clientId: 'test-client-id'
      };

      const event = await calendar.createEvent(eventData);
      
      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.title).toBe('Rendez-vous client');
      expect(event.type).toBe('APPOINTMENT');
    });

    it('devrait trouver des créneaux disponibles', async () => {
      const calendar = IntelligentCalendarService.getInstance();
      
      const date = new Date('2025-08-01');
      const duration = 60; // 1 heure
      
      const slots = await calendar.findAvailableSlots(date, duration);
      
      expect(Array.isArray(slots)).toBe(true);
    });

    it.skip('devrait créer des événements automatiques pour un dossier', async () => {
      const calendar = IntelligentCalendarService.getInstance();
      
      // Mock des données de dossier
      const mockCase = {
        id: 'test-case-id',
        reference: 'TEST-001',
        clientId: 'test-client-id',
        client: { name: 'Test Client' },
        debtor: { name: 'Test Debtor' }
      };

      require('@prisma/client').PrismaClient().case.findUnique.mockResolvedValue(mockCase);

      const events = await calendar.createCaseBasedEvents('test-case-id');
      
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
    });

    it('devrait retourner des statistiques du calendrier', async () => {
      const calendar = IntelligentCalendarService.getInstance();
      const stats = await calendar.getCalendarStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });
  });

  describe('AdvancedDocumentManager', () => {
    it('devrait uploader un document', async () => {
      const docManager = AdvancedDocumentManager.getInstance();
      
      const file = {
        buffer: Buffer.from('test content'),
        originalName: 'test-document.pdf',
        mimeType: 'application/pdf'
      };

      const metadata = {
        caseId: 'test-case-id',
        category: 'CONTRACT' as const,
        tags: ['test', 'upload']
      };

      const document = await docManager.uploadDocument(file, metadata);
      
      expect(document).toBeDefined();
      expect(document.id).toBeDefined();
      expect(document.name).toBeDefined();
      expect(document.category).toBe('CONTRACT');
      expect(document.tags).toContain('test');
    });

    it('devrait générer un document à partir d\'un template', async () => {
      const docManager = AdvancedDocumentManager.getInstance();
      
      const variables = {
        cabinetName: 'Cabinet Yesod',
        clientName: 'Test Client',
        debtorName: 'Test Debtor',
        amount: '1000',
        date: '01/08/2025'
      };

      const document = await docManager.generateFromTemplate(
        'mise-en-demeure-standard',
        variables,
        {
          format: 'PDF' as const,
          caseId: 'test-case-id'
        }
      );
      
      expect(document).toBeDefined();
      expect(document.id).toBeDefined();
      expect(document.tags).toContain('generated');
      expect(document.tags).toContain('template');
    });

    it('devrait rechercher des documents', async () => {
      const docManager = AdvancedDocumentManager.getInstance();
      
      const documents = await docManager.searchDocuments(
        'test',
        {
          category: 'CONTRACT',
          caseId: 'test-case-id'
        }
      );
      
      expect(Array.isArray(documents)).toBe(true);
    });

    it('devrait retourner des statistiques de documents', async () => {
      const docManager = AdvancedDocumentManager.getInstance();
      const stats = await docManager.getDocumentStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });
  });

  describe('Intégration Phase 2', () => {
    it('devrait créer un workflow complet dossier → facture → communication → calendrier', async () => {
      const workflow = RecoveryWorkflowEngine.getInstance();
      const invoicing = AdvancedInvoicingModule.getInstance();
      const communication = ProfessionalCommunicationService.getInstance();
      const calendar = IntelligentCalendarService.getInstance();
      
      // 1. Évaluer les workflows
      await expect(workflow.evaluateAllCases()).resolves.not.toThrow();
      
      // 2. Créer une facture
      const invoice = await invoicing.generateInvoice({
        clientId: 'test-client-id',
        items: [{ description: 'Test', quantity: 1, unitPrice: 1000, vatRate: 20, total: 1000 }]
      });
      expect(invoice.id).toBeDefined();
      
      // 3. Envoyer une communication
      const commId = await communication.sendEmail(
        'gentle-reminder',
        'test@example.com',
        { clientId: 'test-client-id', debtorName: 'Test', amount: '1000', caseReference: 'TEST-001' }
      );
      expect(commId).toBeDefined();
      
      // 4. Créer un événement calendrier
      const event = await calendar.createEvent({
        title: 'Suivi dossier TEST-001',
        startDate: new Date(Date.now() + 86400000), // Demain
        type: 'CALL' as const
      });
      expect(event.id).toBeDefined();
    });
  });
});

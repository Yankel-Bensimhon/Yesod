/**
 * Tests d'intégration Phase 3 - Intelligence & BI
 * Tests complets des fonctionnalités avancées
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import BusinessIntelligenceEngine from '../analytics/business-intelligence';
import PredictiveScoringEngine from '../ai/predictive-scoring';
import MobileApplicationEngine from '../mobile/mobile-app-engine';
import LegalEcosystemEngine from '../integrations/legal-ecosystem';

// Mock complet de Prisma avec données fictives
const mockPrismaData = {
  cases: [
    { id: '1', status: 'IN_PROGRESS', amount: 5000, clientId: 'c1', createdAt: new Date() },
    { id: '2', status: 'RESOLVED', amount: 3000, clientId: 'c2', createdAt: new Date() }
  ],
  invoices: [
    { id: '1', amount: 5000, status: 'PAID', createdAt: new Date() },
    { id: '2', amount: 3000, status: 'PENDING', createdAt: new Date() }
  ],
  payments: [
    { id: '1', amount: 5000, caseId: '1', createdAt: new Date() }
  ],
  clients: [
    { id: 'c1', name: 'Client Test 1', companyName: 'Entreprise 1' },
    { id: 'c2', name: 'Client Test 2', companyName: 'Entreprise 2' }
  ]
};

// Mock Prisma avec le bon chemin d'alias
jest.mock('@/lib/prisma', () => ({
  prisma: {
    case: {
      findMany: () => Promise.resolve(mockPrismaData.cases),
      findUnique: () => Promise.resolve(mockPrismaData.cases[0]),
      groupBy: () => Promise.resolve([
        { status: 'IN_PROGRESS', _count: { _all: 1 } },
        { status: 'RESOLVED', _count: { _all: 1 } }
      ]),
      count: () => Promise.resolve(2)
    },
    client: {
      findMany: () => Promise.resolve(mockPrismaData.clients),
      findUnique: () => Promise.resolve(mockPrismaData.clients[0]),
      count: () => Promise.resolve(2)
    },
    invoice: {
      findMany: () => Promise.resolve(mockPrismaData.invoices),
      findUnique: () => Promise.resolve(mockPrismaData.invoices[0]),
      count: () => Promise.resolve(2),
      aggregate: () => Promise.resolve({
        _sum: { amount: 8000 },
        _avg: { amount: 4000 },
        _count: { _all: 2 }
      })
    },
    payment: {
      findMany: () => Promise.resolve(mockPrismaData.payments),
      aggregate: () => Promise.resolve({
        _sum: { amount: 5000 },
        _count: { _all: 1 }
      })
    }
  }
}));

describe('Phase 3 - Intelligence & Business Intelligence', () => {
  describe('BusinessIntelligenceEngine', () => {
    let biEngine: BusinessIntelligenceEngine;

    beforeEach(() => {
      biEngine = BusinessIntelligenceEngine.getInstance();
    });

    test('devrait calculer les KPIs métier', async () => {
      const kpis = await biEngine.calculateBusinessKPIs('month');
      
      expect(kpis).toBeDefined();
      expect(typeof kpis.totalRevenue).toBe('number');
      expect(typeof kpis.collectionRate).toBe('number');
      expect(typeof kpis.activeCases).toBe('number');
      expect(kpis.collectionRate).toBeGreaterThanOrEqual(0);
      expect(kpis.collectionRate).toBeLessThanOrEqual(100);
    });

    test('devrait générer des données de séries temporelles', async () => {
      const timeSeriesData = await biEngine.generateTimeSeriesData('revenue', '30d');
      
      expect(Array.isArray(timeSeriesData)).toBe(true);
      expect(timeSeriesData.length).toBeGreaterThan(0);
      
      timeSeriesData.forEach(point => {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('value');
        expect(typeof point.value).toBe('number');
      });
    });

    test('devrait préparer des données de graphiques', async () => {
      const chartData = await biEngine.prepareChartData('revenue_trend');
      
      expect(chartData).toBeDefined();
      expect(chartData).toHaveProperty('labels');
      expect(chartData).toHaveProperty('datasets');
      expect(Array.isArray(chartData.labels)).toBe(true);
      expect(Array.isArray(chartData.datasets)).toBe(true);
    });

    test('devrait générer des insights prédictifs', async () => {
      const insights = await biEngine.generatePredictiveInsights();
      
      expect(Array.isArray(insights)).toBe(true);
      
      insights.forEach(insight => {
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('prediction');
        expect(insight).toHaveProperty('confidence');
        expect(insight.confidence).toBeGreaterThanOrEqual(0);
        expect(insight.confidence).toBeLessThanOrEqual(100);
      });
    });

    test('devrait générer un rapport exécutif complet', async () => {
      const report = await biEngine.generateExecutiveReport('month');
      
      expect(report).toBeDefined();
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('trends');
      expect(report).toHaveProperty('charts');
      expect(report).toHaveProperty('predictions');
      expect(report).toHaveProperty('insights');
      expect(report).toHaveProperty('recommendations');
      
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('PredictiveScoringEngine', () => {
    let scoringEngine: PredictiveScoringEngine;

    beforeEach(() => {
      scoringEngine = PredictiveScoringEngine.getInstance();
    });

    test('devrait calculer le score d\'un dossier', async () => {
      // Mock des données de dossier
      const mockCase = {
        id: 'test-case-id',
        amount: 5000,
        createdAt: new Date(),
        client: { name: 'Test Client' },
        debtor: { 
          id: 'test-debtor-id',
          type: 'COMPANY',
          cases: []
        },
        invoices: [],
        communications: [],
        documents: []
      };

      require('@/lib/prisma').prisma.case.findUnique.mockResolvedValue(mockCase);

      const score = await scoringEngine.calculateCaseScore('test-case-id');
      
      expect(score).toBeDefined();
      expect(score.caseId).toBe('test-case-id');
      expect(score.overallScore).toBeGreaterThanOrEqual(0);
      expect(score.overallScore).toBeLessThanOrEqual(100);
      expect(score.collectionProbability).toBeGreaterThanOrEqual(0);
      expect(score.collectionProbability).toBeLessThanOrEqual(100);
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(score.riskLevel);
      expect(Array.isArray(score.factors)).toBe(true);
    });

    test('devrait générer des recommandations IA', async () => {
      const mockCase = {
        id: 'test-case-id',
        amount: 5000,
        createdAt: new Date(),
        client: { name: 'Test Client' },
        debtor: { 
          id: 'test-debtor-id',
          type: 'COMPANY',
          cases: []
        },
        invoices: [],
        communications: [],
        documents: []
      };

      require('@/lib/prisma').prisma.case.findUnique.mockResolvedValue(mockCase);

      const recommendations = await scoringEngine.generateAIRecommendations('test-case-id');
      
      expect(Array.isArray(recommendations)).toBe(true);
      
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('id');
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('title');
        expect(rec).toHaveProperty('confidence');
        expect(['high', 'medium', 'low']).toContain(rec.priority);
      });
    });

    test('devrait générer un profil de débiteur', async () => {
      const mockCase = {
        id: 'test-case-id',
        debtor: {
          id: 'test-debtor-id',
          cases: [
            {
              id: 'case1',
              status: 'RESOLVED',
              invoices: [{ payments: [{ amount: 1000 }] }],
              communications: []
            }
          ]
        }
      };

      require('@/lib/prisma').prisma.case.findUnique.mockResolvedValue(mockCase);

      const profile = await scoringEngine.generateDebtorProfile('test-case-id');
      
      expect(profile).toBeDefined();
      expect(profile.debtorId).toBe('test-debtor-id');
      expect(['A', 'B', 'C', 'D']).toContain(profile.riskCategory);
      expect(['excellent', 'good', 'average', 'poor', 'defaulter']).toContain(profile.paymentBehavior);
      expect(profile.financialStability).toBeGreaterThanOrEqual(0);
      expect(profile.financialStability).toBeLessThanOrEqual(100);
    });

    test('devrait analyser les dossiers en batch', async () => {
      const mockCases = [
        { id: 'case1' },
        { id: 'case2' },
        { id: 'case3' }
      ];

      require('@/lib/prisma').prisma.case.findMany.mockResolvedValue(mockCases);

      const batchResult = await scoringEngine.analyzeBatchCases();
      
      expect(batchResult).toBeDefined();
      expect(typeof batchResult.totalAnalyzed).toBe('number');
      expect(Array.isArray(batchResult.highRiskCases)).toBe(true);
      expect(Array.isArray(batchResult.recommendations)).toBe(true);
      expect(Array.isArray(batchResult.insights)).toBe(true);
    });
  });

  describe('MobileApplicationEngine', () => {
    let mobileEngine: MobileApplicationEngine;

    beforeEach(() => {
      mobileEngine = MobileApplicationEngine.getInstance();
      
      // Mock navigator APIs
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
        writable: true
      });
    });

    test('devrait détecter les capacités mobiles', async () => {
      const capabilities = await mobileEngine.detectMobileCapabilities();
      
      expect(capabilities).toBeDefined();
      expect(capabilities).toHaveProperty('offline');
      expect(capabilities).toHaveProperty('geolocation');
      expect(capabilities).toHaveProperty('camera');
      expect(capabilities).toHaveProperty('push');
      expect(capabilities).toHaveProperty('background');
      
      Object.values(capabilities).forEach(capability => {
        expect(typeof capability).toBe('boolean');
      });
    });

    test('devrait gérer les actions hors-ligne', async () => {
      const action = {
        type: 'create' as const,
        entity: 'case' as const,
        data: { name: 'Test Case' }
      };

      await expect(mobileEngine.addOfflineAction(action)).resolves.not.toThrow();
    });

    test('devrait générer un rapport d\'activité mobile', async () => {
      const report = await mobileEngine.generateMobileActivityReport();
      
      expect(report).toBeDefined();
      expect(typeof report.geolocationUsage).toBe('number');
      expect(typeof report.documentsScanned).toBe('number');
      expect(typeof report.offlineActions).toBe('number');
      expect(typeof report.appointmentsHandled).toBe('number');
      expect(typeof report.notifications).toBe('number');
    });

    test('devrait simuler scan de document', async () => {
      // Mock getUserMedia global
      Object.defineProperty(global, 'navigator', {
        value: {
          mediaDevices: {
            getUserMedia: () => Promise.resolve({
              getTracks: () => [{ stop: () => {} }]
            })
          }
        },
        writable: true
      });

      const scanResult = await mobileEngine.scanDocument();
      
      expect(scanResult).toBeDefined();
      expect(scanResult.type).toBe('document');
      expect(typeof scanResult.content).toBe('string');
      expect(scanResult.confidence).toBeGreaterThanOrEqual(0);
      expect(scanResult.confidence).toBeLessThanOrEqual(100);
      expect(scanResult.metadata).toBeDefined();
    });
  });

  describe('LegalEcosystemEngine', () => {
    let legalEngine: LegalEcosystemEngine;

    beforeEach(() => {
      legalEngine = LegalEcosystemEngine.getInstance();
    });

    test('devrait récupérer des données d\'entreprise', async () => {
      const siret = '73282932000074'; // SIRET valide (Microsoft France)
      
      const companyData = await legalEngine.getCompanyDataFromInfogreffe(siret);
      
      expect(companyData).toBeDefined();
      expect(companyData.siret).toBe(siret);
      expect(companyData.siren).toBe(siret.substring(0, 9));
      expect(typeof companyData.denomination).toBe('string');
      expect(typeof companyData.formeJuridique).toBe('string');
      expect(companyData.dateCreation).toBeInstanceOf(Date);
      expect(Array.isArray(companyData.dirigeants)).toBe(true);
    });

    test('devrait obtenir un score de crédit', async () => {
      const siren = '123456789';
      
      const creditScore = await legalEngine.getCreditScoreFromBanqueDeFrance(siren);
      
      expect(creditScore).toBeDefined();
      expect(creditScore.score).toBeGreaterThanOrEqual(0);
      expect(creditScore.score).toBeLessThanOrEqual(1000);
      expect(['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'E']).toContain(creditScore.classe);
      expect(creditScore.probabiliteDefaut).toBeGreaterThanOrEqual(0);
      expect(creditScore.probabiliteDefaut).toBeLessThanOrEqual(100);
      expect(Array.isArray(creditScore.incidents)).toBe(true);
    });

    test('devrait rechercher des procédures judiciaires', async () => {
      const companyName = 'Test Company';
      
      const procedures = await legalEngine.searchCourtProcedures(companyName);
      
      expect(Array.isArray(procedures)).toBe(true);
      
      procedures.forEach(proc => {
        expect(proc).toHaveProperty('id');
        expect(proc).toHaveProperty('tribunal');
        expect(proc).toHaveProperty('numeroRG');
        expect(['CIVILE', 'COMMERCIALE', 'ADMINISTRATIVE']).toContain(proc.nature);
        expect(['EN_COURS', 'TERMINEE', 'SUSPENDUE']).toContain(proc.statut);
        expect(Array.isArray(proc.parties)).toBe(true);
      });
    });

    test('devrait trouver des huissiers partenaires', async () => {
      const postalCode = '75001';
      
      const partners = await legalEngine.findBailiffPartners(postalCode);
      
      expect(Array.isArray(partners)).toBe(true);
      
      partners.forEach(partner => {
        expect(partner).toHaveProperty('id');
        expect(partner).toHaveProperty('nom');
        expect(partner).toHaveProperty('etude');
        expect(partner).toHaveProperty('contact');
        expect(partner).toHaveProperty('tarifs');
        expect(Array.isArray(partner.specialites)).toBe(true);
        expect(['DISPONIBLE', 'OCCUPE', 'INDISPONIBLE']).toContain(partner.disponibilite);
      });
    });

    test('devrait synchroniser avec logiciel comptable', async () => {
      const software = 'SAGE';
      
      const syncResult = await legalEngine.syncWithAccountingSoftware(software);
      
      expect(syncResult).toBeDefined();
      expect(syncResult.software).toBe(software);
      expect(typeof syncResult.connected).toBe('boolean');
      expect(syncResult.lastSync).toBeInstanceOf(Date);
      expect(syncResult.syncedEntities).toHaveProperty('clients');
      expect(syncResult.syncedEntities).toHaveProperty('invoices');
      expect(syncResult.syncedEntities).toHaveProperty('payments');
      expect(Array.isArray(syncResult.errors)).toBe(true);
    });

    test('devrait initier une procédure e-justice', async () => {
      const procedureData = {
        type: 'INJONCTION_PAYER' as const,
        tribunal: 'Tribunal de Commerce de Paris',
        parties: [
          {
            role: 'DEMANDEUR' as const,
            nom: 'Cabinet Yesod',
            representant: 'Maître YESOD'
          }
        ],
        montant: 10000,
        documents: ['facture.pdf', 'mise_en_demeure.pdf']
      };

      const result = await legalEngine.initiateEJusticeProcedure(procedureData);
      
      expect(result).toBeDefined();
      expect(typeof result.numero).toBe('string');
      expect(typeof result.statut).toBe('string');
      expect(result.prochaineDateEcheance).toBeInstanceOf(Date);
      expect(typeof result.frais).toBe('number');
    });

    test('devrait générer un rapport d\'intégration', async () => {
      const report = await legalEngine.generateIntegrationReport();
      
      expect(report).toBeDefined();
      expect(Array.isArray(report.activeIntegrations)).toBe(true);
      expect(typeof report.syncStatus).toBe('object');
      expect(typeof report.lastSync).toBe('object');
      expect(typeof report.errorCount).toBe('number');
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('Intégration Phase 3 Complète', () => {
    test('devrait exécuter un workflow d\'intelligence complet', async () => {
      const biEngine = BusinessIntelligenceEngine.getInstance();
      const scoringEngine = PredictiveScoringEngine.getInstance();
      const mobileEngine = MobileApplicationEngine.getInstance();
      const legalEngine = LegalEcosystemEngine.getInstance();

      // 1. Générer rapport BI
      const biReport = await biEngine.generateExecutiveReport('month');
      expect(biReport).toBeDefined();

      // 2. Analyser dossiers avec IA
      const batchAnalysis = await scoringEngine.analyzeBatchCases();
      expect(batchAnalysis.totalAnalyzed).toBeGreaterThanOrEqual(0);

      // 3. Vérifier capacités mobiles
      const mobileCapabilities = await mobileEngine.detectMobileCapabilities();
      expect(mobileCapabilities).toBeDefined();

      // 4. Tester intégrations juridiques
      const integrationReport = await legalEngine.generateIntegrationReport();
      expect(integrationReport.errorCount).toBeLessThanOrEqual(4);

      console.log('✅ Workflow Phase 3 exécuté avec succès');
      console.log(`📊 BI: ${biReport.recommendations.length} recommandations`);
      console.log(`🤖 IA: ${batchAnalysis.highRiskCases.length} dossiers à haut risque`);
      console.log(`📱 Mobile: ${Object.values(mobileCapabilities).filter(Boolean).length}/5 capacités`);
      console.log(`🔗 Intégrations: ${integrationReport.activeIntegrations.length} actives`);
    });

    test('devrait valider la cohérence des données entre moteurs', async () => {
      const biEngine = BusinessIntelligenceEngine.getInstance();
      const scoringEngine = PredictiveScoringEngine.getInstance();

      // Récupérer KPIs BI
      const kpis = await biEngine.calculateBusinessKPIs('month');
      
      // Analyser avec IA
      const batchResult = await scoringEngine.analyzeBatchCases();

      // Vérifier cohérence (simulation)
      expect(kpis.activeCases).toBeGreaterThanOrEqual(0);
      expect(batchResult.totalAnalyzed).toBeGreaterThanOrEqual(0);
      
      // Les dossiers à haut risque ne devraient pas dépasser le total
      expect(batchResult.highRiskCases.length).toBeLessThanOrEqual(batchResult.totalAnalyzed);
    });
  });
});

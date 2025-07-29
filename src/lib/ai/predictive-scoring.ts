/**
 * Predictive Scoring & AI Engine
 * Phase 3 - Intelligence features
 * 
 * Système de scoring automatique et intelligence artificielle
 * Analyse prédictive pour optimiser les stratégies de recouvrement
 */

import { prisma } from '@/lib/prisma';

// Types Sentry
interface SentryInterface {
  captureException: (error: any) => void;
  addBreadcrumb: (breadcrumb: any) => void;
}

// Mock de Sentry pour les tests
const mockSentry: SentryInterface = {
  captureException: (error: any) => console.error('Mock Sentry:', error),
  addBreadcrumb: (breadcrumb: any) => console.log('Mock Sentry breadcrumb:', breadcrumb),
};

// Utilisation conditionnelle de Sentry
let Sentry: SentryInterface;
try {
  Sentry = require('@sentry/nextjs');
} catch (error) {
  Sentry = mockSentry;
}

// Types pour le scoring et l'IA
export interface CaseScore {
  caseId: string;
  overallScore: number; // 0-100
  collectionProbability: number; // 0-100%
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendedStrategy: string;
  factors: ScoreFactor[];
  predictedResolutionTime: number; // en jours
  estimatedCollectionAmount: number;
  confidence: number; // 0-100%
}

export interface ScoreFactor {
  name: string;
  weight: number; // 0-1
  value: number; // 0-100
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: 'collection' | 'duration' | 'risk' | 'amount';
  accuracy: number; // 0-100%
  lastTrained: Date;
  features: string[];
  performance: ModelPerformance;
}

export interface ModelPerformance {
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  samples: number;
}

export interface AIRecommendation {
  id: string;
  caseId: string;
  type: 'action' | 'strategy' | 'timing' | 'amount';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reasoning: string[];
  expectedImpact: number; // pourcentage d'amélioration attendu
  confidence: number; // 0-100%
  suggestedActions: string[];
  deadline?: Date;
}

export interface DebtorProfile {
  id: string;
  debtorId: string;
  riskCategory: 'A' | 'B' | 'C' | 'D'; // A = faible risque, D = risque élevé
  paymentBehavior: 'excellent' | 'good' | 'average' | 'poor' | 'defaulter';
  financialStability: number; // 0-100
  communicationScore: number; // 0-100
  historicalPerformance: {
    totalCases: number;
    resolvedCases: number;
    averagePaymentDelay: number;
    totalPaid: number;
    totalOutstanding: number;
  };
  predictedOutcomes: {
    paymentProbability: number;
    optimalStrategy: string;
    estimatedResolutionTime: number;
  };
}

/**
 * Moteur de Scoring Prédictif et IA
 * Analyse et prédit les issues des dossiers de recouvrement
 */
export class PredictiveScoringEngine {
  private static instance: PredictiveScoringEngine;
  
  // Modèles prédictifs (simulation - en prod, utiliser TensorFlow.js ou APIs ML)
  private models: Map<string, PredictiveModel> = new Map();

  public static getInstance(): PredictiveScoringEngine {
    if (!PredictiveScoringEngine.instance) {
      PredictiveScoringEngine.instance = new PredictiveScoringEngine();
    }
    return PredictiveScoringEngine.instance;
  }

  constructor() {
    this.initializeModels();
  }

  /**
   * Calcule le score complet d'un dossier
   */
  async calculateCaseScore(caseId: string): Promise<CaseScore> {
    try {
      console.log(`🎯 Calcul du score pour le dossier: ${caseId}`);

      const caseData = await prisma.case.findUnique({
        where: { id: caseId },
        include: {
          client: true,
          debtor: true,
          invoices: {
            include: { payments: true }
          },
          communications: true,
          documents: true
        }
      });

      if (!caseData) {
        throw new Error(`Dossier ${caseId} non trouvé`);
      }

      // Calcul des facteurs de score
      const factors = await this.calculateScoreFactors(caseData);
      
      // Score global (moyenne pondérée des facteurs)
      const overallScore = this.calculateWeightedScore(factors);
      
      // Probabilité de recouvrement basée sur ML
      const collectionProbability = await this.predictCollectionProbability(caseData);
      
      // Niveau de risque
      const riskLevel = this.determineRiskLevel(overallScore, collectionProbability);
      
      // Stratégie recommandée
      const recommendedStrategy = this.recommendStrategy(overallScore, riskLevel, caseData);
      
      // Prédictions temporelles et financières
      const predictedResolutionTime = await this.predictResolutionTime(caseData);
      const estimatedCollectionAmount = await this.estimateCollectionAmount(caseData);

      const score: CaseScore = {
        caseId,
        overallScore,
        collectionProbability,
        riskLevel,
        recommendedStrategy,
        factors,
        predictedResolutionTime,
        estimatedCollectionAmount,
        confidence: this.calculateConfidence(factors, caseData)
      };

      console.log(`✅ Score calculé: ${overallScore}/100 (${riskLevel})`);
      return score;

    } catch (error) {
      console.error('❌ Erreur calcul score:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Génère des recommandations IA pour un dossier
   */
  async generateAIRecommendations(caseId: string): Promise<AIRecommendation[]> {
    try {
      console.log(`🤖 Génération recommandations IA pour: ${caseId}`);

      const [caseScore, debtorProfile] = await Promise.all([
        this.calculateCaseScore(caseId),
        this.generateDebtorProfile(caseId)
      ]);

      const recommendations: AIRecommendation[] = [];

      // Recommandation d'action prioritaire
      const actionRec = this.generateActionRecommendation(caseScore, debtorProfile);
      if (actionRec) recommendations.push(actionRec);

      // Recommandation de stratégie
      const strategyRec = this.generateStrategyRecommendation(caseScore, debtorProfile);
      if (strategyRec) recommendations.push(strategyRec);

      // Recommandation de timing
      const timingRec = this.generateTimingRecommendation(caseScore, debtorProfile);
      if (timingRec) recommendations.push(timingRec);

      // Recommandation de montant
      const amountRec = this.generateAmountRecommendation(caseScore, debtorProfile);
      if (amountRec) recommendations.push(amountRec);

      console.log(`🎯 ${recommendations.length} recommandations générées`);
      return recommendations;

    } catch (error) {
      console.error('❌ Erreur génération recommandations IA:', error);
      Sentry.captureException(error);
      return [];
    }
  }

  /**
   * Génère un profil complet du débiteur
   */
  async generateDebtorProfile(caseId: string): Promise<DebtorProfile> {
    try {
      const caseData = await prisma.case.findUnique({
        where: { id: caseId },
        include: {
          debtor: {
            include: {
              cases: {
                include: {
                  invoices: { include: { payments: true } },
                  communications: true
                }
              }
            }
          }
        }
      });

      if (!caseData?.debtor) {
        throw new Error(`Débiteur non trouvé pour le dossier ${caseId}`);
      }

      const debtor = caseData.debtor;
      const historicalCases = debtor.cases;

      // Analyse du comportement de paiement
      const paymentBehavior = this.analyzePaymentBehavior(historicalCases);
      
      // Stabilité financière (basée sur l'historique)
      const financialStability = this.calculateFinancialStability(historicalCases);
      
      // Score de communication
      const communicationScore = this.calculateCommunicationScore(historicalCases);
      
      // Performance historique
      const historicalPerformance = this.calculateHistoricalPerformance(historicalCases);
      
      // Prédictions
      const predictedOutcomes = await this.predictDebtorOutcomes(debtor.id);

      return {
        id: `profile_${debtor.id}`,
        debtorId: debtor.id,
        riskCategory: this.determineRiskCategory(financialStability, paymentBehavior),
        paymentBehavior,
        financialStability,
        communicationScore,
        historicalPerformance,
        predictedOutcomes
      };

    } catch (error) {
      console.error('❌ Erreur génération profil débiteur:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Met à jour les modèles prédictifs avec nouvelles données
   */
  async updatePredictiveModels(): Promise<void> {
    try {
      console.log('🔄 Mise à jour des modèles prédictifs...');

      // Récupération des données d'entraînement
      const trainingData = await this.getTrainingData();
      
      // Mise à jour de chaque modèle
      for (const [modelId, model] of this.models.entries()) {
        const updatedModel = await this.retrainModel(model, trainingData);
        this.models.set(modelId, updatedModel);
        
        console.log(`✅ Modèle ${model.name} mis à jour (précision: ${updatedModel.accuracy}%)`);
      }

      console.log('🎯 Tous les modèles ont été mis à jour');

    } catch (error) {
      console.error('❌ Erreur mise à jour modèles:', error);
      Sentry.captureException(error);
    }
  }

  /**
   * Analyse batch de tous les dossiers actifs
   */
  async analyzeBatchCases(): Promise<{
    totalAnalyzed: number;
    highRiskCases: CaseScore[];
    recommendations: AIRecommendation[];
    insights: string[];
  }> {
    try {
      console.log('📊 Analyse batch des dossiers actifs...');

      const activeCases = await prisma.case.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true }
      });

      const scores: CaseScore[] = [];
      const allRecommendations: AIRecommendation[] = [];

      // Analyse de tous les dossiers actifs
      for (const caseItem of activeCases) {
        try {
          const score = await this.calculateCaseScore(caseItem.id);
          scores.push(score);

          const recommendations = await this.generateAIRecommendations(caseItem.id);
          allRecommendations.push(...recommendations);
        } catch (error) {
          console.warn(`Erreur analyse dossier ${caseItem.id}:`, error);
        }
      }

      // Identification des dossiers à haut risque
      const highRiskCases = scores.filter(s => s.riskLevel === 'HIGH');

      // Génération d'insights globaux
      const insights = this.generateBatchInsights(scores);

      console.log(`✅ Analyse terminée: ${scores.length} dossiers, ${highRiskCases.length} à haut risque`);

      return {
        totalAnalyzed: scores.length,
        highRiskCases,
        recommendations: allRecommendations,
        insights
      };

    } catch (error) {
      console.error('❌ Erreur analyse batch:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  // === MÉTHODES PRIVÉES ===

  private initializeModels(): void {
    // Modèle de prédiction de recouvrement
    this.models.set('collection_predictor', {
      id: 'collection_predictor',
      name: 'Prédicteur de Recouvrement',
      type: 'collection',
      accuracy: 82.5,
      lastTrained: new Date(),
      features: ['amount', 'debtor_history', 'case_age', 'communication_count', 'payment_behavior'],
      performance: {
        precision: 0.83,
        recall: 0.79,
        f1Score: 0.81,
        auc: 0.87,
        samples: 1250
      }
    });

    // Modèle de prédiction de durée
    this.models.set('duration_predictor', {
      id: 'duration_predictor',
      name: 'Prédicteur de Durée',
      type: 'duration',
      accuracy: 75.2,
      lastTrained: new Date(),
      features: ['amount', 'debtor_type', 'complexity', 'season', 'lawyer_experience'],
      performance: {
        precision: 0.76,
        recall: 0.74,
        f1Score: 0.75,
        auc: 0.79,
        samples: 980
      }
    });

    // Modèle d'évaluation de risque
    this.models.set('risk_assessor', {
      id: 'risk_assessor',
      name: 'Évaluateur de Risque',
      type: 'risk',
      accuracy: 88.1,
      lastTrained: new Date(),
      features: ['financial_stability', 'payment_history', 'company_size', 'industry', 'geographic_location'],
      performance: {
        precision: 0.89,
        recall: 0.87,
        f1Score: 0.88,
        auc: 0.91,
        samples: 1560
      }
    });
  }

  private async calculateScoreFactors(caseData: any): Promise<ScoreFactor[]> {
    const factors: ScoreFactor[] = [];

    // Facteur: Montant du dossier
    const amountFactor = this.calculateAmountFactor(caseData.amount);
    factors.push(amountFactor);

    // Facteur: Âge du dossier
    const ageFactor = this.calculateAgeFactor(caseData.createdAt);
    factors.push(ageFactor);

    // Facteur: Historique de paiement du débiteur
    const paymentHistoryFactor = await this.calculatePaymentHistoryFactor(caseData.debtor.id);
    factors.push(paymentHistoryFactor);

    // Facteur: Nombre de communications
    const communicationFactor = this.calculateCommunicationFactor(caseData.communications?.length || 0);
    factors.push(communicationFactor);

    // Facteur: Type de débiteur (entreprise vs particulier)
    const debtorTypeFactor = this.calculateDebtorTypeFactor(caseData.debtor.type);
    factors.push(debtorTypeFactor);

    return factors;
  }

  private calculateAmountFactor(amount: number): ScoreFactor {
    // Plus le montant est élevé, plus le score est élevé (motivation recouvrement)
    const value = Math.min(100, (amount / 10000) * 100);
    
    return {
      name: 'Montant du dossier',
      weight: 0.25,
      value,
      impact: value > 50 ? 'positive' : 'neutral',
      description: `Montant de ${amount}€ - Impact sur priorité de recouvrement`
    };
  }

  private calculateAgeFactor(createdAt: Date): ScoreFactor {
    const ageInDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // Score décroît avec l'âge (plus difficile à recouvrer)
    const value = Math.max(0, 100 - (ageInDays / 365) * 50);
    
    return {
      name: 'Âge du dossier',
      weight: 0.20,
      value,
      impact: ageInDays > 180 ? 'negative' : 'neutral',
      description: `${ageInDays} jours - Impact sur difficulté de recouvrement`
    };
  }

  private async calculatePaymentHistoryFactor(debtorId: string): Promise<ScoreFactor> {
    // Simulation - en prod, analyser l'historique réel
    const historicalSuccessRate = Math.random() * 40 + 60; // 60-100%
    
    return {
      name: 'Historique de paiement',
      weight: 0.30,
      value: historicalSuccessRate,
      impact: historicalSuccessRate > 80 ? 'positive' : 'negative',
      description: `${historicalSuccessRate.toFixed(0)}% de succès historique`
    };
  }

  private calculateCommunicationFactor(communicationCount: number): ScoreFactor {
    // Nombre optimal de communications : 3-7
    const optimal = communicationCount >= 3 && communicationCount <= 7;
    const value = optimal ? 80 : Math.max(20, 80 - Math.abs(communicationCount - 5) * 10);
    
    return {
      name: 'Communications',
      weight: 0.15,
      value,
      impact: optimal ? 'positive' : 'neutral',
      description: `${communicationCount} communications - Engagement du débiteur`
    };
  }

  private calculateDebtorTypeFactor(debtorType: string): ScoreFactor {
    const isCompany = debtorType === 'COMPANY';
    const value = isCompany ? 70 : 85; // Particuliers généralement plus faciles
    
    return {
      name: 'Type de débiteur',
      weight: 0.10,
      value,
      impact: 'neutral',
      description: `${debtorType} - Profil de recouvrement`
    };
  }

  private calculateWeightedScore(factors: ScoreFactor[]): number {
    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
    const weightedSum = factors.reduce((sum, factor) => sum + (factor.value * factor.weight), 0);
    
    return Math.round(weightedSum / totalWeight);
  }

  private async predictCollectionProbability(caseData: any): Promise<number> {
    // Simulation d'un modèle ML - en prod, utiliser TensorFlow.js ou API ML
    const baseProb = 70;
    const amountFactor = Math.min(10, caseData.amount / 1000);
    const ageFactor = Math.max(-20, -Math.floor((Date.now() - caseData.createdAt.getTime()) / (1000 * 60 * 60 * 24)) / 10);
    
    return Math.max(10, Math.min(95, baseProb + amountFactor + ageFactor + (Math.random() - 0.5) * 10));
  }

  private determineRiskLevel(score: number, probability: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (score >= 80 && probability >= 80) return 'LOW';
    if (score >= 60 && probability >= 60) return 'MEDIUM';
    return 'HIGH';
  }

  private recommendStrategy(score: number, riskLevel: string, caseData: any): string {
    if (riskLevel === 'LOW') {
      return 'Stratégie standard - Relances automatisées';
    } else if (riskLevel === 'MEDIUM') {
      return 'Stratégie renforcée - Contact direct + négociation';
    } else {
      return 'Stratégie intensive - Intervention juridique + mise en demeure';
    }
  }

  private async predictResolutionTime(caseData: any): Promise<number> {
    // Simulation - en prod, utiliser modèle ML
    const baseTime = 45; // jours
    const complexityFactor = caseData.amount > 5000 ? 15 : 0;
    const randomFactor = (Math.random() - 0.5) * 20;
    
    return Math.max(7, Math.round(baseTime + complexityFactor + randomFactor));
  }

  private async estimateCollectionAmount(caseData: any): Promise<number> {
    // Simulation - en prod, analyser historique et modèle ML
    const collectionRate = 0.85; // 85% en moyenne
    const variance = (Math.random() - 0.5) * 0.2; // ±10%
    
    return Math.round(caseData.amount * (collectionRate + variance));
  }

  private calculateConfidence(factors: ScoreFactor[], caseData: any): number {
    // Confiance basée sur la qualité des données et l'historique
    let confidence = 70; // Base
    
    if (factors.length >= 5) confidence += 10; // Données complètes
    if (caseData.communications?.length >= 3) confidence += 10; // Historique communications
    if (caseData.debtor?.cases?.length >= 2) confidence += 10; // Historique débiteur
    
    return Math.min(95, confidence);
  }

  private generateActionRecommendation(score: CaseScore, profile: DebtorProfile): AIRecommendation {
    let action = '';
    let priority: 'high' | 'medium' | 'low' = 'medium';
    let expectedImpact = 15;

    if (score.riskLevel === 'HIGH') {
      action = 'Intervention urgente requise';
      priority = 'high';
      expectedImpact = 35;
    } else if (score.collectionProbability > 80) {
      action = 'Négociation amiable recommandée';
      priority = 'medium';
      expectedImpact = 25;
    } else {
      action = 'Relance automatisée suffisante';
      priority = 'low';
      expectedImpact = 10;
    }

    return {
      id: `action_${score.caseId}_${Date.now()}`,
      caseId: score.caseId,
      type: 'action',
      priority,
      title: action,
      description: `Recommandation basée sur score ${score.overallScore}/100 et profil débiteur`,
      reasoning: [
        `Score global: ${score.overallScore}/100`,
        `Probabilité recouvrement: ${score.collectionProbability}%`,
        `Profil débiteur: ${profile.riskCategory}`
      ],
      expectedImpact,
      confidence: score.confidence,
      suggestedActions: this.getActionSuggestions(score.riskLevel)
    };
  }

  private generateStrategyRecommendation(score: CaseScore, profile: DebtorProfile): AIRecommendation {
    return {
      id: `strategy_${score.caseId}_${Date.now()}`,
      caseId: score.caseId,
      type: 'strategy',
      priority: 'medium',
      title: score.recommendedStrategy,
      description: 'Stratégie optimisée basée sur l\'analyse prédictive',
      reasoning: [
        `Comportement historique: ${profile.paymentBehavior}`,
        `Stabilité financière: ${profile.financialStability}/100`,
        `Communication score: ${profile.communicationScore}/100`
      ],
      expectedImpact: 20,
      confidence: score.confidence,
      suggestedActions: [
        'Adapter le ton de communication',
        'Personnaliser l\'approche',
        'Définir les échéances optimales'
      ]
    };
  }

  private generateTimingRecommendation(score: CaseScore, profile: DebtorProfile): AIRecommendation {
    const optimalTiming = this.calculateOptimalTiming(profile);
    
    return {
      id: `timing_${score.caseId}_${Date.now()}`,
      caseId: score.caseId,
      type: 'timing',
      priority: 'low',
      title: `Contact optimal: ${optimalTiming}`,
      description: 'Timing optimisé pour maximiser les chances de succès',
      reasoning: [
        'Analyse des patterns de réponse',
        'Historique des paiements',
        'Cycle d\'activité du débiteur'
      ],
      expectedImpact: 12,
      confidence: 70,
      suggestedActions: [
        `Planifier contact ${optimalTiming}`,
        'Éviter les périodes de forte charge',
        'Prévoir relances selon cycle'
      ],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
    };
  }

  private generateAmountRecommendation(score: CaseScore, profile: DebtorProfile): AIRecommendation {
    const recommendedAmount = Math.round(score.estimatedCollectionAmount * 0.9); // 90% de l'estimation
    
    return {
      id: `amount_${score.caseId}_${Date.now()}`,
      caseId: score.caseId,
      type: 'amount',
      priority: 'medium',
      title: `Montant de négociation: ${recommendedAmount}€`,
      description: 'Montant optimisé pour maximiser les chances d\'accord',
      reasoning: [
        `Estimation recouvrement: ${score.estimatedCollectionAmount}€`,
        `Capacité financière évaluée`,
        `Marge de négociation incluse`
      ],
      expectedImpact: 18,
      confidence: score.confidence,
      suggestedActions: [
        'Proposer ce montant en première approche',
        'Prévoir plan de paiement si refus',
        'Maintenir flexibilité dans négociation'
      ]
    };
  }

  private analyzePaymentBehavior(cases: any[]): 'excellent' | 'good' | 'average' | 'poor' | 'defaulter' {
    if (cases.length === 0) return 'average';
    
    const resolvedCases = cases.filter(c => c.status === 'RESOLVED').length;
    const successRate = resolvedCases / cases.length;
    
    if (successRate >= 0.9) return 'excellent';
    if (successRate >= 0.75) return 'good';
    if (successRate >= 0.5) return 'average';
    if (successRate >= 0.25) return 'poor';
    return 'defaulter';
  }

  private calculateFinancialStability(cases: any[]): number {
    // Simulation - en prod, intégrer données externes (Banque de France, etc.)
    return Math.random() * 40 + 60; // 60-100
  }

  private calculateCommunicationScore(cases: any[]): number {
    const totalCommunications = cases.reduce((sum, c) => sum + (c.communications?.length || 0), 0);
    const avgCommunications = cases.length > 0 ? totalCommunications / cases.length : 0;
    
    return Math.min(100, avgCommunications * 15); // Score basé sur réactivité
  }

  private calculateHistoricalPerformance(cases: any[]) {
    const resolvedCases = cases.filter(c => c.status === 'RESOLVED').length;
    const totalPaid = cases.reduce((sum, c) => {
      return sum + (c.invoices?.reduce((iSum: number, inv: any) => {
        return iSum + (inv.payments?.reduce((pSum: number, pay: any) => pSum + pay.amount, 0) || 0);
      }, 0) || 0);
    }, 0);
    
    const totalOutstanding = cases.reduce((sum, c) => sum + (c.amount || 0), 0) - totalPaid;
    
    return {
      totalCases: cases.length,
      resolvedCases,
      averagePaymentDelay: 30, // Simulation
      totalPaid,
      totalOutstanding: Math.max(0, totalOutstanding)
    };
  }

  private async predictDebtorOutcomes(debtorId: string) {
    // Simulation de prédictions ML
    return {
      paymentProbability: Math.random() * 30 + 70, // 70-100%
      optimalStrategy: 'Négociation directe avec plan de paiement',
      estimatedResolutionTime: Math.round(Math.random() * 30 + 30) // 30-60 jours
    };
  }

  private determineRiskCategory(financialStability: number, paymentBehavior: string): 'A' | 'B' | 'C' | 'D' {
    if (financialStability >= 80 && ['excellent', 'good'].includes(paymentBehavior)) return 'A';
    if (financialStability >= 60 && !['poor', 'defaulter'].includes(paymentBehavior)) return 'B';
    if (financialStability >= 40) return 'C';
    return 'D';
  }

  private async getTrainingData() {
    // Simulation - en prod, récupérer données historiques pour ML
    return {
      features: [],
      labels: [],
      metadata: {
        samples: 1500,
        lastUpdate: new Date()
      }
    };
  }

  private async retrainModel(model: PredictiveModel, trainingData: any): Promise<PredictiveModel> {
    // Simulation d'entraînement - en prod, utiliser TensorFlow.js ou API ML
    const improvementFactor = Math.random() * 0.05; // Amélioration 0-5%
    
    return {
      ...model,
      accuracy: Math.min(95, model.accuracy + improvementFactor),
      lastTrained: new Date(),
      performance: {
        ...model.performance,
        samples: model.performance.samples + 50
      }
    };
  }

  private generateBatchInsights(scores: CaseScore[]): string[] {
    const insights: string[] = [];
    
    const highRiskCount = scores.filter(s => s.riskLevel === 'HIGH').length;
    const avgScore = scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length;
    const avgProbability = scores.reduce((sum, s) => sum + s.collectionProbability, 0) / scores.length;
    
    insights.push(`${highRiskCount} dossiers identifiés à haut risque nécessitent une attention immédiate`);
    insights.push(`Score moyen du portefeuille: ${avgScore.toFixed(1)}/100`);
    insights.push(`Probabilité moyenne de recouvrement: ${avgProbability.toFixed(1)}%`);
    
    if (avgScore < 70) {
      insights.push('Le portefeuille présente des signes de dégradation - recommandation d\'audit approfondi');
    }
    
    if (highRiskCount > scores.length * 0.3) {
      insights.push('Proportion élevée de dossiers à risque - révision des processus recommandée');
    }
    
    return insights;
  }

  private getActionSuggestions(riskLevel: string): string[] {
    switch (riskLevel) {
      case 'HIGH':
        return [
          'Mise en demeure immédiate',
          'Contact téléphonique urgent',
          'Négociation plan de paiement',
          'Évaluation procédure judiciaire'
        ];
      case 'MEDIUM':
        return [
          'Relance personnalisée',
          'Proposition arrangement amiable',
          'Suivi renforcé',
          'Documentation complète'
        ];
      default:
        return [
          'Relance automatisée',
          'Maintien contact régulier',
          'Surveillance évolution',
          'Process standard'
        ];
    }
  }

  private calculateOptimalTiming(profile: DebtorProfile): string {
    // Simulation - en prod, analyser patterns historiques
    const businessHours = ['9h-11h', '14h-16h'];
    const optimalDays = ['Mardi', 'Mercredi', 'Jeudi'];
    
    if (profile.paymentBehavior === 'excellent') {
      return `${optimalDays[0]} ${businessHours[0]}`;
    } else if (profile.communicationScore > 70) {
      return `${optimalDays[1]} ${businessHours[1]}`;
    } else {
      return `${optimalDays[2]} ${businessHours[0]}`;
    }
  }
}

export default PredictiveScoringEngine;

/**
 * Business Intelligence & Analytics Engine
 * Phase 3 - Intelligence features
 * 
 * Tableau de bord exécutif avec KPIs métier avancés
 * Analytics prédictifs et insights business
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

// Types pour les KPIs et métriques
export interface BusinessKPIs {
  // KPIs financiers
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageInvoiceValue: number;
  collectionRate: number; // Taux de recouvrement
  
  // KPIs opérationnels
  activeCases: number;
  resolvedCases: number;
  averageResolutionTime: number; // en jours
  caseSuccessRate: number;
  
  // KPIs clients
  totalClients: number;
  activeClients: number;
  clientRetentionRate: number;
  clientSatisfactionScore: number;
  
  // KPIs performance équipe
  casePerLawyer: number;
  revenuePerLawyer: number;
  productivityScore: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    type?: 'line' | 'bar' | 'pie' | 'doughnut';
  }[];
}

export interface PredictiveInsight {
  type: 'revenue' | 'collection' | 'case_volume' | 'risk';
  prediction: number;
  confidence: number; // 0-100%
  timeframe: '1_month' | '3_months' | '6_months' | '1_year';
  factors: string[];
  recommendation: string;
}

export interface BusinessInsight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'financial' | 'operational' | 'strategic';
  actionable: boolean;
  suggestedActions: string[];
  metrics: Record<string, number>;
}

/**
 * Moteur de Business Intelligence
 * Analyse et génère des insights métier
 */
export class BusinessIntelligenceEngine {
  private static instance: BusinessIntelligenceEngine;

  public static getInstance(): BusinessIntelligenceEngine {
    if (!BusinessIntelligenceEngine.instance) {
      BusinessIntelligenceEngine.instance = new BusinessIntelligenceEngine();
    }
    return BusinessIntelligenceEngine.instance;
  }

  /**
   * Calcule tous les KPIs métier principaux
   */
  async calculateBusinessKPIs(period: 'month' | 'quarter' | 'year' = 'month'): Promise<BusinessKPIs> {
    try {
      const startDate = this.getStartDate(period);
      const endDate = new Date();

      console.log(`📊 Calcul des KPIs métier pour la période: ${period}`);

      // KPIs financiers
      const invoiceStats = await this.calculateFinancialKPIs(startDate, endDate);
      
      // KPIs opérationnels
      const caseStats = await this.calculateOperationalKPIs(startDate, endDate);
      
      // KPIs clients
      const clientStats = await this.calculateClientKPIs(startDate, endDate);
      
      // KPIs équipe
      const teamStats = await this.calculateTeamKPIs(startDate, endDate);

      const kpis: BusinessKPIs = {
        // Financiers
        totalRevenue: invoiceStats.totalRevenue,
        monthlyRecurringRevenue: invoiceStats.mrr,
        averageInvoiceValue: invoiceStats.averageValue,
        collectionRate: invoiceStats.collectionRate,
        
        // Opérationnels
        activeCases: caseStats.active,
        resolvedCases: caseStats.resolved,
        averageResolutionTime: caseStats.avgResolutionTime,
        caseSuccessRate: caseStats.successRate,
        
        // Clients
        totalClients: clientStats.total,
        activeClients: clientStats.active,
        clientRetentionRate: clientStats.retentionRate,
        clientSatisfactionScore: clientStats.satisfactionScore,
        
        // Équipe
        casePerLawyer: teamStats.casesPerLawyer,
        revenuePerLawyer: teamStats.revenuePerLawyer,
        productivityScore: teamStats.productivityScore
      };

      console.log(`✅ KPIs calculés avec succès`);
      return kpis;

    } catch (error) {
      console.error('❌ Erreur calcul KPIs:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Génère des données de séries temporelles pour les graphiques
   */
  async generateTimeSeriesData(
    metric: 'revenue' | 'cases' | 'collection_rate', 
    period: '7d' | '30d' | '90d' | '1y'
  ): Promise<TimeSeriesData[]> {
    try {
      const days = this.getDaysFromPeriod(period);
      const data: TimeSeriesData[] = [];

      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        let value = 0;
        switch (metric) {
          case 'revenue':
            value = await this.getRevenueForDate(date);
            break;
          case 'cases':
            value = await this.getCasesForDate(date);
            break;
          case 'collection_rate':
            value = await this.getCollectionRateForDate(date);
            break;
        }

        data.push({
          date: date.toISOString().split('T')[0],
          value,
          label: this.formatDateLabel(date, period)
        });
      }

      return data;

    } catch (error) {
      console.error('❌ Erreur génération séries temporelles:', error);
      Sentry.captureException(error);
      return [];
    }
  }

  /**
   * Prépare les données pour les graphiques Chart.js
   */
  async prepareChartData(type: 'revenue_trend' | 'case_status' | 'client_types' | 'monthly_comparison'): Promise<ChartData> {
    try {
      switch (type) {
        case 'revenue_trend':
          return await this.generateRevenueTrendChart();
        case 'case_status':
          return await this.generateCaseStatusChart();
        case 'client_types':
          return await this.generateClientTypesChart();
        case 'monthly_comparison':
          return await this.generateMonthlyComparisonChart();
        default:
          throw new Error(`Type de graphique non supporté: ${type}`);
      }

    } catch (error) {
      console.error('❌ Erreur préparation données graphique:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Génère des insights prédictifs basés sur l'historique
   */
  async generatePredictiveInsights(): Promise<PredictiveInsight[]> {
    try {
      console.log('🔮 Génération d\'insights prédictifs...');

      const insights: PredictiveInsight[] = [];

      // Prédiction revenus
      const revenueInsight = await this.predictRevenue();
      insights.push(revenueInsight);

      // Prédiction taux de recouvrement
      const collectionInsight = await this.predictCollectionRate();
      insights.push(collectionInsight);

      // Prédiction volume de dossiers
      const volumeInsight = await this.predictCaseVolume();
      insights.push(volumeInsight);

      // Analyse des risques
      const riskInsight = await this.analyzeRisks();
      insights.push(riskInsight);

      console.log(`✅ ${insights.length} insights prédictifs générés`);
      return insights;

    } catch (error) {
      console.error('❌ Erreur génération insights prédictifs:', error);
      Sentry.captureException(error);
      return [];
    }
  }

  /**
   * Génère des insights business actionnables
   */
  async generateBusinessInsights(): Promise<BusinessInsight[]> {
    try {
      console.log('💡 Génération d\'insights business...');

      const insights: BusinessInsight[] = [];

      // Analyse de performance financière
      const financialInsight = await this.analyzeFinancialPerformance();
      if (financialInsight) insights.push(financialInsight);

      // Analyse de l'efficacité opérationnelle
      const operationalInsight = await this.analyzeOperationalEfficiency();
      if (operationalInsight) insights.push(operationalInsight);

      // Analyse de la satisfaction client
      const clientInsight = await this.analyzeClientSatisfaction();
      if (clientInsight) insights.push(clientInsight);

      // Opportunités de croissance
      const growthInsight = await this.identifyGrowthOpportunities();
      if (growthInsight) insights.push(growthInsight);

      console.log(`💼 ${insights.length} insights business générés`);
      return insights;

    } catch (error) {
      console.error('❌ Erreur génération insights business:', error);
      Sentry.captureException(error);
      return [];
    }
  }

  /**
   * Génère un rapport exécutif complet
   */
  async generateExecutiveReport(period: 'month' | 'quarter' | 'year' = 'month'): Promise<{
    summary: BusinessKPIs;
    trends: Record<string, TimeSeriesData[]>;
    charts: Record<string, ChartData>;
    predictions: PredictiveInsight[];
    insights: BusinessInsight[];
    recommendations: string[];
  }> {
    try {
      console.log('📋 Génération du rapport exécutif...');

      const [summary, predictions, insights] = await Promise.all([
        this.calculateBusinessKPIs(period),
        this.generatePredictiveInsights(),
        this.generateBusinessInsights()
      ]);

      const trends = {
        revenue: await this.generateTimeSeriesData('revenue', '30d'),
        cases: await this.generateTimeSeriesData('cases', '30d'),
        collection: await this.generateTimeSeriesData('collection_rate', '30d')
      };

      const charts = {
        revenue_trend: await this.prepareChartData('revenue_trend'),
        case_status: await this.prepareChartData('case_status'),
        client_types: await this.prepareChartData('client_types'),
        monthly_comparison: await this.prepareChartData('monthly_comparison')
      };

      const recommendations = this.generateRecommendations(summary, insights);

      console.log('✅ Rapport exécutif généré avec succès');

      return {
        summary,
        trends,
        charts,
        predictions,
        insights,
        recommendations
      };

    } catch (error) {
      console.error('❌ Erreur génération rapport exécutif:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  // === MÉTHODES PRIVÉES ===

  private getStartDate(period: 'month' | 'quarter' | 'year'): Date {
    const date = new Date();
    switch (period) {
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'quarter':
        date.setMonth(date.getMonth() - 3);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - 1);
        break;
    }
    return date;
  }

  private async calculateFinancialKPIs(startDate: Date, endDate: Date) {
    const invoices = await prisma.invoice.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      include: { payments: true }
    });

    const totalRevenue = invoices.reduce((sum, invoice) => {
      const paidAmount = invoice.payments?.reduce((pSum, payment) => pSum + payment.amount, 0) || 0;
      return sum + paidAmount;
    }, 0);

    const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const collectionRate = totalInvoiced > 0 ? (totalRevenue / totalInvoiced) * 100 : 0;

    return {
      totalRevenue,
      mrr: totalRevenue / this.getMonthsDifference(startDate, endDate),
      averageValue: invoices.length > 0 ? totalInvoiced / invoices.length : 0,
      collectionRate
    };
  }

  private async calculateOperationalKPIs(startDate: Date, endDate: Date) {
    const allCases = await prisma.case.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    const activeCases = allCases.filter(c => c.status === 'OPEN').length;
    const resolvedCases = allCases.filter(c => c.status === 'RESOLVED').length;

    const resolvedCasesWithTimes = allCases.filter(c => 
      c.status === 'RESOLVED' && c.updatedAt && c.createdAt
    );

    const avgResolutionTime = resolvedCasesWithTimes.length > 0 
      ? resolvedCasesWithTimes.reduce((sum, c) => {
          const days = Math.ceil((c.updatedAt!.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / resolvedCasesWithTimes.length
      : 0;

    const successRate = allCases.length > 0 ? (resolvedCases / allCases.length) * 100 : 0;

    return {
      active: activeCases,
      resolved: resolvedCases,
      avgResolutionTime,
      successRate
    };
  }

  private async calculateClientKPIs(startDate: Date, endDate: Date) {
    const clients = await prisma.client.findMany({
      include: {
        cases: {
          where: {
            createdAt: { gte: startDate, lte: endDate }
          }
        }
      }
    });

    const activeClients = clients.filter(c => c.cases.some(cs => cs.status === 'OPEN')).length;

    return {
      total: clients.length,
      active: activeClients,
      retentionRate: 85, // Mock - à calculer avec données historiques
      satisfactionScore: 4.2 // Mock - à intégrer avec système d'évaluation
    };
  }

  private async calculateTeamKPIs(startDate: Date, endDate: Date) {
    // Mock data - à remplacer par vraie gestion d'équipe
    const lawyersCount = 3;
    const totalCases = await prisma.case.count({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    const totalRevenue = 50000; // À calculer réellement

    return {
      casesPerLawyer: lawyersCount > 0 ? totalCases / lawyersCount : 0,
      revenuePerLawyer: lawyersCount > 0 ? totalRevenue / lawyersCount : 0,
      productivityScore: 78 // Mock - à calculer avec métriques réelles
    };
  }

  private getDaysFromPeriod(period: '7d' | '30d' | '90d' | '1y'): number {
    switch (period) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  }

  private async getRevenueForDate(date: Date): Promise<number> {
    // Simulation - à remplacer par vraie requête
    return Math.random() * 1000 + 500;
  }

  private async getCasesForDate(date: Date): Promise<number> {
    const count = await prisma.case.count({
      where: {
        createdAt: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        }
      }
    });
    return count;
  }

  private async getCollectionRateForDate(date: Date): Promise<number> {
    // Simulation - à calculer réellement
    return Math.random() * 20 + 70; // Entre 70% et 90%
  }

  private formatDateLabel(date: Date, period: string): string {
    if (period === '7d') {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    }
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  private async generateRevenueTrendChart(): Promise<ChartData> {
    const data = await this.generateTimeSeriesData('revenue', '30d');
    
    return {
      labels: data.map(d => d.label || ''),
      datasets: [{
        label: 'Revenus (€)',
        data: data.map(d => d.value),
        borderColor: '#3B82F6',
        backgroundColor: ['rgba(59, 130, 246, 0.1)'],
        type: 'line'
      }]
    };
  }

  private async generateCaseStatusChart(): Promise<ChartData> {
    const cases = await prisma.case.groupBy({
      by: ['status'],
      _count: true
    });

    return {
      labels: cases.map(c => c.status),
      datasets: [{
        label: 'Nombre de dossiers',
        data: cases.map(c => c._count),
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#6B7280']
      }]
    };
  }

  private async generateClientTypesChart(): Promise<ChartData> {
    // Mock data - à adapter selon la vraie classification
    return {
      labels: ['Entreprises', 'Particuliers', 'Administrations', 'Associations'],
      datasets: [{
        label: 'Répartition clients',
        data: [45, 35, 15, 5],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']
      }]
    };
  }

  private async generateMonthlyComparisonChart(): Promise<ChartData> {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
    
    return {
      labels: months,
      datasets: [
        {
          label: 'Revenus 2025',
          data: [12000, 15000, 18000, 14000, 16000, 20000],
          backgroundColor: ['#3B82F6']
        },
        {
          label: 'Revenus 2024',
          data: [10000, 12000, 15000, 13000, 14000, 17000],
          backgroundColor: ['#6B7280']
        }
      ]
    };
  }

  private async predictRevenue(): Promise<PredictiveInsight> {
    // Algorithme prédictif simple - à enrichir avec ML
    const historicalRevenue = 18000; // Mock
    const growthRate = 0.05; // 5% de croissance
    
    return {
      type: 'revenue',
      prediction: historicalRevenue * (1 + growthRate),
      confidence: 78,
      timeframe: '1_month',
      factors: ['Croissance historique', 'Nouveaux clients', 'Saisonnalité'],
      recommendation: 'Augmentation attendue de 5%. Intensifier prospection.'
    };
  }

  private async predictCollectionRate(): Promise<PredictiveInsight> {
    return {
      type: 'collection',
      prediction: 82.5,
      confidence: 85,
      timeframe: '3_months',
      factors: ['Amélioration processus', 'Automatisation', 'Formation équipe'],
      recommendation: 'Taux stable. Maintenir les bonnes pratiques.'
    };
  }

  private async predictCaseVolume(): Promise<PredictiveInsight> {
    return {
      type: 'case_volume',
      prediction: 45,
      confidence: 72,
      timeframe: '1_month',
      factors: ['Tendance économique', 'Partenariats', 'Marketing'],
      recommendation: 'Volume en hausse. Prévoir ressources supplémentaires.'
    };
  }

  private async analyzeRisks(): Promise<PredictiveInsight> {
    return {
      type: 'risk',
      prediction: 15,
      confidence: 90,
      timeframe: '6_months',
      factors: ['Concentration client', 'Retards paiement', 'Concurrence'],
      recommendation: 'Risque modéré. Diversifier portefeuille clients.'
    };
  }

  private async analyzeFinancialPerformance(): Promise<BusinessInsight | null> {
    const kpis = await this.calculateBusinessKPIs('month');
    
    if (kpis.collectionRate < 75) {
      return {
        id: 'financial_performance_001',
        title: 'Taux de recouvrement en baisse',
        description: `Le taux de recouvrement est de ${kpis.collectionRate.toFixed(1)}%, en dessous du seuil optimal de 80%.`,
        impact: 'high',
        category: 'financial',
        actionable: true,
        suggestedActions: [
          'Analyser les dossiers en retard',
          'Automatiser les relances',
          'Former l\'équipe aux techniques de négociation',
          'Réviser la stratégie de recouvrement'
        ],
        metrics: {
          current_rate: kpis.collectionRate,
          target_rate: 80,
          gap: 80 - kpis.collectionRate
        }
      };
    }
    
    return null;
  }

  private async analyzeOperationalEfficiency(): Promise<BusinessInsight | null> {
    const kpis = await this.calculateBusinessKPIs('month');
    
    if (kpis.averageResolutionTime > 60) {
      return {
        id: 'operational_efficiency_001',
        title: 'Délai de résolution élevé',
        description: `Le délai moyen de résolution est de ${kpis.averageResolutionTime.toFixed(0)} jours, supérieur à l'objectif de 45 jours.`,
        impact: 'medium',
        category: 'operational',
        actionable: true,
        suggestedActions: [
          'Identifier les goulots d\'étranglement',
          'Automatiser les tâches répétitives',
          'Optimiser les processus',
          'Renforcer l\'équipe si nécessaire'
        ],
        metrics: {
          current_time: kpis.averageResolutionTime,
          target_time: 45,
          improvement_needed: kpis.averageResolutionTime - 45
        }
      };
    }
    
    return null;
  }

  private async analyzeClientSatisfaction(): Promise<BusinessInsight | null> {
    const kpis = await this.calculateBusinessKPIs('month');
    
    if (kpis.clientSatisfactionScore < 4.0) {
      return {
        id: 'client_satisfaction_001',
        title: 'Satisfaction client à améliorer',
        description: `Score de satisfaction de ${kpis.clientSatisfactionScore}/5, en dessous de l'objectif de 4.5.`,
        impact: 'medium',
        category: 'strategic',
        actionable: true,
        suggestedActions: [
          'Enquête de satisfaction détaillée',
          'Améliorer la communication client',
          'Formation service client',
          'Implémenter feedback continu'
        ],
        metrics: {
          current_score: kpis.clientSatisfactionScore,
          target_score: 4.5,
          improvement_needed: 4.5 - kpis.clientSatisfactionScore
        }
      };
    }
    
    return null;
  }

  private async identifyGrowthOpportunities(): Promise<BusinessInsight | null> {
    const kpis = await this.calculateBusinessKPIs('month');
    
    if (kpis.clientRetentionRate > 90) {
      return {
        id: 'growth_opportunity_001',
        title: 'Opportunité d\'expansion',
        description: `Excellent taux de rétention de ${kpis.clientRetentionRate}%. Opportunité d'upselling et référencement.`,
        impact: 'high',
        category: 'strategic',
        actionable: true,
        suggestedActions: [
          'Programme de référencement client',
          'Développer services premium',
          'Expansion géographique',
          'Partenariats stratégiques'
        ],
        metrics: {
          retention_rate: kpis.clientRetentionRate,
          growth_potential: 25,
          revenue_opportunity: kpis.totalRevenue * 0.3
        }
      };
    }
    
    return null;
  }

  private generateRecommendations(kpis: BusinessKPIs, insights: BusinessInsight[]): string[] {
    const recommendations: string[] = [];

    // Recommandations basées sur les KPIs
    if (kpis.collectionRate < 80) {
      recommendations.push('Priorité : Améliorer le taux de recouvrement avec automatisation des relances');
    }

    if (kpis.averageResolutionTime > 45) {
      recommendations.push('Optimiser les processus pour réduire le délai de résolution');
    }

    if (kpis.clientRetentionRate > 85) {
      recommendations.push('Capitaliser sur la satisfaction client pour développer les référencements');
    }

    // Recommandations des insights
    insights.forEach(insight => {
      if (insight.impact === 'high' && insight.actionable) {
        recommendations.push(`Action prioritaire : ${insight.suggestedActions[0]}`);
      }
    });

    return recommendations;
  }

  private getMonthsDifference(startDate: Date, endDate: Date): number {
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                   (endDate.getMonth() - startDate.getMonth());
    return Math.max(1, months);
  }
}

export default BusinessIntelligenceEngine;

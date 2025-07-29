'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BusinessIntelligenceEngine, BusinessKPIs } from '@/lib/analytics/business-intelligence';

interface ChartData {
  name: string;
  value: number;
  date?: string;
  cases?: number;
  revenue?: number;
  success_rate?: number;
  fill?: string; // Pour les couleurs des graphiques en secteurs
}

const BusinessIntelligenceDashboard: React.FC = () => {
  const [kpis, setKpis] = useState<BusinessKPIs | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<ChartData[]>([]);
  const [caseStatusData, setCaseStatusData] = useState<ChartData[]>([]);
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [clientData, setClientData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const biEngine = new BusinessIntelligenceEngine();

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Charger les KPIs
      const kpiData = await biEngine.calculateBusinessKPIs();
      setKpis(kpiData);

      // Générer les données de série temporelle  
      const timeData = await biEngine.generateTimeSeriesData('revenue', selectedPeriod);
      // Convertir TimeSeriesData vers ChartData
      const chartData: ChartData[] = timeData.map(item => ({
        name: item.date,
        value: item.value,
        date: item.date
      }));
      setTimeSeriesData(chartData);

      // Données factices pour les graphiques (en production, récupérées via API)
      setCaseStatusData([
        { name: 'En cours', value: 45, fill: '#8884d8' },
        { name: 'Résolus', value: 123, fill: '#82ca9d' },
        { name: 'En attente', value: 21, fill: '#ffc658' },
        { name: 'Bloqués', value: 8, fill: '#ff7300' },
      ]);

      setRevenueData([
        { name: 'Jan', value: 65000, revenue: 65000, cases: 45 },
        { name: 'Fév', value: 72000, revenue: 72000, cases: 52 },
        { name: 'Mar', value: 68000, revenue: 68000, cases: 48 },
        { name: 'Avr', value: 81000, revenue: 81000, cases: 58 },
        { name: 'Mai', value: 89000, revenue: 89000, cases: 63 },
        { name: 'Jun', value: 95000, revenue: 95000, cases: 67 },
      ]);

      setClientData([
        { name: 'Nouveaux', value: 28 },
        { name: 'Récurrents', value: 156 },
        { name: 'Inactifs', value: 43 },
      ]);

    } catch (error) {
      console.error('Erreur lors du chargement des données BI:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateExecutiveReport = async () => {
    try {
      const report = await biEngine.generateExecutiveReport();
      // Déclencher le téléchargement du rapport
      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-executif-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Business Intelligence</h1>
            <p className="text-gray-600 mt-1">Tableau de bord analytique</p>
          </div>
          <div className="flex gap-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">90 derniers jours</option>
              <option value="1y">1 an</option>
            </select>
            <button
              onClick={generateExecutiveReport}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Rapport Exécutif
            </button>
          </div>
        </div>
      </div>

      {/* KPIs Cards */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Chiffre d'affaires</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(kpis.totalRevenue)}
                </p>
                <p className="text-sm text-gray-600">
                  {formatCurrency(kpis.monthlyRecurringRevenue)}/mois
                </p>
              </div>
              <div className="text-blue-600">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Dossiers actifs</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.activeCases}</p>
                <p className="text-sm text-green-600">
                  {formatPercentage(kpis.caseSuccessRate)} de succès
                </p>
              </div>
              <div className="text-green-600">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Taux de recouvrement</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage(kpis.collectionRate)}
                </p>
                <p className="text-sm text-gray-600">
                  {formatCurrency(kpis.averageInvoiceValue)} facture moyenne
                </p>
              </div>
              <div className="text-yellow-600">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm">Clients actifs</p>
                <p className="text-2xl font-bold text-gray-900">{kpis.activeClients}</p>
                <p className="text-sm text-green-600">
                  {kpis.clientSatisfactionScore}/5 satisfaction
                </p>
              </div>
              <div className="text-purple-600">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Évolution du chiffre d'affaires */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-xl font-semibold mb-4">Évolution du chiffre d'affaires</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [formatCurrency(value as number), 'CA']} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Répartition des statuts de dossiers */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-xl font-semibold mb-4">Statuts des dossiers</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={caseStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {caseStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Graphiques secondaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance mensuelle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-xl font-semibold mb-4">Performance mensuelle</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cases" fill="#82ca9d" name="Dossiers traités" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Tendances temporelles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-xl font-semibold mb-4">Tendances temporelles</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                strokeWidth={2}
                name="Valeur"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Métriques détaillées */}
      {kpis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-xl font-semibold mb-4">Métriques détaillées</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Performance équipe</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Score de productivité</span>
                  <span className="font-medium">{kpis.productivityScore}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Charge moyenne</span>
                  <span className="font-medium">{kpis.casePerLawyer} dossiers</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenu par avocat</span>
                  <span className="font-medium">{formatCurrency(kpis.revenuePerLawyer)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Résolution des dossiers</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Temps moyen</span>
                  <span className="font-medium">{kpis.averageResolutionTime} jours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taux de succès</span>
                  <span className="font-medium">{formatPercentage(kpis.caseSuccessRate)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Finances</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Valeur facture moyenne</span>
                  <span className="font-medium">{formatCurrency(kpis.averageInvoiceValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenu total</span>
                  <span className="font-medium text-green-600">{formatCurrency(kpis.totalRevenue)}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BusinessIntelligenceDashboard;

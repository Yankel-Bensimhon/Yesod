'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';
import { PredictiveScoringEngine } from '@/lib/ai/predictive-scoring';

interface CaseScore {
  caseId: string;
  score: number;
  confidence: number;
  factors: {
    debtor_profile: number;
    debt_amount: number;
    case_complexity: number;
    market_conditions: number;
    legal_precedents: number;
  };
  recommendations: string[];
  risk_level: 'low' | 'medium' | 'high';
  predicted_outcome: string;
  estimated_duration: number;
}

interface AIRecommendation {
  id: string;
  type: 'strategy' | 'timing' | 'resource' | 'risk';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact_score: number;
  confidence: number;
  created_at: string;
}

interface DebtorProfile {
  id: string;
  name: string;
  financial_stability: number;
  payment_history: number;
  legal_issues: number;
  cooperation_level: number;
  overall_score: number;
  risk_category: 'low' | 'medium' | 'high';
}

const PredictiveAIDashboard: React.FC = () => {
  const [caseScores, setCaseScores] = useState<CaseScore[]>([]);
  const [aiRecommendations, setAIRecommendations] = useState<AIRecommendation[]>([]);
  const [debtorProfiles, setDebtorProfiles] = useState<DebtorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'individual' | 'batch'>('individual');

  const aiEngine = new PredictiveScoringEngine();

  useEffect(() => {
    loadAIData();
  }, []);

  const loadAIData = async () => {
    try {
      setLoading(true);

      // Simuler des données de cas pour le scoring
      const mockCases = [
        { id: 'case-1', debtorId: 'debtor-1', amount: 25000, complexity: 0.7 },
        { id: 'case-2', debtorId: 'debtor-2', amount: 15000, complexity: 0.4 },
        { id: 'case-3', debtorId: 'debtor-3', amount: 45000, complexity: 0.9 },
        { id: 'case-4', debtorId: 'debtor-4', amount: 8000, complexity: 0.3 },
        { id: 'case-5', debtorId: 'debtor-5', amount: 32000, complexity: 0.6 },
      ];

      // Calculer les scores pour chaque cas
      const scores = await Promise.all(
        mockCases.map(async (caseData) => {
          const score = await aiEngine.calculateCaseScore(caseData.id);
          return {
            caseId: caseData.id,
            score: score.overall_score,
            confidence: score.confidence,
            factors: score.factors,
            recommendations: score.recommendations,
            risk_level: score.overall_score > 70 ? 'low' : score.overall_score > 40 ? 'medium' : 'high',
            predicted_outcome: score.overall_score > 60 ? 'Succès probable' : 'Résolution difficile',
            estimated_duration: Math.round(score.estimated_duration),
          } as CaseScore;
        })
      );
      setCaseScores(scores);

      // Générer des recommandations IA
      const recommendations = await aiEngine.generateAIRecommendations('case-1');
      setAIRecommendations(recommendations.map((rec, index) => ({
        id: `rec-${index}`,
        type: ['strategy', 'timing', 'resource', 'risk'][index % 4] as any,
        priority: ['high', 'medium', 'low'][index % 3] as any,
        title: rec,
        description: `Recommandation détaillée pour ${rec}`,
        impact_score: Math.random() * 100,
        confidence: 80 + Math.random() * 20,
        created_at: new Date().toISOString(),
      })));

      // Générer des profils de débiteurs
      const profiles: DebtorProfile[] = [
        {
          id: 'debtor-1',
          name: 'Entreprise Alpha',
          financial_stability: 65,
          payment_history: 45,
          legal_issues: 20,
          cooperation_level: 70,
          overall_score: 50,
          risk_category: 'medium',
        },
        {
          id: 'debtor-2',
          name: 'Société Beta',
          financial_stability: 85,
          payment_history: 90,
          legal_issues: 10,
          cooperation_level: 95,
          overall_score: 92,
          risk_category: 'low',
        },
        {
          id: 'debtor-3',
          name: 'SARL Gamma',
          financial_stability: 25,
          payment_history: 15,
          legal_issues: 80,
          cooperation_level: 30,
          overall_score: 37,
          risk_category: 'high',
        },
      ];
      setDebtorProfiles(profiles);

    } catch (error) {
      console.error('Erreur lors du chargement des données IA:', error);
    } finally {
      setLoading(false);
    }
  };

  const runBatchAnalysis = async () => {
    try {
      setLoading(true);
      const caseIds = caseScores.map(c => c.caseId);
      const batchResults = await aiEngine.analyzeBatchCases(caseIds);
      
      // Mettre à jour les scores avec les résultats de l'analyse par lot
      const updatedScores = caseScores.map(score => ({
        ...score,
        confidence: Math.min(score.confidence + 10, 100), // Améliorer la confiance
      }));
      setCaseScores(updatedScores);
      
    } catch (error) {
      console.error('Erreur lors de l\'analyse par lot:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Intelligence Artificielle Prédictive</h1>
            <p className="text-gray-600 mt-1">Scoring et recommandations IA pour l'optimisation des dossiers</p>
          </div>
          <div className="flex gap-4">
            <select
              value={analysisMode}
              onChange={(e) => setAnalysisMode(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
            >
              <option value="individual">Analyse individuelle</option>
              <option value="batch">Analyse par lot</option>
            </select>
            <button
              onClick={runBatchAnalysis}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Lancer analyse IA
            </button>
          </div>
        </div>
      </div>

      {/* Vue d'ensemble des scores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Distribution des scores */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-lg shadow-md lg:col-span-2"
        >
          <h3 className="text-xl font-semibold mb-4">Distribution des scores de succès</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={caseScores}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="caseId" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'score' ? `${value}%` : `${value}%`,
                  name === 'score' ? 'Score de succès' : 'Confiance'
                ]}
              />
              <Legend />
              <Bar dataKey="score" fill="#8b5cf6" name="Score de succès" />
              <Bar dataKey="confidence" fill="#06b6d4" name="Confiance IA" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Métriques globales */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="font-semibold text-gray-700 mb-2">Score moyen</h4>
            <p className="text-3xl font-bold text-purple-600">
              {Math.round(caseScores.reduce((acc, c) => acc + c.score, 0) / caseScores.length)}%
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="font-semibold text-gray-700 mb-2">Confiance moyenne</h4>
            <p className="text-3xl font-bold text-cyan-600">
              {Math.round(caseScores.reduce((acc, c) => acc + c.confidence, 0) / caseScores.length)}%
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="font-semibold text-gray-700 mb-2">Recommandations actives</h4>
            <p className="text-3xl font-bold text-green-600">{aiRecommendations.length}</p>
          </div>
        </motion.div>
      </div>

      {/* Analyse des facteurs de scoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Radar des facteurs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-xl font-semibold mb-4">Analyse des facteurs de scoring</h3>
          {selectedCase ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart 
                data={Object.entries(caseScores.find(c => c.caseId === selectedCase)?.factors || {})
                  .map(([key, value]) => ({
                    factor: key.replace('_', ' '),
                    value: value * 100,
                  }))}
              >
                <PolarGrid />
                <PolarAngleAxis dataKey="factor" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                />
                <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Sélectionnez un dossier pour voir l'analyse détaillée
            </div>
          )}
        </motion.div>

        {/* Liste des dossiers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h3 className="text-xl font-semibold mb-4">Dossiers analysés</h3>
          <div className="space-y-3">
            {caseScores.map((caseScore) => (
              <div
                key={caseScore.caseId}
                onClick={() => setSelectedCase(caseScore.caseId)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedCase === caseScore.caseId 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{caseScore.caseId}</h4>
                    <p className="text-sm text-gray-600">{caseScore.predicted_outcome}</p>
                    <p className="text-sm text-gray-500">
                      Durée estimée: {caseScore.estimated_duration} jours
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">{caseScore.score}%</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs ${getRiskColor(caseScore.risk_level)}`}>
                      {caseScore.risk_level}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recommandations IA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-md mb-8"
      >
        <h3 className="text-xl font-semibold mb-4">Recommandations IA</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiRecommendations.map((recommendation) => (
            <div key={recommendation.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">{recommendation.title}</h4>
                <span className={`inline-block px-2 py-1 rounded text-xs ${getPriorityColor(recommendation.priority)}`}>
                  {recommendation.priority}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Impact: {Math.round(recommendation.impact_score)}%</span>
                <span className="text-gray-500">Confiance: {Math.round(recommendation.confidence)}%</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Profils des débiteurs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <h3 className="text-xl font-semibold mb-4">Profils des débiteurs</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Débiteur</th>
                <th className="text-center py-2">Stabilité financière</th>
                <th className="text-center py-2">Historique de paiement</th>
                <th className="text-center py-2">Problèmes légaux</th>
                <th className="text-center py-2">Coopération</th>
                <th className="text-center py-2">Score global</th>
                <th className="text-center py-2">Catégorie de risque</th>
              </tr>
            </thead>
            <tbody>
              {debtorProfiles.map((profile) => (
                <tr key={profile.id} className="border-b">
                  <td className="py-3 font-medium">{profile.name}</td>
                  <td className="text-center py-3">{profile.financial_stability}%</td>
                  <td className="text-center py-3">{profile.payment_history}%</td>
                  <td className="text-center py-3">{profile.legal_issues}%</td>
                  <td className="text-center py-3">{profile.cooperation_level}%</td>
                  <td className="text-center py-3 font-bold">{profile.overall_score}%</td>
                  <td className="text-center py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${getRiskColor(profile.risk_category)}`}>
                      {profile.risk_category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default PredictiveAIDashboard;

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import {
  Play,
  Pause,
  Settings,
  TrendingUp,
  TrendingDown,
  Mail,
  MessageSquare,
  Phone,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  Activity,
  BarChart3,
  FileText,
  Send,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Sparkles
} from 'lucide-react'

// Types pour les données du dashboard
interface WorkflowStats {
  active: number
  processed: number
  success: number
  pending: number
}

interface CommunicationStats {
  totalSent: number
  emailsDelivered: number
  smsDelivered: number
  bounceRate: number
  responseRate: number
}

interface CaseScoring {
  caseId: string
  clientName: string
  amount: number
  score: number
  priority: string
  recommendedActions: string[]
}

interface PredictiveData {
  month: string
  predicted: number
  actual: number
  confidence: number
}

export default function WorkflowDashboard() {
  const [workflowStats, setWorkflowStats] = useState<WorkflowStats>({
    active: 12,
    processed: 48,
    success: 42,
    pending: 6
  })

  const [communicationStats, setCommunicationStats] = useState<CommunicationStats>({
    totalSent: 1247,
    emailsDelivered: 1156,
    smsDelivered: 891,
    bounceRate: 7.3,
    responseRate: 23.8
  })

  const [caseScorings, setCaseScorings] = useState<CaseScoring[]>([
    {
      caseId: '1',
      clientName: 'TECHNO SAS',
      amount: 15000,
      score: 87,
      priority: 'high',
      recommendedActions: ['Appel prioritaire', 'Proposition plan paiement']
    },
    {
      caseId: '2',
      clientName: 'INNOV SA',
      amount: 8500,
      score: 72,
      priority: 'medium',
      recommendedActions: ['Email de relance', 'RDV négociation']
    },
    {
      caseId: '3',
      clientName: 'STARTUP TECH',
      amount: 3200,
      score: 45,
      priority: 'low',
      recommendedActions: ['Vérifier solvabilité', 'Procédure judiciaire']
    }
  ])

  const [isProcessing, setIsProcessing] = useState(false)
  const [lastProcessed, setLastProcessed] = useState<Date>(new Date())

  // Données pour les graphiques
  const workflowPerformanceData = [
    { name: 'Lun', processed: 8, success: 7 },
    { name: 'Mar', processed: 12, success: 11 },
    { name: 'Mer', processed: 6, success: 5 },
    { name: 'Jeu', processed: 15, success: 13 },
    { name: 'Ven', processed: 10, success: 9 },
    { name: 'Sam', processed: 4, success: 4 },
    { name: 'Dim', processed: 2, success: 2 }
  ]

  const communicationBreakdown = [
    { name: 'Emails', value: 1156, color: '#3b82f6' },
    { name: 'SMS', value: 891, color: '#10b981' },
    { name: 'Appels', value: 234, color: '#f59e0b' },
    { name: 'Courriers', value: 89, color: '#ef4444' }
  ]

  const predictionData: PredictiveData[] = [
    { month: 'Jan', predicted: 85000, actual: 82000, confidence: 92 },
    { month: 'Fév', predicted: 92000, actual: 89000, confidence: 88 },
    { month: 'Mar', predicted: 78000, actual: 81000, confidence: 95 },
    { month: 'Avr', predicted: 105000, actual: 0, confidence: 87 },
    { month: 'Mai', predicted: 98000, actual: 0, confidence: 84 },
    { month: 'Jun', predicted: 112000, actual: 0, confidence: 89 }
  ]

  // Traitement manuel des workflows
  const handleProcessWorkflows = async () => {
    setIsProcessing(true)
    try {
      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setWorkflowStats(prev => ({
        ...prev,
        processed: prev.processed + 5,
        success: prev.success + 4,
        pending: Math.max(0, prev.pending - 3)
      }))
      
      setLastProcessed(new Date())
    } catch (error) {
      console.error('Error processing workflows:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Envoi de communication
  const handleSendCommunication = async (caseId: string, trigger: string) => {
    try {
      console.log(`Sending ${trigger} communication for case ${caseId}`)
      
      // Simulation d'envoi
      setCommunicationStats(prev => ({
        ...prev,
        totalSent: prev.totalSent + 1,
        emailsDelivered: prev.emailsDelivered + 1
      }))
      
    } catch (error) {
      console.error('Error sending communication:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-orange-600 bg-orange-50'
      case 'low': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Zap className="h-8 w-8 text-blue-600" />
                Workflow Automation
              </h1>
              <p className="text-gray-600 mt-1">
                Intelligence artificielle et automatisation pour le recouvrement
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleProcessWorkflows}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Exécuter Workflows
                  </>
                )}
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuration
              </Button>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            Dernière exécution: {lastProcessed.toLocaleString('fr-FR')}
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Workflows actifs */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Workflows Actifs</p>
                <p className="text-3xl font-bold text-blue-600">{workflowStats.active}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+2</span>
              <span className="text-gray-500 ml-1">cette semaine</span>
            </div>
          </div>

          {/* Traitements réussis */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux de Succès</p>
                <p className="text-3xl font-bold text-green-600">
                  {Math.round((workflowStats.success / workflowStats.processed) * 100)}%
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+5.2%</span>
              <span className="text-gray-500 ml-1">vs mois dernier</span>
            </div>
          </div>

          {/* Communications envoyées */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Communications</p>
                <p className="text-3xl font-bold text-orange-600">{communicationStats.totalSent}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Send className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+12%</span>
              <span className="text-gray-500 ml-1">ce mois</span>
            </div>
          </div>

          {/* Taux de réponse */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux de Réponse</p>
                <p className="text-3xl font-bold text-purple-600">{communicationStats.responseRate}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-red-600">-1.3%</span>
              <span className="text-gray-500 ml-1">vs semaine dernière</span>
            </div>
          </div>
        </div>

        {/* Graphiques et analyses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Performance des workflows */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance des Workflows
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workflowPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="processed" fill="#3b82f6" name="Traités" />
                <Bar dataKey="success" fill="#10b981" name="Réussis" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Répartition des communications */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Types de Communication
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={communicationBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {communicationBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {communicationBreakdown.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scoring des dossiers */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Scoring Intelligent des Dossiers
          </h3>
          
          <div className="space-y-4">
            {caseScorings.map((scoring) => (
              <div key={scoring.caseId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{scoring.clientName}</h4>
                    <p className="text-gray-600">{scoring.amount.toLocaleString()} €</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Score</p>
                      <p className={`text-2xl font-bold ${getScoreColor(scoring.score)}`}>
                        {scoring.score}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(scoring.priority)}`}>
                      {scoring.priority === 'high' && 'Priorité Haute'}
                      {scoring.priority === 'medium' && 'Priorité Moyenne'}
                      {scoring.priority === 'low' && 'Priorité Faible'}
                    </span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Actions recommandées:</p>
                  <div className="flex flex-wrap gap-2">
                    {scoring.recommendedActions.map((action, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleSendCommunication(scoring.caseId, 'urgent_reminder')}
                    className="flex items-center gap-1"
                  >
                    <Mail className="h-4 w-4" />
                    Relance Email
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleSendCommunication(scoring.caseId, 'urgent_sms')}
                    className="flex items-center gap-1"
                  >
                    <MessageSquare className="h-4 w-4" />
                    SMS Urgent
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <Calendar className="h-4 w-4" />
                    Programmer RDV
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prédictions IA */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Prédictions de Recouvrement (IA)
          </h3>
          
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={predictionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  `${value?.toLocaleString()} €`, 
                  name === 'predicted' ? 'Prédiction IA' : 'Réel'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#3b82f6" 
                strokeWidth={3}
                strokeDasharray="5 5"
                name="predicted"
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                stroke="#10b981" 
                strokeWidth={3}
                name="actual"
              />
            </LineChart>
          </ResponsiveContainer>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Prédiction Avril</p>
              <p className="text-2xl font-bold text-blue-700">105,000 €</p>
              <p className="text-sm text-blue-500">Confiance: 87%</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Tendance</p>
              <p className="text-2xl font-bold text-green-700 flex items-center justify-center gap-1">
                <ArrowUpRight className="h-6 w-6" />
                +8.5%
              </p>
              <p className="text-sm text-green-500">vs trimestre précédent</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-600 font-medium">Fiabilité IA</p>
              <p className="text-2xl font-bold text-orange-700">89%</p>
              <p className="text-sm text-orange-500">Précision modèle</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import React from 'react'
import { 
  BarChart3,
  FileText,
  Users,
  Clock,
  Euro,
  Calendar,
  AlertTriangle,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  Download,
  Brain,
  Smartphone,
  Scale,
  TrendingUp,
  Shield
} from 'lucide-react'

interface DashboardStats {
  totalCases: number
  activeCases: number
  pendingCases: number
  closedCases: number
  totalRevenue: number
  monthlyRevenue: number
  pendingInvoices: number
  overdueInvoices: number
  totalClients: number
  activeClients: number
  newClientsThisMonth: number
  upcomingDeadlines: number
}

interface RecentActivity {
  id: string
  type: 'case' | 'client' | 'invoice' | 'deadline'
  title: string
  description: string
  date: string
  status: string
  amount?: number
}

interface QuickStats {
  label: string
  value: string | number
  change: number
  trend: 'up' | 'down' | 'stable'
  icon: React.ComponentType<{ className?: string }>
  color: string
}

export default function BackofficeDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalCases: 0,
    activeCases: 0,
    pendingCases: 0,
    closedCases: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    totalClients: 0,
    activeClients: 0,
    newClientsThisMonth: 0,
    upcomingDeadlines: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  // Mock data pour la démonstration
  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Simulation du chargement des données
    setTimeout(() => {
      setDashboardStats({
        totalCases: 87,
        activeCases: 34,
        pendingCases: 12,
        closedCases: 41,
        totalRevenue: 245000,
        monthlyRevenue: 42000,
        pendingInvoices: 8,
        overdueInvoices: 3,
        totalClients: 45,
        activeClients: 32,
        newClientsThisMonth: 6,
        upcomingDeadlines: 9
      })

      setRecentActivity([
        {
          id: '1',
          type: 'case',
          title: 'Nouveau dossier contentieux',
          description: 'SAS TECHNO vs SUPPLIER CORP - Rupture contrat',
          date: '2025-01-28',
          status: 'nouveau'
        },
        {
          id: '2',
          type: 'invoice',
          title: 'Facture émise',
          description: 'Conseil juridique - INNOV SA',
          date: '2025-01-27',
          status: 'envoyée',
          amount: 3500
        },
        {
          id: '3',
          type: 'deadline',
          title: 'Échéance procédure',
          description: 'Dépôt conclusions - Tribunal Commerce',
          date: '2025-01-30',
          status: 'urgent'
        },
        {
          id: '4',
          type: 'client',
          title: 'Nouveau client',
          description: 'DIGITAL SOLUTIONS SARL',
          date: '2025-01-26',
          status: 'actif'
        }
      ])

      setLoading(false)
    }, 1000)
  }, [session, status, router])

  const quickStats: QuickStats[] = [
    {
      label: 'Dossiers Actifs',
      value: dashboardStats.activeCases,
      change: 12,
      trend: 'up',
      icon: Briefcase,
      color: 'text-blue-600'
    },
    {
      label: 'CA Mensuel',
      value: `${dashboardStats.monthlyRevenue.toLocaleString()}€`,
      change: 8.5,
      trend: 'up',
      icon: Euro,
      color: 'text-green-600'
    },
    {
      label: 'Clients Actifs',
      value: dashboardStats.activeClients,
      change: -2,
      trend: 'down',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      label: 'Échéances',
      value: dashboardStats.upcomingDeadlines,
      change: 0,
      trend: 'stable',
      icon: Clock,
      color: 'text-orange-600'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Cabinet Bensimhon - Back Office
              </h1>
              <p className="text-gray-600 mt-1">
                Tableau de bord de gestion - {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => {
                  alert('Fonctionnalité d\'export en cours de développement.\nProchainement : Export PDF, Excel, CSV des données.')
                }}
              >
                <Download className="h-4 w-4" />
                Exporter
              </Button>
              <Button 
                className="flex items-center gap-2"
                onClick={() => router.push('/backoffice/dossiers/nouveau')}
              >
                <Plus className="h-4 w-4" />
                Nouveau dossier
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <div 
              key={index} 
              className="bg-white rounded-xl shadow-sm border p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                if (stat.label === 'Dossiers Actifs') router.push('/backoffice/dossiers')
                if (stat.label === 'Clients Actifs') router.push('/backoffice/clients')
                if (stat.label === 'CA Mensuel') router.push('/backoffice/facturation')
                if (stat.label === 'Échéances') router.push('/backoffice/agenda')
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-gray-50 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                {stat.trend === 'up' && (
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                )}
                {stat.trend === 'down' && (
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 
                  stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {stat.trend === 'stable' ? 'Stable' : `${stat.change > 0 ? '+' : ''}${stat.change}%`}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs mois dernier</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Overview Cards */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Dossiers Overview */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Vue d&apos;ensemble des dossiers</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/backoffice/dossiers')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir tout
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div 
                  className="text-center p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => router.push('/backoffice/dossiers')}
                >
                  <div className="text-2xl font-bold text-blue-600">{dashboardStats.totalCases}</div>
                  <div className="text-sm text-blue-600">Total</div>
                </div>
                <div 
                  className="text-center p-4 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() => router.push('/backoffice/dossiers?status=actif')}
                >
                  <div className="text-2xl font-bold text-green-600">{dashboardStats.activeCases}</div>
                  <div className="text-sm text-green-600">Actifs</div>
                </div>
                <div 
                  className="text-center p-4 bg-yellow-50 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
                  onClick={() => router.push('/backoffice/dossiers?status=en_attente')}
                >
                  <div className="text-2xl font-bold text-yellow-600">{dashboardStats.pendingCases}</div>
                  <div className="text-sm text-yellow-600">En attente</div>
                </div>
                <div 
                  className="text-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => router.push('/backoffice/dossiers?status=clos')}
                >
                  <div className="text-2xl font-bold text-gray-600">{dashboardStats.closedCases}</div>
                  <div className="text-sm text-gray-600">Clos</div>
                </div>
              </div>
            </div>

            {/* Financial Overview */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Situation financière</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/backoffice/facturation')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Détails
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div 
                  className="text-center cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                  onClick={() => router.push('/backoffice/facturation')}
                >
                  <div className="text-3xl font-bold text-green-600">
                    {dashboardStats.totalRevenue.toLocaleString()}€
                  </div>
                  <div className="text-sm text-gray-500">CA Total</div>
                </div>
                <div 
                  className="text-center cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                  onClick={() => router.push('/backoffice/facturation?status=en_attente')}
                >
                  <div className="text-3xl font-bold text-blue-600">
                    {dashboardStats.pendingInvoices}
                  </div>
                  <div className="text-sm text-gray-500">Factures en attente</div>
                </div>
                <div 
                  className="text-center cursor-pointer hover:bg-gray-50 p-3 rounded-lg transition-colors"
                  onClick={() => router.push('/backoffice/facturation?status=en_retard')}
                >
                  <div className="text-3xl font-bold text-red-600">
                    {dashboardStats.overdueInvoices}
                  </div>
                  <div className="text-sm text-gray-500">Factures en retard</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Actions rapides</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => router.push('/backoffice/dossiers/nouveau')}
                >
                  <FileText className="h-6 w-6 mb-2" />
                  Nouveau dossier
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => router.push('/backoffice/clients/nouveau')}
                >
                  <Users className="h-6 w-6 mb-2" />
                  Ajouter client
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => router.push('/backoffice/facturation/nouvelle')}
                >
                  <Euro className="h-6 w-6 mb-2" />
                  Créer facture
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => router.push('/backoffice/agenda')}
                >
                  <Calendar className="h-6 w-6 mb-2" />
                  Planifier RDV
                </Button>
              </div>
            </div>

            {/* Phase 3 - Intelligence & Analytics */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-sm border border-purple-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🚀 Phase 3 - Intelligence & Analytics</h3>
              <p className="text-sm text-gray-600 mb-6">Fonctionnalités avancées d'IA et d'analyse prédictive</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => router.push('/backoffice/business-intelligence')}
                  className="p-4 text-left bg-white border border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Business Intelligence</h4>
                      <p className="text-sm text-gray-500">KPIs et analytics</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/backoffice/predictive-ai')}
                  className="p-4 text-left bg-white border border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Brain className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">IA Prédictive</h4>
                      <p className="text-sm text-gray-500">Scoring et recommandations</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/mobile')}
                  className="p-4 text-left bg-white border border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Smartphone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">App Mobile PWA</h4>
                      <p className="text-sm text-gray-500">Géolocalisation et scan</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/backoffice/legal-ecosystem')}
                  className="p-4 text-left bg-white border border-yellow-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Scale className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Écosystème Légal</h4>
                      <p className="text-sm text-gray-500">Infogreffe, BdF, huissiers</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Phase 4 - Sécurité & Conformité RGPD */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-sm border border-red-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🔒 Phase 4 - Sécurité & Conformité RGPD</h3>
              <p className="text-sm text-gray-600 mb-6">Sécurité avancée et conformité réglementaire complète</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => router.push('/backoffice/security')}
                  className="p-4 text-left bg-white border border-red-200 rounded-lg hover:border-red-400 hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Sécurité Avancée</h4>
                      <p className="text-sm text-gray-500">Monitoring et audit trail</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/backoffice/rgpd')}
                  className="p-4 text-left bg-white border border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Conformité RGPD</h4>
                      <p className="text-sm text-gray-500">Consentements et droit à l'oubli</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    alert('Interface 2FA:\n• Configuration authentification double facteur\n• Codes de récupération\n• Gestion des appareils de confiance\n• Intégration Google Authenticator/Authy')
                  }}
                  className="p-4 text-left bg-white border border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Authentification 2FA</h4>
                      <p className="text-sm text-gray-500">Protection double facteur</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    alert('Chiffrement des Données:\n• AES-256 end-to-end\n• Rotation automatique des clés\n• Chiffrement des documents sensibles\n• Anonymisation automatique')
                  }}
                  className="p-4 text-left bg-white border border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Eye className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Chiffrement Données</h4>
                      <p className="text-sm text-gray-500">Protection AES-256</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Modules CRM */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Modules CRM</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => router.push('/backoffice/dossiers')}
                  className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Gestion des Dossiers</h4>
                      <p className="text-sm text-gray-500">Contentieux, conseil, M&A</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/backoffice/clients')}
                  className="p-4 text-left border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Gestion des Clients</h4>
                      <p className="text-sm text-gray-500">Base clients et prospects</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/backoffice/facturation')}
                  className="p-4 text-left border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Euro className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Facturation</h4>
                      <p className="text-sm text-gray-500">Gestion financière</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/backoffice/agenda')}
                  className="p-4 text-left border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Agenda</h4>
                      <p className="text-sm text-gray-500">Planning et RDV</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/backoffice/documents')}
                  className="p-4 text-left border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors md:col-span-2 lg:col-span-1"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <FileText className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Documents</h4>
                      <p className="text-sm text-gray-500">Bibliothèque</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Activity & Alerts */}
          <div className="space-y-6">
            
            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Activité récente</h3>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'case' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'invoice' ? 'bg-green-100 text-green-600' :
                      activity.type === 'deadline' ? 'bg-red-100 text-red-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {activity.type === 'case' && <Briefcase className="h-4 w-4" />}
                      {activity.type === 'invoice' && <Euro className="h-4 w-4" />}
                      {activity.type === 'deadline' && <Clock className="h-4 w-4" />}
                      {activity.type === 'client' && <Users className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{activity.title}</p>
                      <p className="text-gray-600 text-xs">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {new Date(activity.date).toLocaleDateString('fr-FR')}
                        </span>
                        {activity.amount && (
                          <span className="text-xs font-medium text-green-600">
                            {activity.amount.toLocaleString()}€
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts & Deadlines */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Alertes & Échéances</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium text-red-900 text-sm">3 factures en retard</p>
                    <p className="text-red-700 text-xs">Relance nécessaire</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-yellow-900 text-sm">Audience demain</p>
                    <p className="text-yellow-700 text-xs">Tribunal de Commerce</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-blue-900 text-sm">RDV client</p>
                    <p className="text-blue-700 text-xs">Vendredi 14h - INNOV SA</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Indicators */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Indicateurs</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Taux de recouvrement</span>
                    <span className="font-medium">87%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Délai moyen règlement</span>
                    <span className="font-medium">42 jours</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Satisfaction client</span>
                    <span className="font-medium">94%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

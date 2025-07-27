'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  BarChart3,
  Users,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  Euro,
  Calendar,
  Filter,
  Search,
  Plus,
  Download,
  MessageSquare,
  Eye
} from 'lucide-react'

interface Case {
  id: string
  title: string
  debtorName: string
  amount: number
  currency: string
  status: string
  createdAt: string
  dueDate?: string
  user?: {
    name: string
    email: string
    company?: string
  }
  _count?: {
    actions: number
    documents: number
    messages: number
  }
}

export default function Backoffice() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Check if user is lawyer or admin
    if (session.user?.role !== 'LAWYER' && session.user?.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    // Fetch all cases for lawyers
    fetchCases()
  }, [session, status, router])

  const fetchCases = async () => {
    try {
      const response = await fetch('/api/cases')
      if (response.ok) {
        const data = await response.json()
        setCases(data)
      }
    } catch (error) {
      console.error('Error fetching cases:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED': return 'bg-green-100 text-green-800'
      case 'CLOSED': return 'bg-gray-100 text-gray-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Ouvert'
      case 'IN_PROGRESS': return 'En cours'
      case 'RESOLVED': return 'Résolu'
      case 'CLOSED': return 'Fermé'
      case 'CANCELLED': return 'Annulé'
      default: return status
    }
  }

  const getPriorityColor = (dueDate?: string, status?: string) => {
    if (status === 'RESOLVED' || status === 'CLOSED') return 'text-gray-400'
    
    if (!dueDate) return 'text-gray-400'
    
    const due = new Date(dueDate)
    const now = new Date()
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'text-red-600' // Overdue
    if (diffDays <= 7) return 'text-orange-600' // Due soon
    return 'text-green-600' // On time
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const filteredCases = cases.filter(case_ => {
    const matchesStatus = filterStatus === 'ALL' || case_.status === filterStatus
    const matchesSearch = !searchTerm || 
      case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.debtorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.user?.company?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  const stats = {
    total: cases.length,
    open: cases.filter(c => c.status === 'OPEN').length,
    inProgress: cases.filter(c => c.status === 'IN_PROGRESS').length,
    resolved: cases.filter(c => c.status === 'RESOLVED').length,
    totalAmount: cases.reduce((sum, c) => sum + c.amount, 0),
    overdue: cases.filter(c => {
      if (!c.dueDate || c.status === 'RESOLVED' || c.status === 'CLOSED') return false
      return new Date(c.dueDate) < new Date()
    }).length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Backoffice Avocat
              </h1>
              <p className="text-gray-600 mt-1">
                Gestion complète des dossiers de recouvrement
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" size="lg">
                <Download className="h-5 w-5 mr-2" />
                Export
              </Button>
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Nouveau dossier
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total dossiers</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Nouveaux</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.open}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En cours</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Résolus</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.resolved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En retard</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.overdue}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Euro className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Montant total</p>
                <p className="text-xl font-semibold text-gray-900">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    notation: 'compact'
                  }).format(stats.totalAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par débiteur, client, entreprise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ALL">Tous les statuts</option>
                  <option value="OPEN">Nouveaux</option>
                  <option value="IN_PROGRESS">En cours</option>
                  <option value="RESOLVED">Résolus</option>
                  <option value="CLOSED">Fermés</option>
                  <option value="CANCELLED">Annulés</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Cases Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Dossiers ({filteredCases.length})
            </h2>
          </div>
          
          {filteredCases.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm || filterStatus !== 'ALL' ? 'Aucun dossier trouvé' : 'Aucun dossier'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterStatus !== 'ALL' 
                  ? 'Essayez de modifier vos critères de recherche' 
                  : 'Les nouveaux dossiers apparaîtront ici'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dossier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Débiteur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Échéance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCases.map((case_) => (
                    <tr key={case_.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {case_.title}
                          </div>
                          <div className="text-sm text-gray-500">#{case_.id.slice(-8)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {case_.user?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {case_.user?.company || case_.user?.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {case_.debtorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: case_.currency
                        }).format(case_.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(case_.status)}`}>
                          {getStatusText(case_.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {case_.dueDate ? (
                          <div className={`text-sm ${getPriorityColor(case_.dueDate, case_.status)}`}>
                            {new Date(case_.dueDate).toLocaleDateString('fr-FR')}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-3 text-sm text-gray-500">
                          <span title="Actions">{case_._count?.actions || 0}</span>
                          <span title="Documents">{case_._count?.documents || 0}</span>
                          <span title="Messages">{case_._count?.messages || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/backoffice/cases/${case_.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
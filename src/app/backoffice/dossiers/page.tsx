'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  FileText,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Archive,
  AlertTriangle,
  Clock,
  CheckCircle,
  Scale,
  Building2,
  User,
  Euro,
  Calendar,
  MoreHorizontal,
  Download,
  Mail,
  Phone
} from 'lucide-react'

interface Case {
  id: string
  reference: string
  title: string
  type: 'contentieux' | 'conseil' | 'recouvrement' | 'corporate' | 'ma'
  client: {
    id: string
    name: string
    company?: string
    email: string
    phone?: string
  }
  counterparty?: {
    name: string
    company?: string
  }
  amount?: number
  currency: string
  status: 'ouvert' | 'en_cours' | 'en_attente' | 'suspendu' | 'termine' | 'archive'
  priority: 'basse' | 'normale' | 'haute' | 'urgente'
  createdAt: string
  updatedAt: string
  dueDate?: string
  assignedTo: string
  description: string
  tags: string[]
  nextAction?: {
    type: string
    date: string
    description: string
  }
}

export default function DossiersManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState<Case[]>([])
  const [filteredCases, setFilteredCases] = useState<Case[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('tous')
  const [filterType, setFilterType] = useState('tous')
  const [sortBy, setSortBy] = useState('recent')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Simulation de données pour la démonstration
    setTimeout(() => {
      const mockCases: Case[] = [
        {
          id: '1',
          reference: 'DOS-2025-001',
          title: 'Rupture de contrat commercial',
          type: 'contentieux',
          client: {
            id: '1',
            name: 'Martin Dubois',
            company: 'TECHNO SAS',
            email: 'martin.dubois@techno.fr',
            phone: '01 23 45 67 89'
          },
          counterparty: {
            name: 'Supplier Corp',
            company: 'SUPPLIER CORP SARL'
          },
          amount: 150000,
          currency: 'EUR',
          status: 'en_cours',
          priority: 'haute',
          createdAt: '2025-01-15',
          updatedAt: '2025-01-28',
          dueDate: '2025-02-15',
          assignedTo: 'Yankel Bensimhon',
          description: 'Contentieux suite à rupture abusive de contrat de fourniture. Demande de dommages-intérêts.',
          tags: ['Contentieux', 'Commercial', 'B2B'],
          nextAction: {
            type: 'Audience',
            date: '2025-01-30',
            description: 'Tribunal de Commerce - Plaidoirie'
          }
        },
        {
          id: '2',
          reference: 'DOS-2025-002',
          title: 'Conseil juridique M&A',
          type: 'ma',
          client: {
            id: '2',
            name: 'Sophie Laurent',
            company: 'INNOV SA',
            email: 'sophie.laurent@innov.fr',
            phone: '01 34 56 78 90'
          },
          amount: 45000,
          currency: 'EUR',
          status: 'en_cours',
          priority: 'normale',
          createdAt: '2025-01-20',
          updatedAt: '2025-01-27',
          dueDate: '2025-03-01',
          assignedTo: 'Yankel Bensimhon',
          description: 'Acquisition de société - Due diligence juridique et rédaction des actes.',
          tags: ['M&A', 'Corporate', 'Acquisition'],
          nextAction: {
            type: 'Réunion',
            date: '2025-01-31',
            description: 'Point d&apos;avancement avec le client'
          }
        },
        {
          id: '3',
          reference: 'DOS-2025-003',
          title: 'Recouvrement de créances',
          type: 'recouvrement',
          client: {
            id: '3',
            name: 'Pierre Moreau',
            company: 'DIGITAL SOLUTIONS',
            email: 'pierre.moreau@digital.fr'
          },
          counterparty: {
            name: 'Client défaillant',
            company: 'BAD PAYER SARL'
          },
          amount: 25000,
          currency: 'EUR',
          status: 'ouvert',
          priority: 'normale',
          createdAt: '2025-01-25',
          updatedAt: '2025-01-28',
          assignedTo: 'Yankel Bensimhon',
          description: 'Recouvrement amiable puis judiciaire de factures impayées.',
          tags: ['Recouvrement', 'Impayés']
        },
        {
          id: '4',
          reference: 'DOS-2025-004',
          title: 'Conseil en droit social',
          type: 'conseil',
          client: {
            id: '4',
            name: 'Marie Durand',
            company: 'STARTUP TECH',
            email: 'marie.durand@startup.fr',
            phone: '01 45 67 89 01'
          },
          status: 'termine',
          priority: 'basse',
          createdAt: '2025-01-10',
          updatedAt: '2025-01-26',
          assignedTo: 'Yankel Bensimhon',
          description: 'Conseil sur la rédaction de contrats de travail et règlement intérieur.',
          tags: ['Conseil', 'Social', 'RH'],
          currency: 'EUR'
        }
      ]

      setCases(mockCases)
      setFilteredCases(mockCases)
      setLoading(false)
    }, 1000)
  }, [session, status, router])

  // Filtrage et recherche
  useEffect(() => {
    let filtered = [...cases]

    // Filtre par statut
    if (filterStatus !== 'tous') {
      filtered = filtered.filter(c => c.status === filterStatus)
    }

    // Filtre par type
    if (filterType !== 'tous') {
      filtered = filtered.filter(c => c.type === filterType)
    }

    // Recherche
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'priority':
          const priorityOrder = { 'urgente': 4, 'haute': 3, 'normale': 2, 'basse': 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        case 'amount':
          return (b.amount || 0) - (a.amount || 0)
        case 'alphabetical':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    setFilteredCases(filtered)
  }, [cases, filterStatus, filterType, searchTerm, sortBy])

  const getStatusColor = (status: Case['status']) => {
    switch (status) {
      case 'ouvert': return 'bg-blue-100 text-blue-800'
      case 'en_cours': return 'bg-green-100 text-green-800'
      case 'en_attente': return 'bg-yellow-100 text-yellow-800'
      case 'suspendu': return 'bg-orange-100 text-orange-800'
      case 'termine': return 'bg-gray-100 text-gray-800'
      case 'archive': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: Case['status']) => {
    switch (status) {
      case 'ouvert': return 'Ouvert'
      case 'en_cours': return 'En cours'
      case 'en_attente': return 'En attente'
      case 'suspendu': return 'Suspendu'
      case 'termine': return 'Terminé'
      case 'archive': return 'Archivé'
      default: return status
    }
  }

  const getPriorityColor = (priority: Case['priority']) => {
    switch (priority) {
      case 'urgente': return 'text-red-600'
      case 'haute': return 'text-orange-600'
      case 'normale': return 'text-blue-600'
      case 'basse': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getTypeIcon = (type: Case['type']) => {
    switch (type) {
      case 'contentieux': return <Scale className="h-4 w-4" />
      case 'conseil': return <FileText className="h-4 w-4" />
      case 'recouvrement': return <Euro className="h-4 w-4" />
      case 'corporate': return <Building2 className="h-4 w-4" />
      case 'ma': return <Building2 className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getTypeText = (type: Case['type']) => {
    switch (type) {
      case 'contentieux': return 'Contentieux'
      case 'conseil': return 'Conseil'
      case 'recouvrement': return 'Recouvrement'
      case 'corporate': return 'Corporate'
      case 'ma': return 'M&A'
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des dossiers...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Dossiers</h1>
              <p className="text-gray-600 mt-1">
                {filteredCases.length} dossier{filteredCases.length > 1 ? 's' : ''} 
                {searchTerm && ` correspondant à "${searchTerm}"`}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exporter
              </Button>
              <Link href="/backoffice/dossiers/nouveau">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nouveau dossier
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Recherche */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Rechercher par référence, titre, client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filtre statut */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="tous">Tous les statuts</option>
                <option value="ouvert">Ouvert</option>
                <option value="en_cours">En cours</option>
                <option value="en_attente">En attente</option>
                <option value="suspendu">Suspendu</option>
                <option value="termine">Terminé</option>
                <option value="archive">Archivé</option>
              </select>
            </div>

            {/* Filtre type */}
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="tous">Tous les types</option>
                <option value="contentieux">Contentieux</option>
                <option value="conseil">Conseil</option>
                <option value="recouvrement">Recouvrement</option>
                <option value="corporate">Corporate</option>
                <option value="ma">M&A</option>
              </select>
            </div>
          </div>

          {/* Tri */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Trier par :</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="recent">Plus récent</option>
                <option value="priority">Priorité</option>
                <option value="amount">Montant</option>
                <option value="alphabetical">Alphabétique</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-500">
              {filteredCases.length} résultat{filteredCases.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Liste des dossiers */}
        <div className="space-y-4">
          {filteredCases.map((case_) => (
            <div key={case_.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                
                {/* Informations principales */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(case_.type)}
                      <span className="text-sm font-medium text-gray-600">
                        {getTypeText(case_.type)}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-600">{case_.reference}</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(case_.status)}`}>
                      {getStatusText(case_.status)}
                    </span>
                    <span className={`text-sm font-medium ${getPriorityColor(case_.priority)}`}>
                      {case_.priority.charAt(0).toUpperCase() + case_.priority.slice(1)}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {case_.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {case_.description}
                  </p>

                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{case_.client.company || case_.client.name}</span>
                    </div>
                    {case_.counterparty && (
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        <span>vs {case_.counterparty.company || case_.counterparty.name}</span>
                      </div>
                    )}
                    {case_.amount && (
                      <div className="flex items-center gap-1">
                        <Euro className="h-4 w-4" />
                        <span>{case_.amount.toLocaleString()} {case_.currency}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(case_.updatedAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  {/* Prochaine action */}
                  {case_.nextAction && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">
                          Prochaine action: {case_.nextAction.type}
                        </span>
                        <span className="text-blue-700">
                          le {new Date(case_.nextAction.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-blue-700 text-sm mt-1 ml-6">
                        {case_.nextAction.description}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {case_.tags.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {case_.tags.map((tag, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="sm" title="Voir le dossier">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Modifier">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Contact client">
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Plus d&apos;actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message si aucun résultat */}
        {filteredCases.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun dossier trouvé</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterStatus !== 'tous' || filterType !== 'tous' 
                ? 'Aucun dossier ne correspond à vos critères de recherche.'
                : 'Commencez par créer votre premier dossier.'
              }
            </p>
            <Link href="/backoffice/dossiers/nouveau">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Créer un dossier
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

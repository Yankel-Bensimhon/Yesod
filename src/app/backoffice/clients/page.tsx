'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Mail,
  Phone,
  Building2,
  MapPin,
  FileText,
  Calendar,
  MoreHorizontal,
  Download,
  Star,
  AlertCircle,
  Euro,
  Clock,
  User,
  Briefcase
} from 'lucide-react'

interface Client {
  id: string
  type: 'particulier' | 'entreprise'
  name: string
  firstName?: string
  lastName?: string
  company?: string
  email: string
  phone?: string
  address?: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  siret?: string
  industry?: string
  website?: string
  status: 'actif' | 'inactif' | 'prospect' | 'ancien'
  priority: 'basse' | 'normale' | 'haute' | 'vip'
  createdAt: string
  updatedAt: string
  lastContact?: string
  totalCases: number
  activeCases: number
  totalBilled: number
  currency: string
  notes?: string
  tags: string[]
  assignedTo: string
  source: 'referral' | 'website' | 'networking' | 'advertising' | 'other'
  nextFollowUp?: {
    date: string
    type: string
    description: string
  }
}

export default function ClientsManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('tous')
  const [filterType, setFilterType] = useState('tous')
  const [sortBy, setSortBy] = useState('recent')

  // Fonction pour gérer les actions supplémentaires des clients
  const handleMoreActionsClient = (clientId: string) => {
    const actions = [
      'Créer un nouveau dossier',
      'Voir l\'historique complet',
      'Planifier un rendez-vous',
      'Exporter les données',
      'Marquer comme inactif',
      'Fusionner avec un autre client'
    ]
    
    const action = window.prompt(`Actions disponibles pour le client ${clientId}:\n\n${actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nChoisissez un numéro (1-${actions.length}):`)
    
    if (action && !isNaN(parseInt(action))) {
      const actionIndex = parseInt(action) - 1
      if (actionIndex >= 0 && actionIndex < actions.length) {
        if (actionIndex === 0) {
          // Créer un nouveau dossier pour ce client
          router.push(`/backoffice/dossiers/nouveau?clientId=${clientId}`)
        } else {
          alert(`Action "${actions[actionIndex]}" sera bientôt disponible pour le client ${clientId}`)
        }
      }
    }
  }

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Simulation de données pour la démonstration
    setTimeout(() => {
      const mockClients: Client[] = [
        {
          id: '1',
          type: 'entreprise',
          name: 'TECHNO SAS',
          email: 'contact@techno.fr',
          phone: '01 23 45 67 89',
          address: {
            street: '123 Avenue des Champs-Élysées',
            city: 'Paris',
            postalCode: '75008',
            country: 'France'
          },
          siret: '12345678901234',
          industry: 'Technologie',
          website: 'https://techno.fr',
          status: 'actif',
          priority: 'haute',
          createdAt: '2024-01-15',
          updatedAt: '2025-01-28',
          lastContact: '2025-01-25',
          totalCases: 5,
          activeCases: 2,
          totalBilled: 250000,
          currency: 'EUR',
          notes: 'Client stratégique - secteur technologie. Besoins récurrents en droit des contrats et propriété intellectuelle.',
          tags: ['Technologie', 'Récurrent', 'Stratégique'],
          assignedTo: 'Yankel Bensimhon',
          source: 'referral',
          nextFollowUp: {
            date: '2025-02-05',
            type: 'Appel de suivi',
            description: 'Point mensuel sur les dossiers en cours'
          }
        },
        {
          id: '2',
          type: 'entreprise',
          name: 'INNOV SA',
          email: 'contact@innov.fr',
          phone: '01 34 56 78 90',
          address: {
            street: '45 Rue de la Paix',
            city: 'Lyon',
            postalCode: '69000',
            country: 'France'
          },
          siret: '98765432109876',
          industry: 'Innovation',
          status: 'actif',
          priority: 'normale',
          createdAt: '2024-03-20',
          updatedAt: '2025-01-27',
          lastContact: '2025-01-20',
          totalCases: 3,
          activeCases: 1,
          totalBilled: 75000,
          currency: 'EUR',
          notes: 'Startup en croissance. Besoins en M&A et levées de fonds.',
          tags: ['Startup', 'M&A', 'Innovation'],
          assignedTo: 'Yankel Bensimhon',
          source: 'website'
        },
        {
          id: '3',
          type: 'particulier',
          name: 'Pierre Moreau',
          firstName: 'Pierre',
          lastName: 'Moreau',
          email: 'pierre.moreau@email.fr',
          phone: '01 45 67 89 01',
          address: {
            street: '78 Boulevard Haussmann',
            city: 'Paris',
            postalCode: '75009',
            country: 'France'
          },
          status: 'actif',
          priority: 'normale',
          createdAt: '2024-06-10',
          updatedAt: '2025-01-26',
          lastContact: '2025-01-15',
          totalCases: 2,
          activeCases: 1,
          totalBilled: 12000,
          currency: 'EUR',
          notes: 'Particulier - Contentieux immobilier et succession.',
          tags: ['Particulier', 'Immobilier'],
          assignedTo: 'Yankel Bensimhon',
          source: 'networking'
        },
        {
          id: '4',
          type: 'entreprise',
          name: 'STARTUP TECH',
          email: 'hello@startup-tech.fr',
          phone: '01 56 78 90 12',
          address: {
            street: '12 Rue de Rivoli',
            city: 'Paris',
            postalCode: '75001',
            country: 'France'
          },
          siret: '11122233344455',
          industry: 'Tech',
          status: 'prospect',
          priority: 'haute',
          createdAt: '2025-01-20',
          updatedAt: '2025-01-28',
          totalCases: 0,
          activeCases: 0,
          totalBilled: 0,
          currency: 'EUR',
          notes: 'Prospect qualifié - Recherche conseil juridique pour structuration juridique.',
          tags: ['Prospect', 'Tech', 'Structuration'],
          assignedTo: 'Yankel Bensimhon',
          source: 'advertising',
          nextFollowUp: {
            date: '2025-01-30',
            type: 'Rendez-vous commercial',
            description: 'Présentation de nos services juridiques'
          }
        },
        {
          id: '5',
          type: 'particulier',
          name: 'Marie Durand',
          firstName: 'Marie',
          lastName: 'Durand',
          email: 'marie.durand@email.fr',
          phone: '01 67 89 01 23',
          status: 'ancien',
          priority: 'basse',
          createdAt: '2023-05-15',
          updatedAt: '2024-12-15',
          lastContact: '2024-12-01',
          totalCases: 1,
          activeCases: 0,
          totalBilled: 5000,
          currency: 'EUR',
          notes: 'Dossier terminé - Divorce contentieux.',
          tags: ['Particulier', 'Divorce', 'Terminé'],
          assignedTo: 'Yankel Bensimhon',
          source: 'referral'
        }
      ]

      setClients(mockClients)
      setFilteredClients(mockClients)
      setLoading(false)
    }, 1000)
  }, [session, status, router])

  // Filtrage et recherche
  useEffect(() => {
    let filtered = [...clients]

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
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.siret?.includes(searchTerm) ||
        c.phone?.includes(searchTerm)
      )
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'priority':
          const priorityOrder = { 'vip': 4, 'haute': 3, 'normale': 2, 'basse': 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        case 'billing':
          return b.totalBilled - a.totalBilled
        case 'alphabetical':
          return a.name.localeCompare(b.name)
        case 'cases':
          return b.activeCases - a.activeCases
        default:
          return 0
      }
    })

    setFilteredClients(filtered)
  }, [clients, filterStatus, filterType, searchTerm, sortBy])

  const getStatusColor = (status: Client['status']) => {
    switch (status) {
      case 'actif': return 'bg-green-100 text-green-800'
      case 'inactif': return 'bg-gray-100 text-gray-800'
      case 'prospect': return 'bg-blue-100 text-blue-800'
      case 'ancien': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: Client['status']) => {
    switch (status) {
      case 'actif': return 'Actif'
      case 'inactif': return 'Inactif'
      case 'prospect': return 'Prospect'
      case 'ancien': return 'Ancien'
      default: return status
    }
  }

  const getPriorityColor = (priority: Client['priority']) => {
    switch (priority) {
      case 'vip': return 'text-purple-600'
      case 'haute': return 'text-red-600'
      case 'normale': return 'text-blue-600'
      case 'basse': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getPriorityIcon = (priority: Client['priority']) => {
    if (priority === 'vip') {
      return <Star className="h-4 w-4 fill-current" />
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des clients...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Clients</h1>
              <p className="text-gray-600 mt-1">
                {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''} 
                {searchTerm && ` correspondant à "${searchTerm}"`}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exporter
              </Button>
              <Link href="/backoffice/clients/nouveau">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nouveau client
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clients actifs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.filter(c => c.status === 'actif').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Prospects</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.filter(c => c.status === 'prospect').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dossiers actifs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.reduce((sum, c) => sum + c.activeCases, 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CA total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.reduce((sum, c) => sum + c.totalBilled, 0).toLocaleString()}€
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Euro className="h-6 w-6 text-purple-600" />
              </div>
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
                  placeholder="Rechercher par nom, email, entreprise, SIRET..."
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
                <option value="actif">Actif</option>
                <option value="prospect">Prospect</option>
                <option value="inactif">Inactif</option>
                <option value="ancien">Ancien</option>
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
                <option value="entreprise">Entreprise</option>
                <option value="particulier">Particulier</option>
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
                <option value="billing">Chiffre d&apos;affaires</option>
                <option value="cases">Dossiers actifs</option>
                <option value="alphabetical">Alphabétique</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-500">
              {filteredClients.length} résultat{filteredClients.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Liste des clients */}
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                
                {/* Informations principales */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {client.type === 'entreprise' ? (
                        <Building2 className="h-5 w-5 text-blue-600" />
                      ) : (
                        <User className="h-5 w-5 text-green-600" />
                      )}
                      <span className="text-sm font-medium text-gray-600 capitalize">
                        {client.type}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">•</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(client.status)}`}>
                      {getStatusText(client.status)}
                    </span>
                    <div className={`flex items-center gap-1 text-sm font-medium ${getPriorityColor(client.priority)}`}>
                      {getPriorityIcon(client.priority)}
                      <span className="capitalize">{client.priority}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {client.name}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    
                    {/* Contact */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${client.email}`} className="hover:text-blue-600">
                          {client.email}
                        </a>
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4" />
                          <a href={`tel:${client.phone}`} className="hover:text-blue-600">
                            {client.phone}
                          </a>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>{client.address.city}, {client.address.postalCode}</span>
                        </div>
                      )}
                    </div>

                    {/* Statistiques */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4" />
                        <span>{client.activeCases} dossier{client.activeCases > 1 ? 's' : ''} actif{client.activeCases > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Euro className="h-4 w-4" />
                        <span>{client.totalBilled.toLocaleString()} {client.currency} facturés</span>
                      </div>
                      {client.lastContact && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Dernier contact: {new Date(client.lastContact).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                    </div>

                    {/* Détails supplémentaires */}
                    <div className="space-y-1">
                      {client.siret && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">SIRET:</span> {client.siret}
                        </div>
                      )}
                      {client.industry && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Secteur:</span> {client.industry}
                        </div>
                      )}
                      {client.assignedTo && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Assigné à:</span> {client.assignedTo}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prochaine action */}
                  {client.nextFollowUp && (
                    <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-900">
                          {client.nextFollowUp.type}
                        </span>
                        <span className="text-orange-700">
                          le {new Date(client.nextFollowUp.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-orange-700 text-sm mt-1 ml-6">
                        {client.nextFollowUp.description}
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  {client.notes && (
                    <p className="text-gray-600 text-sm mt-3 line-clamp-2">
                      {client.notes}
                    </p>
                  )}

                  {/* Tags */}
                  {client.tags.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {client.tags.map((tag, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    title="Voir le profil"
                    onClick={() => router.push(`/backoffice/clients/${client.id}`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    title="Modifier"
                    onClick={() => router.push(`/backoffice/clients/${client.id}/modifier`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    title="Envoyer un email"
                    onClick={() => window.open(`mailto:${client.email}`, '_blank')}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    title="Appeler"
                    onClick={() => window.open(`tel:${client.phone}`, '_self')}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    title="Plus d&apos;actions"
                    onClick={() => handleMoreActionsClient(client.id)}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message si aucun résultat */}
        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun client trouvé</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterStatus !== 'tous' || filterType !== 'tous' 
                ? 'Aucun client ne correspond à vos critères de recherche.'
                : 'Commencez par ajouter votre premier client.'
              }
            </p>
            <Link href="/backoffice/clients/nouveau">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un client
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

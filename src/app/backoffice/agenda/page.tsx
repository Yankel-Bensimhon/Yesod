'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Calendar,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  MapPin,
  Video,
  Phone,
  Users,
  FileText,
  Edit,
  Trash2,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  User,
  Building2
} from 'lucide-react'

interface Event {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  type: 'rdv_client' | 'audience' | 'reunion' | 'formation' | 'autre'
  location?: string
  isVirtual: boolean
  participants: Participant[]
  clientId?: string
  caseId?: string
  status: 'programme' | 'confirme' | 'annule' | 'reporte' | 'termine'
  priority: 'basse' | 'normale' | 'haute' | 'urgente'
  reminders: number[] // minutes avant
  notes?: string
  tags: string[]
  createdBy: string
  isRecurring: boolean
  recurringPattern?: string
}

interface Participant {
  id: string
  name: string
  email: string
  role: 'avocat' | 'client' | 'adversaire' | 'expert' | 'autre'
  confirmed: boolean
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  events: Event[]
}

export default function AgendaManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('tous')
  const [showEventModal, setShowEventModal] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Simulation de données pour la démonstration
    setTimeout(() => {
      const mockEvents: Event[] = [
        {
          id: '1',
          title: 'Audience Tribunal de Commerce',
          description: 'Plaidoirie pour le dossier TECHNO SAS vs SUPPLIER CORP',
          startTime: '2025-01-30T09:00:00',
          endTime: '2025-01-30T11:00:00',
          type: 'audience',
          location: 'Tribunal de Commerce de Paris - Salle 12',
          isVirtual: false,
          participants: [
            {
              id: '1',
              name: 'Yankel Bensimhon',
              email: 'y.bensimhon@cabinet.fr',
              role: 'avocat',
              confirmed: true
            },
            {
              id: '2',
              name: 'Martin Dubois',
              email: 'martin.dubois@techno.fr',
              role: 'client',
              confirmed: true
            }
          ],
          clientId: '1',
          caseId: '1',
          status: 'confirme',
          priority: 'haute',
          reminders: [1440, 60], // 24h et 1h avant
          notes: 'Apporter dossier complet + pièces originales',
          tags: ['Contentieux', 'Urgent'],
          createdBy: 'Yankel Bensimhon',
          isRecurring: false
        },
        {
          id: '2',
          title: 'RDV Client - INNOV SA',
          description: 'Point d&apos;avancement sur la due diligence M&A',
          startTime: '2025-01-31T14:00:00',
          endTime: '2025-01-31T15:30:00',
          type: 'rdv_client',
          location: 'Cabinet - Bureau principal',
          isVirtual: false,
          participants: [
            {
              id: '1',
              name: 'Yankel Bensimhon',
              email: 'y.bensimhon@cabinet.fr',
              role: 'avocat',
              confirmed: true
            },
            {
              id: '3',
              name: 'Sophie Laurent',
              email: 'sophie.laurent@innov.fr',
              role: 'client',
              confirmed: true
            }
          ],
          clientId: '2',
          caseId: '2',
          status: 'programme',
          priority: 'normale',
          reminders: [60, 15],
          notes: 'Préparer rapport d&apos;avancement et questions juridiques',
          tags: ['M&A', 'Suivi'],
          createdBy: 'Yankel Bensimhon',
          isRecurring: false
        },
        {
          id: '3',
          title: 'Visioconférence - Formation Droit Numérique',
          description: 'Formation continue sur les nouvelles réglementations RGPD',
          startTime: '2025-02-03T10:00:00',
          endTime: '2025-02-03T12:00:00',
          type: 'formation',
          location: 'En ligne',
          isVirtual: true,
          participants: [
            {
              id: '1',
              name: 'Yankel Bensimhon',
              email: 'y.bensimhon@cabinet.fr',
              role: 'avocat',
              confirmed: true
            }
          ],
          status: 'programme',
          priority: 'normale',
          reminders: [1440, 30],
          tags: ['Formation', 'RGPD'],
          createdBy: 'Yankel Bensimhon',
          isRecurring: false
        },
        {
          id: '4',
          title: 'Réunion Équipe Cabinet',
          description: 'Point hebdomadaire sur les dossiers en cours',
          startTime: '2025-02-03T17:00:00',
          endTime: '2025-02-03T18:00:00',
          type: 'reunion',
          location: 'Salle de réunion',
          isVirtual: false,
          participants: [
            {
              id: '1',
              name: 'Yankel Bensimhon',
              email: 'y.bensimhon@cabinet.fr',
              role: 'avocat',
              confirmed: true
            },
            {
              id: '4',
              name: 'Assistant Cabinet',
              email: 'assistant@cabinet.fr',
              role: 'autre',
              confirmed: true
            }
          ],
          status: 'programme',
          priority: 'normale',
          reminders: [60],
          tags: ['Équipe', 'Hebdomadaire'],
          createdBy: 'Yankel Bensimhon',
          isRecurring: true,
          recurringPattern: 'weekly'
        },
        {
          id: '5',
          title: 'Consultation - Nouveau Client',
          description: 'Premier RDV avec STARTUP TECH pour structuration juridique',
          startTime: '2025-02-05T15:00:00',
          endTime: '2025-02-05T16:00:00',
          type: 'rdv_client',
          location: 'Cabinet - Bureau principal',
          isVirtual: false,
          participants: [
            {
              id: '1',
              name: 'Yankel Bensimhon',
              email: 'y.bensimhon@cabinet.fr',
              role: 'avocat',
              confirmed: true
            },
            {
              id: '5',
              name: 'Marie Durand',
              email: 'marie.durand@startup.fr',
              role: 'client',
              confirmed: false
            }
          ],
          clientId: '4',
          status: 'programme',
          priority: 'haute',
          reminders: [1440, 60],
          notes: 'Nouveau prospect - Préparer présentation services cabinet',
          tags: ['Nouveau Client', 'Corporate'],
          createdBy: 'Yankel Bensimhon',
          isRecurring: false
        }
      ]

      setEvents(mockEvents)
      setFilteredEvents(mockEvents)
      setLoading(false)
    }, 1000)
  }, [session, status, router])

  // Filtrage et recherche
  useEffect(() => {
    let filtered = [...events]

    // Filtre par type
    if (filterType !== 'tous') {
      filtered = filtered.filter(event => event.type === filterType)
    }

    // Recherche
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredEvents(filtered)
  }, [events, filterType, searchTerm])

  const getEventTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'rdv_client': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'audience': return 'bg-red-100 text-red-800 border-red-200'
      case 'reunion': return 'bg-green-100 text-green-800 border-green-200'
      case 'formation': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'autre': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEventTypeText = (type: Event['type']) => {
    switch (type) {
      case 'rdv_client': return 'RDV Client'
      case 'audience': return 'Audience'
      case 'reunion': return 'Réunion'
      case 'formation': return 'Formation'
      case 'autre': return 'Autre'
      default: return type
    }
  }

  const getEventTypeIcon = (type: Event['type']) => {
    switch (type) {
      case 'rdv_client': return <User className="h-4 w-4" />
      case 'audience': return <Building2 className="h-4 w-4" />
      case 'reunion': return <Users className="h-4 w-4" />
      case 'formation': return <FileText className="h-4 w-4" />
      case 'autre': return <Calendar className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'programme': return 'bg-blue-100 text-blue-800'
      case 'confirme': return 'bg-green-100 text-green-800'
      case 'annule': return 'bg-red-100 text-red-800'
      case 'reporte': return 'bg-orange-100 text-orange-800'
      case 'termine': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: Event['status']) => {
    switch (status) {
      case 'programme': return 'Programmé'
      case 'confirme': return 'Confirmé'
      case 'annule': return 'Annulé'
      case 'reporte': return 'Reporté'
      case 'termine': return 'Terminé'
      default: return status
    }
  }

  const getPriorityColor = (priority: Event['priority']) => {
    switch (priority) {
      case 'urgente': return 'text-red-600'
      case 'haute': return 'text-orange-600'
      case 'normale': return 'text-blue-600'
      case 'basse': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getEventsForDay = (date: Date) => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.startTime)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const getUpcomingEvents = () => {
    const now = new Date()
    return filteredEvents
      .filter(event => new Date(event.startTime) >= now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 5)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l&apos;agenda...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Agenda & Planification</h1>
              <p className="text-gray-600 mt-1">
                Gestion des rendez-vous et calendrier professionnel
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Synchroniser
              </Button>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nouveau RDV
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation et vues */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Aujourd&apos;hui
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {(['month', 'week', 'day', 'list'] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode(mode)}
                >
                  {mode === 'month' && 'Mois'}
                  {mode === 'week' && 'Semaine'}
                  {mode === 'day' && 'Jour'}
                  {mode === 'list' && 'Liste'}
                </Button>
              ))}
            </div>
          </div>

          {/* Filtres et recherche */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Rechercher par titre, description, lieu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="tous">Tous les types</option>
                <option value="rdv_client">RDV Client</option>
                <option value="audience">Audience</option>
                <option value="reunion">Réunion</option>
                <option value="formation">Formation</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Vue principale */}
          <div className="lg:col-span-2">
            {viewMode === 'list' ? (
              // Vue liste
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Événements à venir ({filteredEvents.length})
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {filteredEvents
                    .filter(event => new Date(event.startTime) >= new Date())
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map((event) => (
                    <div key={event.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.type)}`}>
                              {getEventTypeIcon(event.type)}
                              {getEventTypeText(event.type)}
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(event.status)}`}>
                              {getStatusText(event.status)}
                            </span>
                            <span className={`text-sm font-medium ${getPriorityColor(event.priority)}`}>
                              {event.priority.charAt(0).toUpperCase() + event.priority.slice(1)}
                            </span>
                          </div>
                          
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">
                            {event.title}
                          </h4>
                          
                          {event.description && (
                            <p className="text-gray-600 text-sm mb-2">
                              {event.description}
                            </p>
                          )}

                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(event.startTime)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1">
                                {event.isVirtual ? (
                                  <Video className="h-4 w-4" />
                                ) : (
                                  <MapPin className="h-4 w-4" />
                                )}
                                <span>{event.location}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{event.participants.length} participant{event.participants.length > 1 ? 's' : ''}</span>
                            </div>
                          </div>

                          {event.notes && (
                            <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                              {event.notes}
                            </div>
                          )}

                          {event.tags.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {event.tags.map((tag, index) => (
                                <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="ghost" size="sm" title="Modifier">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" title="Plus d&apos;actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Autres vues (placeholder pour calendrier visuel) */
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Vue {viewMode} du calendrier
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Interface de calendrier visuel en cours de développement
                  </p>
                  <Button
                    onClick={() => setViewMode('list')}
                    variant="outline"
                  >
                    Passer en vue liste
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Prochains événements */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Prochains RDV</h3>
              <div className="space-y-3">
                {getUpcomingEvents().map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                      event.priority === 'urgente' ? 'bg-red-500' :
                      event.priority === 'haute' ? 'bg-orange-500' :
                      event.priority === 'normale' ? 'bg-blue-500' : 'bg-gray-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(event.startTime)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Statistiques rapides */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cette semaine</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">RDV Clients</span>
                  <span className="text-sm font-medium text-gray-900">
                    {filteredEvents.filter(e => e.type === 'rdv_client').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Audiences</span>
                  <span className="text-sm font-medium text-gray-900">
                    {filteredEvents.filter(e => e.type === 'audience').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Réunions</span>
                  <span className="text-sm font-medium text-gray-900">
                    {filteredEvents.filter(e => e.type === 'reunion').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total événements</span>
                  <span className="text-sm font-medium text-gray-900">
                    {filteredEvents.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau RDV
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Bloquer créneaux
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Video className="h-4 w-4 mr-2" />
                  Créer visio
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone,
  Building2,
  MapPin,
  User,
  FileText,
  Calendar,
  Euro,
  Star,
  MoreHorizontal,
  Plus
} from 'lucide-react'

interface ClientDetail {
  id: string
  type: 'particulier' | 'entreprise'
  name: string
  company?: string
  email: string
  phone?: string
  address?: string
  status: string
  priority: string
  createdAt: string
  totalCases: number
  activeCases: number
  totalRevenue: number
}

export default function ClientDetail() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [clientDetail, setClientDetail] = useState<ClientDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Simulation de données pour la démonstration
    setTimeout(() => {
      setClientDetail({
        id: params.id as string,
        type: 'entreprise',
        name: 'Martin Dubois',
        company: 'TECHNO SAS',
        email: 'martin.dubois@techno.fr',
        phone: '01 23 45 67 89',
        address: '123 Rue de la Technologie, 75001 Paris',
        status: 'actif',
        priority: 'haute',
        createdAt: '2024-01-15',
        totalCases: 3,
        activeCases: 1,
        totalRevenue: 45000
      })
      setLoading(false)
    }, 1000)
  }, [session, router, params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil client...</p>
        </div>
      </div>
    )
  }

  if (!clientDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Client non trouvé</h3>
          <p className="text-gray-500 mb-4">Le client demandé n'existe pas ou vous n'y avez pas accès.</p>
          <Button onClick={() => router.push('/backoffice/clients')}>
            Retour aux clients
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'actif': return 'bg-green-100 text-green-800'
      case 'inactif': return 'bg-gray-100 text-gray-800'
      case 'prospect': return 'bg-blue-100 text-blue-800'
      case 'ancien': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'vip': return 'text-purple-600'
      case 'haute': return 'text-orange-600'
      case 'normale': return 'text-blue-600'
      case 'basse': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              onClick={() => router.push('/backoffice/clients')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux clients
            </Button>
            <div className="flex items-center gap-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(clientDetail.status)}`}>
                {clientDetail.status}
              </span>
              <span className={`text-sm font-medium flex items-center gap-1 ${getPriorityColor(clientDetail.priority)}`}>
                {clientDetail.priority === 'vip' && <Star className="h-4 w-4" />}
                Priorité {clientDetail.priority}
              </span>
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {clientDetail.name}
              </h1>
              {clientDetail.company && (
                <p className="text-gray-600 text-lg mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {clientDetail.company}
                </p>
              )}
              <div className="flex items-center gap-4 text-gray-600">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {clientDetail.email}
                </span>
                {clientDetail.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {clientDetail.phone}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => router.push(`/backoffice/clients/${clientDetail.id}/modifier`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button 
                onClick={() => router.push(`/backoffice/dossiers/nouveau?clientId=${clientDetail.id}`)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau dossier
              </Button>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dossiers Total</p>
                <p className="text-2xl font-bold text-gray-900">{clientDetail.totalCases}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dossiers Actifs</p>
                <p className="text-2xl font-bold text-gray-900">{clientDetail.activeCases}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CA Total</p>
                <p className="text-2xl font-bold text-gray-900">{clientDetail.totalRevenue.toLocaleString()}€</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <Euro className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Client Information */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Informations client</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {clientDetail.type}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Client depuis</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(clientDetail.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {clientDetail.address && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Adresse</label>
                    <p className="text-lg font-semibold text-gray-900 flex items-start gap-2">
                      <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      {clientDetail.address}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Cases */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Dossiers récents</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/backoffice/dossiers?client=' + clientDetail.id)}
                >
                  Voir tous
                </Button>
              </div>
              
              <div className="space-y-4">
                {/* Sample case items */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Recouvrement facture impayée</h4>
                      <p className="text-sm text-gray-600 mt-1">DOS-2025-001 • Créé le 15/01/2025</p>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mt-2">
                        En cours
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">15 000€</p>
                      <Button size="sm" variant="outline" className="mt-2">
                        <FileText className="h-4 w-4 mr-1" />
                        Voir
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="text-center py-4 text-gray-500">
                  <p>+ {clientDetail.totalCases - 1} autres dossiers</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Actions & Contact */}
          <div className="space-y-6">
            
            {/* Contact Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start"
                  onClick={() => window.open(`mailto:${clientDetail.email}`, '_blank')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer un email
                </Button>
                {clientDetail.phone && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open(`tel:${clientDetail.phone}`, '_self')}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Appeler
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/backoffice/agenda')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Planifier RDV
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push(`/backoffice/dossiers/nouveau?clientId=${clientDetail.id}`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un dossier
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/backoffice/facturation/nouvelle')}
                >
                  <Euro className="h-4 w-4 mr-2" />
                  Créer une facture
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => alert('Export des données client à venir')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Exporter données
                </Button>
              </div>
            </div>

            {/* Client Notes */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">Aucune note pour ce client</p>
                <Button size="sm" variant="outline" className="mt-2">
                  Ajouter une note
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

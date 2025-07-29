'use client'

import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Edit, 
  Archive, 
  Download, 
  Mail, 
  Phone,
  FileText,
  User,
  Building2,
  Calendar,
  Euro,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreHorizontal
} from 'lucide-react'

interface CaseDetail {
  id: string
  reference: string
  title: string
  description: string
  status: string
  priority: string
  client: {
    name: string
    company?: string
    email: string
    phone?: string
  }
  counterparty?: {
    name: string
    company?: string
  }
  amount: number
  currency: string
  createdAt: string
  dueDate?: string
  assignedTo: string
}

export default function CaseDetail() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Simulation de données pour la démonstration
    setTimeout(() => {
      setCaseDetail({
        id: params.id as string,
        reference: `DOS-2025-${params.id}`,
        title: 'Dossier de recouvrement - Facture impayée',
        description: 'Recouvrement amiable puis judiciaire d\'une créance commerciale suite à une prestation de service non réglée.',
        status: 'en_cours',
        priority: 'haute',
        client: {
          name: 'Martin Dubois',
          company: 'TECHNO SAS',
          email: 'martin.dubois@techno.fr',
          phone: '01 23 45 67 89'
        },
        counterparty: {
          name: 'Société Débitrice',
          company: 'SUPPLIER CORP SARL'
        },
        amount: 15000,
        currency: 'EUR',
        createdAt: '2025-01-15',
        dueDate: '2025-02-15',
        assignedTo: 'Maître Bensimhon'
      })
      setLoading(false)
    }, 1000)
  }, [session, router, params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du dossier...</p>
        </div>
      </div>
    )
  }

  if (!caseDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Dossier non trouvé</h3>
          <p className="text-gray-500 mb-4">Le dossier demandé n&apos;existe pas ou vous n&apos;y avez pas accès.</p>
          <Button onClick={() => router.push('/backoffice/dossiers')}>
            Retour aux dossiers
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ouvert': return 'bg-green-100 text-green-800'
      case 'en_cours': return 'bg-blue-100 text-blue-800'
      case 'en_attente': return 'bg-yellow-100 text-yellow-800'
      case 'suspendu': return 'bg-orange-100 text-orange-800'
      case 'termine': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'text-red-600'
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
              onClick={() => router.push('/backoffice/dossiers')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux dossiers
            </Button>
            <div className="flex items-center gap-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(caseDetail.status)}`}>
                {caseDetail.status.replace('_', ' ')}
              </span>
              <span className={`text-sm font-medium ${getPriorityColor(caseDetail.priority)}`}>
                Priorité {caseDetail.priority}
              </span>
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {caseDetail.title}
              </h1>
              <p className="text-gray-600 text-lg mb-4">
                Référence: {caseDetail.reference}
              </p>
              <p className="text-gray-700 max-w-3xl">
                {caseDetail.description}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => router.push(`/backoffice/dossiers/${caseDetail.id}/modifier`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button variant="outline">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Case Information */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Informations du dossier</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Montant</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {caseDetail.amount.toLocaleString()} {caseDetail.currency}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Échéance</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {caseDetail.dueDate ? new Date(caseDetail.dueDate).toLocaleDateString('fr-FR') : 'Non définie'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Créé le</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(caseDetail.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigné à</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {caseDetail.assignedTo}
                  </p>
                </div>
              </div>
            </div>

            {/* Parties */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Parties impliquées</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client */}
                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-green-900">Client</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900">{caseDetail.client.name}</p>
                    {caseDetail.client.company && (
                      <p className="text-gray-600 flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {caseDetail.client.company}
                      </p>
                    )}
                    <p className="text-gray-600 flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {caseDetail.client.email}
                    </p>
                    {caseDetail.client.phone && (
                      <p className="text-gray-600 flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {caseDetail.client.phone}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(`mailto:${caseDetail.client.email}`, '_blank')}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </Button>
                    {caseDetail.client.phone && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(`tel:${caseDetail.client.phone}`, '_self')}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Appeler
                      </Button>
                    )}
                  </div>
                </div>

                {/* Counterparty */}
                {caseDetail.counterparty && (
                  <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <h4 className="font-medium text-red-900">Partie adverse</h4>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-900">{caseDetail.counterparty.name}</p>
                      {caseDetail.counterparty.company && (
                        <p className="text-gray-600 flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {caseDetail.counterparty.company}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline placeholder */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Chronologie</h3>
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2" />
                <p>Chronologie du dossier à venir</p>
              </div>
            </div>
          </div>

          {/* Right Column - Actions & Status */}
          <div className="space-y-6">
            
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
              <div className="space-y-3">
                <Button className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Générer mise en demeure
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Planifier action
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer courrier
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Archive className="h-4 w-4 mr-2" />
                  Archiver dossier
                </Button>
              </div>
            </div>

            {/* Progress */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progression</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Dossier créé</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Premier contact</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="text-sm">En cours de traitement</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-400">Résolution</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Euro,
  FileText,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Download,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  User,
  Building2,
  Receipt,
  CreditCard,
  DollarSign,
  BarChart3
} from 'lucide-react'

interface Invoice {
  id: string
  number: string
  clientId: string
  client: {
    name: string
    company?: string
    email: string
  }
  caseId?: string
  caseTitle?: string
  amount: number
  currency: string
  taxAmount: number
  totalAmount: number
  status: 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | 'annulee'
  createdAt: string
  dueDate: string
  paidAt?: string
  description: string
  items: InvoiceItem[]
  paymentTerms: number // jours
  notes?: string
  tags: string[]
}

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  taxRate: number
}

interface FinancialStats {
  totalRevenue: number
  monthlyRevenue: number
  pendingInvoices: number
  overdueInvoices: number
  paidInvoices: number
  averagePaymentDelay: number
  conversionRate: number
  monthlyGrowth: number
}

export default function FinancialManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [financialStats, setFinancialStats] = useState<FinancialStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    paidInvoices: 0,
    averagePaymentDelay: 0,
    conversionRate: 0,
    monthlyGrowth: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('tous')
  const [sortBy, setSortBy] = useState('recent')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Simulation de données pour la démonstration
    setTimeout(() => {
      const mockInvoices: Invoice[] = [
        {
          id: '1',
          number: 'FACT-2025-001',
          clientId: '1',
          client: {
            name: 'Martin Dubois',
            company: 'TECHNO SAS',
            email: 'martin.dubois@techno.fr'
          },
          caseId: '1',
          caseTitle: 'Rupture de contrat commercial',
          amount: 15000,
          currency: 'EUR',
          taxAmount: 3000,
          totalAmount: 18000,
          status: 'envoyee',
          createdAt: '2025-01-15',
          dueDate: '2025-02-14',
          description: 'Honoraires contentieux - Rupture contrat commercial',
          items: [
            {
              id: '1',
              description: 'Consultation initiale et analyse du dossier',
              quantity: 4,
              unitPrice: 350,
              total: 1400,
              taxRate: 20
            },
            {
              id: '2',
              description: 'Rédaction assignation et constitution de dossier',
              quantity: 12,
              unitPrice: 400,
              total: 4800,
              taxRate: 20
            },
            {
              id: '3',
              description: 'Suivi procédure et plaidoirie',
              quantity: 22,
              unitPrice: 400,
              total: 8800,
              taxRate: 20
            }
          ],
          paymentTerms: 30,
          notes: 'Facturation selon convention d\'honoraires signée le 10/01/2025',
          tags: ['Contentieux', 'Commercial']
        },
        {
          id: '2',
          number: 'FACT-2025-002',
          clientId: '2',
          client: {
            name: 'Sophie Laurent',
            company: 'INNOV SA',
            email: 'sophie.laurent@innov.fr'
          },
          caseId: '2',
          caseTitle: 'Conseil juridique M&A',
          amount: 8500,
          currency: 'EUR',
          taxAmount: 1700,
          totalAmount: 10200,
          status: 'payee',
          createdAt: '2025-01-20',
          dueDate: '2025-02-19',
          paidAt: '2025-02-15',
          description: 'Conseil juridique - Due diligence acquisition',
          items: [
            {
              id: '1',
              description: 'Due diligence juridique',
              quantity: 15,
              unitPrice: 450,
              total: 6750,
              taxRate: 20
            },
            {
              id: '2',
              description: 'Rédaction protocole d\'accord',
              quantity: 4,
              unitPrice: 400,
              total: 1600,
              taxRate: 20
            },
            {
              id: '3',
              description: 'Négociation et finalisation',
              quantity: 1,
              unitPrice: 150,
              total: 150,
              taxRate: 20
            }
          ],
          paymentTerms: 30,
          tags: ['M&A', 'Corporate']
        },
        {
          id: '3',
          number: 'FACT-2025-003',
          clientId: '3',
          client: {
            name: 'Pierre Moreau',
            company: 'DIGITAL SOLUTIONS',
            email: 'pierre.moreau@digital.fr'
          },
          caseId: '3',
          caseTitle: 'Recouvrement de créances',
          amount: 3500,
          currency: 'EUR',
          taxAmount: 700,
          totalAmount: 4200,
          status: 'en_retard',
          createdAt: '2024-12-15',
          dueDate: '2025-01-14',
          description: 'Recouvrement amiable et judiciaire',
          items: [
            {
              id: '1',
              description: 'Mise en demeure et négociation amiable',
              quantity: 3,
              unitPrice: 300,
              total: 900,
              taxRate: 20
            },
            {
              id: '2',
              description: 'Procédure de recouvrement judiciaire',
              quantity: 6,
              unitPrice: 350,
              total: 2100,
              taxRate: 20
            },
            {
              id: '3',
              description: 'Suivi et exécution',
              quantity: 2,
              unitPrice: 250,
              total: 500,
              taxRate: 20
            }
          ],
          paymentTerms: 30,
          notes: 'Relance client nécessaire - retard de paiement',
          tags: ['Recouvrement', 'Urgent']
        },
        {
          id: '4',
          number: 'FACT-2025-004',
          clientId: '4',
          client: {
            name: 'Marie Durand',
            company: 'STARTUP TECH',
            email: 'marie.durand@startup.fr'
          },
          amount: 2100,
          currency: 'EUR',
          taxAmount: 420,
          totalAmount: 2520,
          status: 'brouillon',
          createdAt: '2025-01-28',
          dueDate: '2025-02-27',
          description: 'Conseil en droit social',
          items: [
            {
              id: '1',
              description: 'Consultation droit du travail',
              quantity: 2,
              unitPrice: 350,
              total: 700,
              taxRate: 20
            },
            {
              id: '2',
              description: 'Rédaction contrats de travail',
              quantity: 4,
              unitPrice: 250,
              total: 1000,
              taxRate: 20
            },
            {
              id: '3',
              description: 'Rédaction règlement intérieur',
              quantity: 1,
              unitPrice: 400,
              total: 400,
              taxRate: 20
            }
          ],
          paymentTerms: 30,
          tags: ['Social', 'Conseil']
        }
      ]

      setInvoices(mockInvoices)
      setFilteredInvoices(mockInvoices)

      // Calcul des statistiques
      const totalRevenue = mockInvoices
        .filter(inv => inv.status === 'payee')
        .reduce((sum, inv) => sum + inv.totalAmount, 0)
      
      const pendingAmount = mockInvoices
        .filter(inv => inv.status === 'envoyee')
        .reduce((sum, inv) => sum + inv.totalAmount, 0)
      
      const overdueCount = mockInvoices.filter(inv => inv.status === 'en_retard').length
      const paidCount = mockInvoices.filter(inv => inv.status === 'payee').length

      setFinancialStats({
        totalRevenue,
        monthlyRevenue: totalRevenue * 0.8, // Simulation
        pendingInvoices: pendingAmount,
        overdueInvoices: overdueCount,
        paidInvoices: paidCount,
        averagePaymentDelay: 25,
        conversionRate: 85.5,
        monthlyGrowth: 12.3
      })

      setLoading(false)
    }, 1000)
  }, [session, status, router])

  // Filtrage et recherche
  useEffect(() => {
    let filtered = [...invoices]

    // Filtre par statut
    if (filterStatus !== 'tous') {
      filtered = filtered.filter(inv => inv.status === filterStatus)
    }

    // Recherche
    if (searchTerm) {
      filtered = filtered.filter(inv => 
        inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.caseTitle?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'amount':
          return b.totalAmount - a.totalAmount
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case 'alphabetical':
          return a.client.name.localeCompare(b.client.name)
        default:
          return 0
      }
    })

    setFilteredInvoices(filtered)
  }, [invoices, filterStatus, searchTerm, sortBy])

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'brouillon': return 'bg-gray-100 text-gray-800'
      case 'envoyee': return 'bg-blue-100 text-blue-800'
      case 'payee': return 'bg-green-100 text-green-800'
      case 'en_retard': return 'bg-red-100 text-red-800'
      case 'annulee': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: Invoice['status']) => {
    switch (status) {
      case 'brouillon': return 'Brouillon'
      case 'envoyee': return 'Envoyée'
      case 'payee': return 'Payée'
      case 'en_retard': return 'En retard'
      case 'annulee': return 'Annulée'
      default: return status
    }
  }

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'brouillon': return <Edit className="h-4 w-4" />
      case 'envoyee': return <Send className="h-4 w-4" />
      case 'payee': return <CheckCircle className="h-4 w-4" />
      case 'en_retard': return <AlertCircle className="h-4 w-4" />
      case 'annulee': return <AlertCircle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données financières...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Gestion Financière & Facturation</h1>
              <p className="text-gray-600 mt-1">
                {filteredInvoices.length} facture{filteredInvoices.length > 1 ? 's' : ''} 
                {searchTerm && ` correspondant à "${searchTerm}"`}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exporter
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Rapports
              </Button>
              <Link href="/backoffice/facturation/nouvelle">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nouvelle facture
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Statistiques financières */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CA Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {financialStats.totalRevenue.toLocaleString()}€
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +{financialStats.monthlyGrowth}% ce mois
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Euro className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-gray-900">
                  {financialStats.pendingInvoices.toLocaleString()}€
                </p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  {financialStats.averagePaymentDelay} jours moy.
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En retard</p>
                <p className="text-2xl font-bold text-gray-900">
                  {financialStats.overdueInvoices}
                </p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Action requise
                </p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux conversion</p>
                <p className="text-2xl font-bold text-gray-900">
                  {financialStats.conversionRate}%
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {financialStats.paidInvoices} payées
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
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
                  placeholder="Rechercher par numéro, client, description..."
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
                <option value="brouillon">Brouillon</option>
                <option value="envoyee">Envoyée</option>
                <option value="payee">Payée</option>
                <option value="en_retard">En retard</option>
                <option value="annulee">Annulée</option>
              </select>
            </div>

            {/* Tri */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="recent">Plus récent</option>
                <option value="amount">Montant</option>
                <option value="dueDate">Échéance</option>
                <option value="alphabetical">Client</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des factures */}
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                
                {/* Informations principales */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(invoice.status)}
                      <span className="font-medium text-gray-900">{invoice.number}</span>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                      {getStatusText(invoice.status)}
                    </span>
                    {invoice.status === 'en_retard' && (
                      <span className="text-xs text-red-600 font-medium">
                        Retard: {Math.ceil((Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))} jours
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {invoice.client.company || invoice.client.name}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3">
                    {invoice.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    
                    {/* Client */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {invoice.client.company ? (
                          <Building2 className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                        <span>{invoice.client.name}</span>
                      </div>
                      {invoice.caseTitle && (
                        <div className="text-sm text-gray-500">
                          Dossier: {invoice.caseTitle}
                        </div>
                      )}
                    </div>

                    {/* Montants */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Euro className="h-4 w-4" />
                        <span>HT: {invoice.amount.toLocaleString()}€</span>
                      </div>
                      <div className="text-sm text-gray-900 font-medium">
                        TTC: {invoice.totalAmount.toLocaleString()}€
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Créée: {new Date(invoice.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Échéance: {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                      </div>
                      {invoice.paidAt && (
                        <div className="text-sm text-green-600">
                          Payée: {new Date(invoice.paidAt).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </div>

                    {/* Détails */}
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">
                        {invoice.items.length} ligne{invoice.items.length > 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-gray-600">
                        Délai: {invoice.paymentTerms} jours
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {invoice.tags.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {invoice.tags.map((tag, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {invoice.notes && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">{invoice.notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="sm" title="Voir la facture">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Modifier">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Télécharger PDF">
                    <Download className="h-4 w-4" />
                  </Button>
                  {invoice.status === 'brouillon' && (
                    <Button variant="ghost" size="sm" title="Envoyer">
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" title="Plus d&apos;actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message si aucun résultat */}
        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune facture trouvée</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterStatus !== 'tous' 
                ? 'Aucune facture ne correspond à vos critères de recherche.'
                : 'Commencez par créer votre première facture.'
              }
            </p>
            <Link href="/backoffice/facturation/nouvelle">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Créer une facture
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

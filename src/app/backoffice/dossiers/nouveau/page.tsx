'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { 
  ArrowLeft,
  Save,
  User,
  Building2,
  FileText,
  Euro,
  Calendar,
  AlertTriangle,
  Plus,
  X,
  Search,
  Upload,
  Scale,
  Briefcase
} from 'lucide-react'

interface Client {
  id: string
  name: string
  company?: string
  email: string
  phone?: string
}

interface CaseFormData {
  title: string
  type: 'contentieux' | 'conseil' | 'recouvrement' | 'corporate' | 'ma' | ''
  clientId: string
  counterpartyName: string
  counterpartyCompany: string
  counterpartyEmail: string
  counterpartyPhone: string
  counterpartyAddress: string
  amount: string
  currency: string
  priority: 'basse' | 'normale' | 'haute' | 'urgente'
  description: string
  dueDate: string
  invoiceNumber: string
  tags: string[]
  documents: File[]
}

export default function NewCase() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showClientSearch, setShowClientSearch] = useState(false)
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [newTag, setNewTag] = useState('')
  
  const [formData, setFormData] = useState<CaseFormData>({
    title: '',
    type: '',
    clientId: '',
    counterpartyName: '',
    counterpartyCompany: '',
    counterpartyEmail: '',
    counterpartyPhone: '',
    counterpartyAddress: '',
    amount: '',
    currency: 'EUR',
    priority: 'normale',
    description: '',
    dueDate: '',
    invoiceNumber: '',
    tags: [],
    documents: []
  })

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Clients fictifs pour la démonstration
  const mockClients: Client[] = [
    {
      id: '1',
      name: 'Martin Dubois',
      company: 'TECHNO SAS',
      email: 'martin.dubois@techno.fr',
      phone: '01 23 45 67 89'
    },
    {
      id: '2',
      name: 'Sophie Laurent',
      company: 'INNOV SA',
      email: 'sophie.laurent@innov.fr',
      phone: '01 34 56 78 90'
    },
    {
      id: '3',
      name: 'Pierre Moreau',
      company: 'DIGITAL SOLUTIONS',
      email: 'pierre.moreau@digital.fr'
    },
    {
      id: '4',
      name: 'Marie Durand',
      company: 'STARTUP TECH',
      email: 'marie.durand@startup.fr',
      phone: '01 45 67 89 01'
    },
    {
      id: '5',
      name: 'Jean-Paul Sartre',
      email: 'jp.sartre@email.fr',
      phone: '01 56 78 90 12'
    }
  ]

  const filteredClients = mockClients.filter(client =>
    client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    client.company?.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(clientSearchTerm.toLowerCase())
  )

  const handleInputChange = (field: keyof CaseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setFormData(prev => ({ ...prev, clientId: client.id }))
    setShowClientSearch(false)
    setClientSearchTerm('')
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...Array.from(files)]
      }))
    }
  }

  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est obligatoire'
    }

    if (!formData.type) {
      newErrors.type = 'Le type de dossier est obligatoire'
    }

    if (!formData.clientId) {
      newErrors.client = 'La sélection d&apos;un client est obligatoire'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est obligatoire'
    }

    if (formData.amount && isNaN(Number(formData.amount))) {
      newErrors.amount = 'Le montant doit être un nombre valide'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Préparer les données pour l'API
      const caseData = {
        title: formData.title,
        description: formData.description,
        debtorName: formData.counterpartyName,
        debtorEmail: formData.counterpartyEmail || '',
        debtorPhone: formData.counterpartyPhone || '',
        debtorAddress: formData.counterpartyAddress || '',
        amount: formData.amount ? Number(formData.amount) : 0,
        currency: formData.currency,
        invoiceNumber: formData.invoiceNumber || '',
        dueDate: formData.dueDate || null
      }

      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(caseData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création du dossier')
      }

      const newCase = await response.json()
      console.log('Dossier créé avec succès:', newCase)

      // Redirection vers la liste des dossiers
      router.push('/backoffice/dossiers')
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error)
      setErrors({ general: error instanceof Error ? error.message : 'Une erreur est survenue lors de la création du dossier' })
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    router.push('/auth/signin')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/backoffice/dossiers">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour aux dossiers
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Nouveau Dossier</h1>
          <p className="text-gray-600 mt-1">Créez un nouveau dossier juridique</p>
        </div>

        {/* Affichage des erreurs générales */}
        {errors.general && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{errors.general}</p>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Informations générales */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informations générales
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Titre */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du dossier *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Ex: Contentieux commercial ABC vs XYZ"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              {/* Type de dossier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de dossier *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.type ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionnez un type</option>
                  <option value="contentieux">Contentieux</option>
                  <option value="conseil">Conseil juridique</option>
                  <option value="recouvrement">Recouvrement</option>
                  <option value="corporate">Droit des sociétés</option>
                  <option value="ma">Fusions & Acquisitions</option>
                </select>
                {errors.type && (
                  <p className="text-red-500 text-sm mt-1">{errors.type}</p>
                )}
              </div>

              {/* Priorité */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorité
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="basse">Basse</option>
                  <option value="normale">Normale</option>
                  <option value="haute">Haute</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              {/* Date d'échéance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date d&apos;échéance
                </label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Décrivez le contexte et les enjeux du dossier..."
                  rows={4}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Client */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <User className="h-5 w-5" />
              Client
            </h2>

            {selectedClient ? (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{selectedClient.name}</p>
                  {selectedClient.company && (
                    <p className="text-sm text-gray-600">{selectedClient.company}</p>
                  )}
                  <p className="text-sm text-gray-500">{selectedClient.email}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedClient(null)
                    setFormData(prev => ({ ...prev, clientId: '' }))
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2 mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowClientSearch(!showClientSearch)}
                    className="flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Rechercher un client
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nouveau client
                  </Button>
                </div>

                {showClientSearch && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <Input
                      placeholder="Rechercher par nom, entreprise ou email..."
                      value={clientSearchTerm}
                      onChange={(e) => setClientSearchTerm(e.target.value)}
                      className="mb-3"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {filteredClients.map(client => (
                        <div
                          key={client.id}
                          onClick={() => handleClientSelect(client)}
                          className="p-3 rounded border hover:bg-gray-50 cursor-pointer"
                        >
                          <p className="font-medium">{client.name}</p>
                          {client.company && (
                            <p className="text-sm text-gray-600">{client.company}</p>
                          )}
                          <p className="text-sm text-gray-500">{client.email}</p>
                        </div>
                      ))}
                      {filteredClients.length === 0 && clientSearchTerm && (
                        <p className="text-gray-500 text-center py-4">
                          Aucun client trouvé
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {errors.client && (
                  <p className="text-red-500 text-sm mt-2">{errors.client}</p>
                )}
              </div>
            )}
          </div>

          {/* Partie adverse */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Partie adverse (optionnel)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la partie adverse
                </label>
                <Input
                  value={formData.counterpartyName}
                  onChange={(e) => handleInputChange('counterpartyName', e.target.value)}
                  placeholder="Nom de la personne"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entreprise
                </label>
                <Input
                  value={formData.counterpartyCompany}
                  onChange={(e) => handleInputChange('counterpartyCompany', e.target.value)}
                  placeholder="Nom de l&apos;entreprise"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.counterpartyEmail}
                  onChange={(e) => handleInputChange('counterpartyEmail', e.target.value)}
                  placeholder="email@exemple.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <Input
                  type="tel"
                  value={formData.counterpartyPhone}
                  onChange={(e) => handleInputChange('counterpartyPhone', e.target.value)}
                  placeholder="01 23 45 67 89"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse
                </label>
                <Textarea
                  value={formData.counterpartyAddress}
                  onChange={(e) => handleInputChange('counterpartyAddress', e.target.value)}
                  placeholder="Adresse complète de la partie adverse"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Montant */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Montant en jeu (optionnel)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant
                </label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0"
                  className={errors.amount ? 'border-red-500' : ''}
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Devise
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - Dollar américain</option>
                  <option value="GBP">GBP - Livre sterling</option>
                  <option value="CHF">CHF - Franc suisse</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de facture
                </label>
                <Input
                  value={formData.invoiceNumber}
                  onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                  placeholder="FAC-2024-001"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Tags et catégories
            </h2>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Ajouter un tag..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Documents initiaux
            </h2>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-600 mb-2">
                  Glissez-déposez des fichiers ici ou
                </p>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" className="pointer-events-none">
                    <span>Parcourir les fichiers</span>
                  </Button>
                </label>
              </div>

              {formData.documents.length > 0 && (
                <div className="space-y-2">
                  {formData.documents.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Erreur générale */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-red-700">{errors.general}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <Link href="/backoffice/dossiers">
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </Link>
            
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Création en cours...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Créer le dossier
                </>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}

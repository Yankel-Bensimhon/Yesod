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
  Mail,
  Phone,
  MapPin,
  Globe,
  AlertTriangle,
  Plus,
  X,
  FileText,
  Euro,
  Calendar,
  Star
} from 'lucide-react'

interface ClientFormData {
  type: 'particulier' | 'entreprise' | ''
  // Particulier
  firstName: string
  lastName: string
  // Entreprise
  company: string
  siret: string
  industry: string
  website: string
  // Commun
  email: string
  phone: string
  address: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  status: 'actif' | 'inactif' | 'prospect'
  priority: 'basse' | 'normale' | 'haute' | 'vip'
  source: 'referral' | 'website' | 'networking' | 'advertising' | 'other'
  notes: string
  tags: string[]
  assignedTo: string
  nextFollowUp: {
    date: string
    type: string
    description: string
  }
}

export default function NewClient() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [newTag, setNewTag] = useState('')
  
  const [formData, setFormData] = useState<ClientFormData>({
    type: '',
    firstName: '',
    lastName: '',
    company: '',
    siret: '',
    industry: '',
    website: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
      country: 'France'
    },
    status: 'prospect',
    priority: 'normale',
    source: 'other',
    notes: '',
    tags: [],
    assignedTo: '',
    nextFollowUp: {
      date: '',
      type: '',
      description: ''
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }))
    } else if (field.startsWith('nextFollowUp.')) {
      const followUpField = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        nextFollowUp: { ...prev.nextFollowUp, [followUpField]: value }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }

    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.type) {
      newErrors.type = 'Le type de client est obligatoire'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L&apos;email est obligatoire'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'L&apos;email n&apos;est pas valide'
    }

    if (formData.type === 'particulier') {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'Le prénom est obligatoire'
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Le nom est obligatoire'
      }
    }

    if (formData.type === 'entreprise') {
      if (!formData.company.trim()) {
        newErrors.company = 'Le nom de l&apos;entreprise est obligatoire'
      }
      if (formData.siret && !/^\d{14}$/.test(formData.siret.replace(/\s/g, ''))) {
        newErrors.siret = 'Le SIRET doit contenir 14 chiffres'
      }
      if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
        newErrors.website = 'L&apos;URL du site web n&apos;est pas valide'
      }
    }

    if (formData.phone && !/^[\d\s\-\+\(\)\.]+$/.test(formData.phone)) {
      newErrors.phone = 'Le numéro de téléphone n&apos;est pas valide'
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
      // Ici, on enverrait les données au backend
      console.log('Données du nouveau client:', formData)

      // Simulation d'envoi
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Redirection vers la liste des clients
      router.push('/backoffice/clients')
    } catch (error) {
      console.error('Erreur lors de la création du client:', error)
      setErrors({ general: 'Une erreur est survenue lors de la création du client' })
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
            <Link href="/backoffice/clients">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour aux clients
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Nouveau Client</h1>
          <p className="text-gray-600 mt-1">Ajoutez un nouveau client à votre portefeuille</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Type de client */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Type de client</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                onClick={() => handleInputChange('type', 'particulier')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.type === 'particulier' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <User className={`h-6 w-6 ${formData.type === 'particulier' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <h3 className="font-medium text-gray-900">Particulier</h3>
                    <p className="text-sm text-gray-500">Personne physique</p>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => handleInputChange('type', 'entreprise')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.type === 'entreprise' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Building2 className={`h-6 w-6 ${formData.type === 'entreprise' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <h3 className="font-medium text-gray-900">Entreprise</h3>
                    <p className="text-sm text-gray-500">Personne morale</p>
                  </div>
                </div>
              </div>
            </div>

            {errors.type && (
              <p className="text-red-500 text-sm mt-2">{errors.type}</p>
            )}
          </div>

          {/* Informations de base */}
          {formData.type && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                {formData.type === 'particulier' ? <User className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                Informations {formData.type === 'particulier' ? 'personnelles' : 'de l&apos;entreprise'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {formData.type === 'particulier' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prénom *
                      </label>
                      <Input
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="Jean"
                        className={errors.firstName ? 'border-red-500' : ''}
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom *
                      </label>
                      <Input
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Dupont"
                        className={errors.lastName ? 'border-red-500' : ''}
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom de l&apos;entreprise *
                      </label>
                      <Input
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        placeholder="ENTREPRISE SARL"
                        className={errors.company ? 'border-red-500' : ''}
                      />
                      {errors.company && (
                        <p className="text-red-500 text-sm mt-1">{errors.company}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SIRET
                      </label>
                      <Input
                        value={formData.siret}
                        onChange={(e) => handleInputChange('siret', e.target.value)}
                        placeholder="12345678901234"
                        className={errors.siret ? 'border-red-500' : ''}
                      />
                      {errors.siret && (
                        <p className="text-red-500 text-sm mt-1">{errors.siret}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secteur d&apos;activité
                      </label>
                      <Input
                        value={formData.industry}
                        onChange={(e) => handleInputChange('industry', e.target.value)}
                        placeholder="Technologie"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Site web
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          <Globe className="h-4 w-4" />
                        </span>
                        <Input
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          placeholder="https://www.exemple.fr"
                          className={`rounded-l-none ${errors.website ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {errors.website && (
                        <p className="text-red-500 text-sm mt-1">{errors.website}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Coordonnées */}
          {formData.type && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Coordonnées
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      <Mail className="h-4 w-4" />
                    </span>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="contact@exemple.fr"
                      className={`rounded-l-none ${errors.email ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      <Phone className="h-4 w-4" />
                    </span>
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="01 23 45 67 89"
                      className={`rounded-l-none ${errors.phone ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Adresse */}
          {formData.type && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Adresse
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <Input
                    value={formData.address.street}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                    placeholder="123 rue de la Paix"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville
                  </label>
                  <Input
                    value={formData.address.city}
                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                    placeholder="Paris"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code postal
                  </label>
                  <Input
                    value={formData.address.postalCode}
                    onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                    placeholder="75001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pays
                  </label>
                  <select
                    value={formData.address.country}
                    onChange={(e) => handleInputChange('address.country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="France">France</option>
                    <option value="Belgique">Belgique</option>
                    <option value="Suisse">Suisse</option>
                    <option value="Luxembourg">Luxembourg</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Paramètres du compte */}
          {formData.type && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Paramètres du compte
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="prospect">Prospect</option>
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                  </select>
                </div>

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
                    <option value="vip">VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="referral">Recommandation</option>
                    <option value="website">Site web</option>
                    <option value="networking">Réseau</option>
                    <option value="advertising">Publicité</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigné à
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => handleInputChange('assignedTo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner un avocat</option>
                    <option value="Yankel Bensimhon">Yankel Bensimhon</option>
                    <option value="Associé 1">Associé 1</option>
                    <option value="Associé 2">Associé 2</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Prochaine action */}
          {formData.type && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Prochaine action (optionnel)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <Input
                    type="date"
                    value={formData.nextFollowUp.date}
                    onChange={(e) => handleInputChange('nextFollowUp.date', e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type d&apos;action
                  </label>
                  <select
                    value={formData.nextFollowUp.type}
                    onChange={(e) => handleInputChange('nextFollowUp.type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner</option>
                    <option value="Appel téléphonique">Appel téléphonique</option>
                    <option value="Rendez-vous">Rendez-vous</option>
                    <option value="Email de suivi">Email de suivi</option>
                    <option value="Rendez-vous commercial">Rendez-vous commercial</option>
                    <option value="Point d&apos;avancement">Point d&apos;avancement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <Input
                    value={formData.nextFollowUp.description}
                    onChange={(e) => handleInputChange('nextFollowUp.description', e.target.value)}
                    placeholder="Description de l&apos;action..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes et tags */}
          {formData.type && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Notes et tags
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Informations complémentaires sur le client..."
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-3">
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
            </div>
          )}

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
          {formData.type && (
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <Link href="/backoffice/clients">
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
                    Créer le client
                  </>
                )}
              </Button>
            </div>
          )}

        </form>
      </div>
    </div>
  )
}

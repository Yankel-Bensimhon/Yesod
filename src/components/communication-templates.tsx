'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Mail,
  MessageSquare,
  Edit,
  Save,
  Plus,
  Trash2,
  Eye,
  Copy,
  Send,
  Clock,
  User,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Zap,
  Settings,
  Filter,
  Search,
  MoreVertical,
  Calendar,
  Phone
} from 'lucide-react'

// Types pour les templates
interface CommunicationTemplate {
  id: string
  name: string
  type: 'email' | 'sms' | 'letter'
  category: 'reminder' | 'payment_confirmation' | 'legal_notice' | 'negotiation'
  subject?: string
  content: string
  variables: string[]
  isActive: boolean
  usage: number
  successRate: number
  lastModified: Date
}

interface TemplateVariable {
  name: string
  description: string
  example: string
}

// Variables disponibles pour les templates
const AVAILABLE_VARIABLES: TemplateVariable[] = [
  { name: '{{CLIENT_NAME}}', description: 'Nom du client', example: 'TECHNO SAS' },
  { name: '{{AMOUNT}}', description: 'Montant dû', example: '15,000 €' },
  { name: '{{DUE_DATE}}', description: 'Date d\'échéance', example: '15/03/2024' },
  { name: '{{CASE_NUMBER}}', description: 'Numéro de dossier', example: 'DOS-2024-001' },
  { name: '{{LAWYER_NAME}}', description: 'Nom de l\'avocat', example: 'Maître Dupont' },
  { name: '{{FIRM_NAME}}', description: 'Nom du cabinet', example: 'Cabinet Juridique' },
  { name: '{{DAYS_OVERDUE}}', description: 'Jours de retard', example: '45' },
  { name: '{{CONTACT_EMAIL}}', description: 'Email de contact', example: 'contact@cabinet.fr' },
  { name: '{{CONTACT_PHONE}}', description: 'Téléphone de contact', example: '01 23 45 67 89' },
  { name: '{{PAYMENT_LINK}}', description: 'Lien de paiement', example: 'https://pay.cabinet.fr/xyz' }
]

export default function CommunicationTemplates() {
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([
    {
      id: '1',
      name: 'Première relance amiable',
      type: 'email',
      category: 'reminder',
      subject: 'Rappel de paiement - Facture {{CASE_NUMBER}}',
      content: `Bonjour {{CLIENT_NAME}},

Nous vous contactons concernant le règlement de votre facture d'un montant de {{AMOUNT}}, échue le {{DUE_DATE}}.

À ce jour, nous n'avons pas reçu votre paiement. Nous vous invitons à régulariser votre situation dans les meilleurs délais.

Pour toute question, n'hésitez pas à nous contacter au {{CONTACT_PHONE}}.

Cordialement,
{{LAWYER_NAME}}
{{FIRM_NAME}}`,
      variables: ['CLIENT_NAME', 'AMOUNT', 'DUE_DATE', 'CASE_NUMBER', 'CONTACT_PHONE', 'LAWYER_NAME', 'FIRM_NAME'],
      isActive: true,
      usage: 245,
      successRate: 32.5,
      lastModified: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'Relance urgente',
      type: 'email',
      category: 'reminder',
      subject: 'URGENT - Paiement en souffrance {{CASE_NUMBER}}',
      content: `Madame, Monsieur,

Malgré nos précédents courriers, votre facture de {{AMOUNT}} demeure impayée depuis {{DAYS_OVERDUE}} jours.

Nous vous demandons de régulariser votre situation sous 8 jours, faute de quoi nous serions contraints d'engager une procédure judiciaire.

Lien de paiement sécurisé : {{PAYMENT_LINK}}

{{LAWYER_NAME}}
{{FIRM_NAME}}`,
      variables: ['AMOUNT', 'DAYS_OVERDUE', 'PAYMENT_LINK', 'LAWYER_NAME', 'FIRM_NAME', 'CASE_NUMBER'],
      isActive: true,
      usage: 189,
      successRate: 45.8,
      lastModified: new Date('2024-01-20')
    },
    {
      id: '3',
      name: 'SMS Relance rapide',
      type: 'sms',
      category: 'reminder',
      content: `{{CLIENT_NAME}}, votre paiement de {{AMOUNT}} est en retard. Régularisez avant le {{DUE_DATE}}. Info: {{CONTACT_PHONE}}`,
      variables: ['CLIENT_NAME', 'AMOUNT', 'DUE_DATE', 'CONTACT_PHONE'],
      isActive: true,
      usage: 567,
      successRate: 28.2,
      lastModified: new Date('2024-01-25')
    }
  ])

  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [previewMode, setPreviewMode] = useState(false)

  // Formulaire pour nouveau template
  const [newTemplate, setNewTemplate] = useState<Partial<CommunicationTemplate>>({
    name: '',
    type: 'email',
    category: 'reminder',
    subject: '',
    content: '',
    variables: [],
    isActive: true
  })

  // Filtrage des templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || template.type === filterType
    return matchesSearch && matchesType
  })

  // Extraire les variables d'un contenu
  const extractVariables = (content: string): string[] => {
    const regex = /\{\{([^}]+)\}\}/g
    const matches = []
    let match
    while ((match = regex.exec(content)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1])
      }
    }
    return matches
  }

  // Prévisualiser avec exemples de données
  const previewTemplate = (template: CommunicationTemplate): string => {
    let preview = template.content
    
    AVAILABLE_VARIABLES.forEach(variable => {
      const placeholder = variable.name
      preview = preview.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), variable.example)
    })
    
    return preview
  }

  // Créer un nouveau template
  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.content) return

    const variables = extractVariables(newTemplate.content)
    if (newTemplate.subject) {
      variables.push(...extractVariables(newTemplate.subject))
    }

    const template: CommunicationTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name,
      type: newTemplate.type as 'email' | 'sms' | 'letter',
      category: newTemplate.category as any,
      subject: newTemplate.subject,
      content: newTemplate.content,
      variables: [...new Set(variables)],
      isActive: true,
      usage: 0,
      successRate: 0,
      lastModified: new Date()
    }

    setTemplates([...templates, template])
    setNewTemplate({
      name: '',
      type: 'email',
      category: 'reminder',
      subject: '',
      content: '',
      variables: [],
      isActive: true
    })
    setIsCreating(false)
  }

  // Sauvegarder les modifications
  const handleSaveTemplate = () => {
    if (!selectedTemplate) return

    const variables = extractVariables(selectedTemplate.content)
    if (selectedTemplate.subject) {
      variables.push(...extractVariables(selectedTemplate.subject))
    }

    const updatedTemplate = {
      ...selectedTemplate,
      variables: [...new Set(variables)],
      lastModified: new Date()
    }

    setTemplates(templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t))
    setIsEditing(false)
  }

  // Dupliquer un template
  const handleDuplicateTemplate = (template: CommunicationTemplate) => {
    const duplicate: CommunicationTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (copie)`,
      usage: 0,
      lastModified: new Date()
    }
    setTemplates([...templates, duplicate])
  }

  // Supprimer un template
  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId))
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(null)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <MessageSquare className="h-4 w-4" />
      case 'letter': return <FileText className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'reminder': return 'bg-orange-100 text-orange-800'
      case 'payment_confirmation': return 'bg-green-100 text-green-800'
      case 'legal_notice': return 'bg-red-100 text-red-800'
      case 'negotiation': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-blue-600" />
                Templates de Communication
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez vos modèles d&apos;emails, SMS et courriers juridiques
              </p>
            </div>
            <Button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nouveau Template
            </Button>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un template..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les types</option>
              <option value="email">Emails</option>
              <option value="sms">SMS</option>
              <option value="letter">Courriers</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Liste des templates */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Templates ({filteredTemplates.length})
                </h3>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                      selectedTemplate?.id === template.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTypeIcon(template.type)}
                          <h4 className="font-medium text-gray-900 text-sm">
                            {template.name}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(template.category)}`}>
                            {template.category}
                          </span>
                          {template.isActive && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              Actif
                            </span>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500 space-y-1">
                          <div>Utilisations: {template.usage}</div>
                          <div>Taux de succès: {template.successRate}%</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicateTemplate(template)
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTemplate(template.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Détail du template sélectionné */}
          <div className="lg:col-span-2">
            {selectedTemplate ? (
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(selectedTemplate.type)}
                      <h3 className="text-xl font-semibold text-gray-900">
                        {selectedTemplate.name}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setPreviewMode(!previewMode)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        {previewMode ? 'Éditer' : 'Aperçu'}
                      </Button>
                      {!previewMode && (
                        <Button
                          onClick={isEditing ? handleSaveTemplate : () => setIsEditing(true)}
                          className="flex items-center gap-2"
                        >
                          {isEditing ? (
                            <>
                              <Save className="h-4 w-4" />
                              Sauvegarder
                            </>
                          ) : (
                            <>
                              <Edit className="h-4 w-4" />
                              Modifier
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {previewMode ? (
                    // Mode aperçu
                    <div className="space-y-6">
                      {selectedTemplate.subject && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Objet
                          </label>
                          <div className="p-3 bg-gray-50 rounded-md border">
                            {previewTemplate({ ...selectedTemplate, content: selectedTemplate.subject })}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contenu
                        </label>
                        <div className="p-4 bg-gray-50 rounded-md border whitespace-pre-wrap">
                          {previewTemplate(selectedTemplate)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Mode édition
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nom du template
                          </label>
                          <Input
                            value={selectedTemplate.name}
                            onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                            disabled={!isEditing}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type
                          </label>
                          <select
                            value={selectedTemplate.type}
                            onChange={(e) => setSelectedTemplate({ 
                              ...selectedTemplate, 
                              type: e.target.value as 'email' | 'sms' | 'letter' 
                            })}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                          >
                            <option value="email">Email</option>
                            <option value="sms">SMS</option>
                            <option value="letter">Courrier</option>
                          </select>
                        </div>
                      </div>

                      {selectedTemplate.type === 'email' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Objet
                          </label>
                          <Input
                            value={selectedTemplate.subject || ''}
                            onChange={(e) => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                            disabled={!isEditing}
                            placeholder="Objet de l'email..."
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contenu
                        </label>
                        <Textarea
                          value={selectedTemplate.content}
                          onChange={(e) => setSelectedTemplate({ ...selectedTemplate, content: e.target.value })}
                          disabled={!isEditing}
                          rows={12}
                          placeholder="Contenu du template..."
                        />
                      </div>

                      {/* Variables disponibles */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Variables disponibles
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {AVAILABLE_VARIABLES.map((variable) => (
                            <div
                              key={variable.name}
                              className="flex items-center gap-2 p-2 bg-gray-50 rounded border cursor-pointer hover:bg-gray-100"
                              onClick={() => {
                                if (isEditing) {
                                  const newContent = selectedTemplate.content + ` ${variable.name}`
                                  setSelectedTemplate({ ...selectedTemplate, content: newContent })
                                }
                              }}
                            >
                              <code className="text-sm text-blue-600">{variable.name}</code>
                              <span className="text-xs text-gray-500">{variable.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : isCreating ? (
              // Création d'un nouveau template
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Nouveau Template
                  </h3>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom du template *
                      </label>
                      <Input
                        value={newTemplate.name || ''}
                        onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        placeholder="Nom du template..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type *
                      </label>
                      <select
                        value={newTemplate.type}
                        onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                        <option value="letter">Courrier</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie
                    </label>
                    <select
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="reminder">Relance</option>
                      <option value="payment_confirmation">Confirmation de paiement</option>
                      <option value="legal_notice">Mise en demeure</option>
                      <option value="negotiation">Négociation</option>
                    </select>
                  </div>

                  {newTemplate.type === 'email' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Objet
                      </label>
                      <Input
                        value={newTemplate.subject || ''}
                        onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                        placeholder="Objet de l'email..."
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contenu *
                    </label>
                    <Textarea
                      value={newTemplate.content || ''}
                      onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                      rows={12}
                      placeholder="Contenu du template..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleCreateTemplate}
                      className="flex items-center gap-2"
                      disabled={!newTemplate.name || !newTemplate.content}
                    >
                      <Save className="h-4 w-4" />
                      Créer le template
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreating(false)}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              // État vide
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sélectionnez un template
                </h3>
                <p className="text-gray-500">
                  Choisissez un template dans la liste pour le visualiser et le modifier
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

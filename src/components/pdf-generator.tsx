'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Download, Mail } from 'lucide-react'

interface FormData {
  creditorName: string
  creditorAddress: string
  creditorPhone: string
  creditorEmail: string
  debtorName: string
  debtorAddress: string
  amount: string
  currency: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  description: string
}

export default function PDFGenerator() {
  const [formData, setFormData] = useState<FormData>({
    creditorName: '',
    creditorAddress: '',
    creditorPhone: '',
    creditorEmail: '',
    debtorName: '',
    debtorAddress: '',
    amount: '',
    currency: 'EUR',
    invoiceNumber: '',
    invoiceDate: '',
    dueDate: '',
    description: ''
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [emailOption, setEmailOption] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleGeneratePDF = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          emailOption,
          recipientEmail: emailOption ? recipientEmail : undefined
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `mise-en-demeure-${formData.debtorName.replace(/\s+/g, '-')}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        
        if (emailOption) {
          alert('PDF généré et envoyé par email avec succès!')
        } else {
          alert('PDF généré avec succès!')
        }
      } else {
        throw new Error('Erreur lors de la génération du PDF')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue lors de la génération du PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  const isFormValid = () => {
    return formData.creditorName && 
           formData.debtorName && 
           formData.amount && 
           formData.invoiceNumber &&
           (!emailOption || recipientEmail)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Creditor Information */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">
            Informations Créancier
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l&apos;entreprise *
              </label>
              <Input
                value={formData.creditorName}
                onChange={(e) => handleInputChange('creditorName', e.target.value)}
                placeholder="Nom de votre entreprise"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse
              </label>
              <Textarea
                value={formData.creditorAddress}
                onChange={(e) => handleInputChange('creditorAddress', e.target.value)}
                placeholder="Adresse complète"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <Input
                  value={formData.creditorPhone}
                  onChange={(e) => handleInputChange('creditorPhone', e.target.value)}
                  placeholder="01 23 45 67 89"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.creditorEmail}
                  onChange={(e) => handleInputChange('creditorEmail', e.target.value)}
                  placeholder="contact@entreprise.fr"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Debtor Information */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">
            Informations Débiteur
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du débiteur *
              </label>
              <Input
                value={formData.debtorName}
                onChange={(e) => handleInputChange('debtorName', e.target.value)}
                placeholder="Nom du débiteur"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse du débiteur
              </label>
              <Textarea
                value={formData.debtorAddress}
                onChange={(e) => handleInputChange('debtorAddress', e.target.value)}
                placeholder="Adresse complète du débiteur"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Debt Information */}
      <div className="mt-8 space-y-6">
        <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">
          Informations de la Créance
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant *
            </label>
            <div className="flex">
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="1000.00"
                className="rounded-r-none"
                required
              />
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="px-3 py-2 border border-l-0 border-input bg-background rounded-r-md text-sm"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              N° Facture *
            </label>
            <Input
              value={formData.invoiceNumber}
              onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
              placeholder="FAC-2024-001"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de facture
            </label>
            <Input
              type="date"
              value={formData.invoiceDate}
              onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date d&apos;échéance
            </label>
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description de la prestation
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Description détaillée de la prestation ou du service fourni"
            rows={3}
          />
        </div>
      </div>

      {/* Email Option */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            id="emailOption"
            checked={emailOption}
            onChange={(e) => setEmailOption(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <label htmlFor="emailOption" className="text-sm font-medium text-gray-700">
            Recevoir le PDF par email
          </label>
        </div>
        
        {emailOption && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse email
            </label>
            <Input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="votre@email.fr"
              required={emailOption}
            />
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="mt-8 text-center">
        <Button
          onClick={handleGeneratePDF}
          disabled={!isFormValid() || isGenerating}
          size="lg"
          className="px-8 py-3 text-lg"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Génération en cours...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {emailOption ? <Mail className="h-5 w-5" /> : <Download className="h-5 w-5" />}
              {emailOption ? 'Générer et Envoyer' : 'Générer le PDF'}
            </span>
          )}
        </Button>
        
        <p className="text-sm text-gray-500 mt-2">
          * Champs obligatoires
        </p>
      </div>
    </div>
  )
}
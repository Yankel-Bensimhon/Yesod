'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Download, Trash2, Eye, Shield, Calendar, User, Database, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { recordConsent, getConsents, hasValidConsent } from '@/lib/security-middleware'

// =====================================
// RGPD COMPLIANCE INTERFACE
// =====================================

export default function RGPDComplianceInterface() {
  const [activeTab, setActiveTab] = useState('consents')
  const [consents, setConsents] = useState<any[]>([])
  const [erasureRequests, setErasureRequests] = useState<any[]>([])
  const [dataExports, setDataExports] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    // Load consent data (mock)
    setConsents([
      {
        id: '1',
        purpose: 'Marketing',
        isConsented: true,
        date: '2024-01-15',
        version: '1.0'
      },
      {
        id: '2',
        purpose: 'Analytics',
        isConsented: true,
        date: '2024-01-15',
        version: '1.0'
      },
      {
        id: '3',
        purpose: 'Communication',
        isConsented: false,
        date: '2024-02-01',
        version: '1.1'
      }
    ])

    // Load erasure requests (mock)
    setErasureRequests([
      {
        id: '1',
        requesterEmail: 'client@example.com',
        status: 'pending',
        requestDate: '2024-07-20',
        expectedCompletion: '2024-08-20'
      },
      {
        id: '2',
        requesterEmail: 'user@test.com',
        status: 'completed',
        requestDate: '2024-07-10',
        completedDate: '2024-07-25'
      }
    ])

    // Load data exports (mock)
    setDataExports([
      {
        id: '1',
        userEmail: 'user@example.com',
        requestDate: '2024-07-25',
        status: 'ready',
        downloadUrl: '#'
      }
    ])
  }

  const tabs = [
    { id: 'consents', label: 'Consentements', icon: CheckCircle },
    { id: 'erasure', label: 'Droit à l\'oubli', icon: Trash2 },
    { id: 'exports', label: 'Exports de données', icon: Download },
    { id: 'retention', label: 'Rétention', icon: Calendar },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          Conformité RGPD
        </h1>
        <p className="text-gray-600 mt-2">
          Gestion des données personnelles et conformité réglementaire
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Consents Tab */}
        {activeTab === 'consents' && (
          <div className="space-y-6">
            {/* Consent Management */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Gestion des Consentements
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Suivi et gestion des consentements utilisateur selon le RGPD
                </p>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Finalité
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Version
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {consents.map((consent) => (
                        <tr key={consent.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {consent.purpose}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              consent.isConsented
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {consent.isConsented ? 'Consenti' : 'Refusé'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(consent.date).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            v{consent.version}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Détails
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Consent Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taux de Consentement</p>
                    <p className="text-2xl font-bold text-green-600">89%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Consentements Actifs</p>
                    <p className="text-2xl font-bold text-blue-600">1,247</p>
                  </div>
                  <User className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Retraits (30j)</p>
                    <p className="text-2xl font-bold text-orange-600">23</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Erasure Requests Tab */}
        {activeTab === 'erasure' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Demandes de Suppression (Droit à l&apos;oubli)
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Gestion des demandes de suppression de données personnelles
              </p>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Demandeur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date de demande
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Échéance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {erasureRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {request.requesterEmail}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            request.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : request.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {request.status === 'completed' ? 'Terminé' : 
                             request.status === 'pending' ? 'En attente' : 'Rejeté'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.requestDate).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.expectedCompletion ? 
                            new Date(request.expectedCompletion).toLocaleDateString('fr-FR') : 
                            '-'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Examiner
                          </Button>
                          {request.status === 'pending' && (
                            <Button variant="outline" size="sm" className="text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approuver
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Data Exports Tab */}
        {activeTab === 'exports' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Download className="h-5 w-5" />
                Exports de Données (Droit de Portabilité)
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Demandes d&apos;export de données personnelles
              </p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <Button className="mb-4">
                  <Download className="h-4 w-4 mr-2" />
                  Nouvel Export
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date de demande
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dataExports.map((exportItem) => (
                      <tr key={exportItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {exportItem.userEmail}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(exportItem.requestDate).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            exportItem.status === 'ready'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {exportItem.status === 'ready' ? 'Prêt' : 'En cours'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {exportItem.status === 'ready' && (
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Télécharger
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Data Retention Tab */}
        {activeTab === 'retention' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Politiques de Rétention des Données
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Configuration des durées de conservation et d&apos;anonymisation
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Politiques Actives</h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <span className="text-sm font-medium text-gray-900">Dossiers clients</span>
                          <p className="text-xs text-gray-600">Conservation légale</p>
                        </div>
                        <span className="text-sm text-blue-600 font-medium">7 ans</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <span className="text-sm font-medium text-gray-900">Données marketing</span>
                          <p className="text-xs text-gray-600">Consentement requis</p>
                        </div>
                        <span className="text-sm text-blue-600 font-medium">3 ans</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <span className="text-sm font-medium text-gray-900">Logs de connexion</span>
                          <p className="text-xs text-gray-600">Sécurité système</p>
                        </div>
                        <span className="text-sm text-blue-600 font-medium">1 an</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Prochaines Actions</h4>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-900">Anonymisation programmée</span>
                        </div>
                        <p className="text-xs text-yellow-700">47 dossiers à anonymiser dans 15 jours</p>
                      </div>
                      
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <div className="flex items-center gap-2 mb-1">
                          <Database className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">Archivage automatique</span>
                        </div>
                        <p className="text-xs text-blue-700">123 documents à archiver cette semaine</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Actions */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <h4 className="font-medium text-gray-900 mb-4">Actions Manuelles</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    Lancer l&apos;anonymisation maintenant
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Générer rapport de rétention
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Exporter politique RGPD
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Audit de conformité
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// =====================================
// CONSENT BANNER COMPONENT
// =====================================

export function ConsentBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true
    analytics: false,
    marketing: false,
    functional: false
  })

  useEffect(() => {
    // Check if consent has been given
    const hasConsent = localStorage.getItem('rgpd-consent')
    if (!hasConsent) {
      setIsVisible(true)
    }
  }, [])

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    }
    setPreferences(allAccepted)
    saveConsent(allAccepted)
    setIsVisible(false)
  }

  const acceptSelected = () => {
    saveConsent(preferences)
    setIsVisible(false)
  }

  const saveConsent = (consents: any) => {
    localStorage.setItem('rgpd-consent', JSON.stringify({
      ...consents,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }))

    // Record consent in system
    Object.entries(consents).forEach(([purpose, accepted]) => {
      recordConsent('anonymous', purpose, accepted as boolean)
    })
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto p-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="md:flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Gestion des cookies et données personnelles
            </h3>
            <p className="text-sm text-gray-600 mb-4 md:mb-0">
              Nous utilisons des cookies pour améliorer votre expérience et analyser notre trafic. 
              Vous pouvez personnaliser vos préférences ou accepter tous les cookies.
            </p>
          </div>
          
          <div className="md:ml-6 flex flex-col sm:flex-row gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsVisible(false)}>
              Paramètres
            </Button>
            <Button variant="outline" size="sm" onClick={acceptSelected}>
              Accepter la sélection
            </Button>
            <Button size="sm" onClick={acceptAll}>
              Tout accepter
            </Button>
          </div>
        </div>

        {/* Detailed preferences (could be toggleable) */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={preferences.necessary} 
              disabled 
              className="mr-2" 
            />
            <span className="text-gray-600">Nécessaires</span>
          </label>
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={preferences.analytics}
              onChange={(e) => setPreferences({...preferences, analytics: e.target.checked})}
              className="mr-2" 
            />
            <span className="text-gray-600">Analytics</span>
          </label>
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={preferences.marketing}
              onChange={(e) => setPreferences({...preferences, marketing: e.target.checked})}
              className="mr-2" 
            />
            <span className="text-gray-600">Marketing</span>
          </label>
          <label className="flex items-center">
            <input 
              type="checkbox" 
              checked={preferences.functional}
              onChange={(e) => setPreferences({...preferences, functional: e.target.checked})}
              className="mr-2" 
            />
            <span className="text-gray-600">Fonctionnels</span>
          </label>
        </div>
      </div>
    </div>
  )
}

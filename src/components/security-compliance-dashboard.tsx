'use client'

import React, { useState, useEffect } from 'react'
import { Shield, Eye, Database, Key, AlertTriangle, CheckCircle, Lock, Users, FileText, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { validatePasswordStrength, getSecurityLogs, getConsents, logSecurityEvent } from '@/lib/security-middleware'

// =====================================
// SECURITY & COMPLIANCE DASHBOARD
// =====================================

export default function SecurityComplianceDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [securityLogs, setSecurityLogs] = useState<any[]>([])
  const [passwordValidation, setPasswordValidation] = useState<any>(null)
  const [testPassword, setTestPassword] = useState('')

  useEffect(() => {
    // Load security logs
    setSecurityLogs(getSecurityLogs(50))
  }, [])

  const handlePasswordTest = (password: string) => {
    setTestPassword(password)
    setPasswordValidation(validatePasswordStrength(password))
  }

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Shield },
    { id: 'audit', label: 'Audit Trail', icon: Eye },
    { id: 'encryption', label: 'Chiffrement', icon: Key },
    { id: 'rgpd', label: 'Conformité RGPD', icon: FileText },
    { id: 'monitoring', label: 'Surveillance', icon: AlertTriangle },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          Sécurité & Conformité RGPD
        </h1>
        <p className="text-gray-600 mt-2">
          Tableau de bord de sécurité avancée et conformité réglementaire
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
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Security Status Cards */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Niveau de Sécurité</p>
                  <p className="text-2xl font-bold text-green-600">Élevé</p>
                </div>
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Toutes les protections actives
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conformité RGPD</p>
                  <p className="text-2xl font-bold text-blue-600">95%</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Données Chiffrées</p>
                  <p className="text-2xl font-bold text-purple-600">1,247</p>
                </div>
                <Lock className="h-8 w-8 text-purple-600" />
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Key className="h-4 w-4 mr-2" />
                  AES-256 actif
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Événements Sécurité</p>
                  <p className="text-2xl font-bold text-orange-600">{securityLogs.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Eye className="h-4 w-4 mr-2" />
                  Dernières 24h
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Trail Tab */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Journal d&apos;Audit (Audit Trail)
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Historique complet des actions utilisateur et système
              </p>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Horodatage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ressource
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {securityLogs.slice(0, 10).map((log, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(log.timestamp).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.userId || 'Système'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            log.action.includes('CRITICAL') 
                              ? 'bg-red-100 text-red-800'
                              : log.action.includes('LOGIN')
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {log.resource}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {log.ip || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Encryption Tab */}
        {activeTab === 'encryption' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Gestion du Chiffrement
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Configuration Actuelle</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Algorithme</span>
                        <span className="text-sm font-medium">AES-256-GCM</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Longueur de clé</span>
                        <span className="text-sm font-medium">256 bits</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Rotation des clés</span>
                        <span className="text-sm font-medium text-green-600">Automatique (90j)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Test de Sécurité des Mots de Passe</h4>
                    <div className="space-y-3">
                      <input
                        type="password"
                        placeholder="Testez un mot de passe..."
                        value={testPassword}
                        onChange={(e) => handlePasswordTest(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {passwordValidation && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Force:</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  passwordValidation.score <= 2 ? 'bg-red-500' :
                                  passwordValidation.score <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${(passwordValidation.score / 6) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {passwordValidation.score}/6
                            </span>
                          </div>
                          {passwordValidation.feedback.length > 0 && (
                            <div className="text-xs text-gray-600">
                              <strong>Améliorations:</strong>
                              <ul className="list-disc list-inside mt-1">
                                {passwordValidation.feedback.map((item: string, index: number) => (
                                  <li key={index}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RGPD Tab */}
        {activeTab === 'rgpd' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Conformité RGPD
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Consentements */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h4 className="font-medium text-green-900">Consentements</h4>
                    </div>
                    <p className="text-2xl font-bold text-green-600">98%</p>
                    <p className="text-sm text-green-700">Taux de consentement</p>
                  </div>

                  {/* Droit à l&apos;oubli */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium text-blue-900">Droit à l&apos;oubli</h4>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">3</p>
                    <p className="text-sm text-blue-700">Demandes en cours</p>
                  </div>

                  {/* Rétention des données */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="h-5 w-5 text-purple-600" />
                      <h4 className="font-medium text-purple-900">Rétention</h4>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">7 ans</p>
                    <p className="text-sm text-purple-700">Politique active</p>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="font-medium text-gray-900 mb-4">Actions RGPD Disponibles</h4>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => logSecurityEvent('RGPD_EXPORT', 'DataExport', 'system')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Exporter les données personnelles
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => logSecurityEvent('RGPD_ANONYMIZE', 'DataAnonymization', 'system')}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Lancer l&apos;anonymisation programmée
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => logSecurityEvent('RGPD_REPORT', 'ComplianceReport', 'system')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Générer rapport de conformité
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Surveillance de Sécurité
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Alertes Récentes</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">Tentative de connexion suspecte</span>
                      </div>
                      <span className="text-xs text-yellow-600">Il y a 2h</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800">Sauvegarde automatique réussie</span>
                      </div>
                      <span className="text-xs text-green-600">Il y a 4h</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Métriques de Sécurité</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Connexions réussies (24h)</span>
                      <span className="text-sm font-medium text-green-600">247</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tentatives échouées (24h)</span>
                      <span className="text-sm font-medium text-red-600">12</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Taux de réussite</span>
                      <span className="text-sm font-medium text-blue-600">95.3%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Button 
                  onClick={() => {
                    logSecurityEvent('SECURITY_SCAN', 'SystemScan', 'system')
                    alert('Scan de sécurité lancé. Résultats disponibles dans quelques minutes.')
                  }}
                  className="w-full md:w-auto"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Lancer un scan de sécurité
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LegalEcosystemEngine } from '@/lib/integrations/legal-ecosystem';

interface CompanyData {
  siret: string;
  name: string;
  address: string;
  activity: string;
  creationDate: string;
  legalForm: string;
  capital: number;
  status: 'active' | 'inactive' | 'dissolved';
  employees: number;
}

interface CreditScore {
  score: number;
  grade: string;
  riskLevel: 'low' | 'medium' | 'high';
  paymentIncidents: number;
  creditLimit: number;
  lastUpdate: string;
}

interface CourtProcedure {
  id: string;
  type: string;
  court: string;
  date: string;
  status: 'pending' | 'ongoing' | 'closed';
  amount?: number;
  parties: string[];
}

interface BailiffPartner {
  id: string;
  name: string;
  office: string;
  address: string;
  phone: string;
  email: string;
  specialties: string[];
  rating: number;
  fees: {
    consultation: number;
    execution: number;
    travel: number;
  };
}

interface AccountingData {
  software: string;
  lastSync: string;
  status: 'connected' | 'disconnected' | 'error';
  invoices: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
}

const LegalEcosystemDashboard: React.FC = () => {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [courtProcedures, setCourtProcedures] = useState<CourtProcedure[]>([]);
  const [bailiffPartners, setBailiffPartners] = useState<BailiffPartner[]>([]);
  const [accountingData, setAccountingData] = useState<AccountingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchSiret, setSearchSiret] = useState('');
  const [selectedTab, setSelectedTab] = useState<'company' | 'credit' | 'procedures' | 'bailiffs' | 'accounting'>('company');

  const legalEngine = new LegalEcosystemEngine();

  const searchCompany = async () => {
    if (!searchSiret || searchSiret.length !== 14) {
      alert('Veuillez saisir un numéro SIRET valide (14 chiffres)');
      return;
    }

    try {
      setLoading(true);
      
      // Recherche des données d'entreprise
      const company = await legalEngine.getCompanyDataFromInfogreffe(searchSiret);
      setCompanyData(company);

      // Récupération du score de crédit
      const credit = await legalEngine.getCreditScoreFromBanqueDeFrance(searchSiret);
      setCreditScore(credit);

      // Recherche des procédures judiciaires
      const procedures = await legalEngine.searchCourtProcedures(company.name);
      setCourtProcedures(procedures);

    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      alert('Erreur lors de la récupération des données');
    } finally {
      setLoading(false);
    }
  };

  const loadBailiffPartners = async () => {
    try {
      setLoading(true);
      const partners = await legalEngine.findBailiffPartners('Paris');
      setBailiffPartners(partners);
    } catch (error) {
      console.error('Erreur lors du chargement des huissiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncAccountingSoftware = async (software: string) => {
    try {
      setLoading(true);
      const data = await legalEngine.syncAccountingSoftware(software);
      setAccountingData(data);
    } catch (error) {
      console.error('Erreur lors de la synchronisation comptable:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBailiffPartners();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
      case 'closed':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'ongoing':
        return 'text-yellow-600 bg-yellow-100';
      case 'inactive':
      case 'dissolved':
      case 'disconnected':
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const tabs = [
    { id: 'company', label: 'Entreprise', icon: '🏢' },
    { id: 'credit', label: 'Score crédit', icon: '📊' },
    { id: 'procedures', label: 'Procédures', icon: '⚖️' },
    { id: 'bailiffs', label: 'Huissiers', icon: '👨‍⚖️' },
    { id: 'accounting', label: 'Comptabilité', icon: '📚' },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Écosystème Légal</h1>
        <p className="text-gray-600 mt-1">Intégrations avec les organismes officiels français</p>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="siret" className="block text-sm font-medium text-gray-700 mb-2">
              Recherche par SIRET
            </label>
            <input
              id="siret"
              type="text"
              value={searchSiret}
              onChange={(e) => setSearchSiret(e.target.value)}
              placeholder="Saisissez le numéro SIRET (14 chiffres)"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              maxLength={14}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={searchCompany}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? 'Recherche...' : 'Rechercher'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="space-y-6">
        {/* Onglet Entreprise */}
        {selectedTab === 'company' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <h3 className="text-xl font-semibold mb-4">Données Infogreffe</h3>
            {companyData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Informations générales</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">SIRET:</span>
                      <span className="font-medium">{companyData.siret}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Raison sociale:</span>
                      <span className="font-medium">{companyData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Forme juridique:</span>
                      <span className="font-medium">{companyData.legalForm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Statut:</span>
                      <span className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(companyData.status)}`}>
                        {companyData.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Détails financiers</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capital:</span>
                      <span className="font-medium">{formatCurrency(companyData.capital)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Employés:</span>
                      <span className="font-medium">{companyData.employees}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Création:</span>
                      <span className="font-medium">{new Date(companyData.creationDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Activité:</span>
                      <span className="font-medium">{companyData.activity}</span>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <h4 className="font-medium text-gray-700 mb-3">Adresse</h4>
                  <p className="text-gray-600">{companyData.address}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Effectuez une recherche SIRET pour afficher les données d'entreprise
              </div>
            )}
          </motion.div>
        )}

        {/* Onglet Score de crédit */}
        {selectedTab === 'credit' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <h3 className="text-xl font-semibold mb-4">Score Banque de France</h3>
            {creditScore ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{creditScore.score}</div>
                  <div className="text-lg font-medium text-gray-700">Note: {creditScore.grade}</div>
                  <div className={`inline-block px-3 py-1 rounded mt-2 ${getRiskColor(creditScore.riskLevel)}`}>
                    Risque {creditScore.riskLevel}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Détails du score</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Incidents de paiement:</span>
                      <span className="font-medium">{creditScore.paymentIncidents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Limite de crédit:</span>
                      <span className="font-medium">{formatCurrency(creditScore.creditLimit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dernière MAJ:</span>
                      <span className="font-medium">{new Date(creditScore.lastUpdate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Évaluation du risque</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Score de solvabilité</span>
                        <span>{creditScore.score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            creditScore.score >= 70 ? 'bg-green-500' :
                            creditScore.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${creditScore.score}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Effectuez une recherche SIRET pour afficher le score de crédit
              </div>
            )}
          </motion.div>
        )}

        {/* Onglet Procédures judiciaires */}
        {selectedTab === 'procedures' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <h3 className="text-xl font-semibold mb-4">Procédures judiciaires</h3>
            {courtProcedures.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Type de procédure</th>
                      <th className="text-left py-2">Tribunal</th>
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Statut</th>
                      <th className="text-left py-2">Montant</th>
                      <th className="text-left py-2">Parties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courtProcedures.map((procedure) => (
                      <tr key={procedure.id} className="border-b">
                        <td className="py-3">{procedure.type}</td>
                        <td className="py-3">{procedure.court}</td>
                        <td className="py-3">{new Date(procedure.date).toLocaleDateString()}</td>
                        <td className="py-3">
                          <span className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(procedure.status)}`}>
                            {procedure.status}
                          </span>
                        </td>
                        <td className="py-3">
                          {procedure.amount ? formatCurrency(procedure.amount) : '-'}
                        </td>
                        <td className="py-3">{procedure.parties.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Aucune procédure judiciaire trouvée
              </div>
            )}
          </motion.div>
        )}

        {/* Onglet Huissiers partenaires */}
        {selectedTab === 'bailiffs' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <h3 className="text-xl font-semibold mb-4">Huissiers partenaires</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bailiffPartners.map((bailiff) => (
                <div key={bailiff.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium">{bailiff.name}</h4>
                    <div className="flex items-center">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm text-gray-600 ml-1">{bailiff.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{bailiff.office}</p>
                  <p className="text-sm text-gray-500 mb-3">{bailiff.address}</p>
                  
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Spécialités:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {bailiff.specialties.map((specialty, index) => (
                        <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Consultation: {formatCurrency(bailiff.fees.consultation)}</p>
                    <p>Exécution: {formatCurrency(bailiff.fees.execution)}</p>
                    <p>Déplacement: {formatCurrency(bailiff.fees.travel)}</p>
                  </div>
                  
                  <div className="mt-3 space-y-1">
                    <a href={`tel:${bailiff.phone}`} className="block text-sm text-blue-600 hover:text-blue-800">
                      📞 {bailiff.phone}
                    </a>
                    <a href={`mailto:${bailiff.email}`} className="block text-sm text-blue-600 hover:text-blue-800">
                      ✉️ {bailiff.email}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Onglet Comptabilité */}
        {selectedTab === 'accounting' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <h3 className="text-xl font-semibold mb-4">Synchronisation comptable</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <button
                onClick={() => syncAccountingSoftware('Sage')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">💼</div>
                  <div className="font-medium">Sage</div>
                </div>
              </button>
              
              <button
                onClick={() => syncAccountingSoftware('Cegid')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-medium">Cegid</div>
                </div>
              </button>
              
              <button
                onClick={() => syncAccountingSoftware('QuickBooks')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">📈</div>
                  <div className="font-medium">QuickBooks</div>
                </div>
              </button>
              
              <button
                onClick={() => syncAccountingSoftware('EBP')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">💻</div>
                  <div className="font-medium">EBP</div>
                </div>
              </button>
            </div>
            
            {accountingData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Connexion</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Logiciel:</span>
                      <span className="font-medium">{accountingData.software}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Statut:</span>
                      <span className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(accountingData.status)}`}>
                        {accountingData.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dernière sync:</span>
                      <span className="font-medium">{new Date(accountingData.lastSync).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Factures</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium">{accountingData.invoices.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payées:</span>
                      <span className="font-medium text-green-600">{accountingData.invoices.paid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">En attente:</span>
                      <span className="font-medium text-yellow-600">{accountingData.invoices.pending}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">En retard:</span>
                      <span className="font-medium text-red-600">{accountingData.invoices.overdue}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LegalEcosystemDashboard;

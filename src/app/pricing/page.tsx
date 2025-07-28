'use client'

import { 
  Check, 
  Star, 
  Users, 
  Building2, 
  Crown,
  ArrowRight,
  Calculator,
  Shield,
  Phone,
  Mail,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState } from 'react'

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  const plans = [
    {
      name: "Starter",
      description: "Parfait pour les petites entreprises",
      icon: Users,
      color: "blue",
      price: {
        monthly: 49,
        annual: 39
      },
      features: [
        "Jusqu&apos;à 10 dossiers/mois",
        "Relances amiables automatisées",
        "Mise en demeure standard",
        "Interface web intuitive",
        "Support par email",
        "Rapports mensuels",
        "Conformité RGPD"
      ],
      limitations: [
        "Pas d&apos;injonction de payer",
        "Pas de recherches patrimoniales"
      ],
      popular: false
    },
    {
      name: "Professional",
      description: "Idéal pour les PME en croissance",
      icon: Building2,
      color: "green",
      price: {
        monthly: 149,
        annual: 119
      },
      features: [
        "Jusqu&apos;à 50 dossiers/mois",
        "Toutes les fonctionnalités Starter",
        "Injonctions de payer incluses",
        "Recherches patrimoniales",
        "Actes d&apos;huissier",
        "Support téléphonique prioritaire",
        "Gestionnaire de compte dédié",
        "Rapports avancés et analytics",
        "API pour intégrations"
      ],
      limitations: [],
      popular: true
    },
    {
      name: "Enterprise",
      description: "Pour les grandes entreprises",
      icon: Crown,
      color: "purple",
      price: {
        monthly: 399,
        annual: 319
      },
      features: [
        "Dossiers illimités",
        "Toutes les fonctionnalités Professional",
        "Procédures d&apos;exécution forcée",
        "Saisies mobilières et immobilières",
        "Équipe juridique dédiée",
        "Support 24/7",
        "Formation de vos équipes",
        "Intégration ERP sur mesure",
        "SLA garanti 99.9%",
        "Tarifs négociés au succès"
      ],
      limitations: [],
      popular: false
    }
  ]

  const getColorClasses = (color: string, popular: boolean = false) => {
    const baseClasses = {
      blue: {
        border: popular ? "border-blue-500" : "border-gray-200",
        icon: "bg-blue-100 text-blue-600",
        button: "bg-blue-600 hover:bg-blue-700 text-white",
        badge: "bg-blue-600"
      },
      green: {
        border: popular ? "border-green-500" : "border-gray-200",
        icon: "bg-green-100 text-green-600",
        button: "bg-green-600 hover:bg-green-700 text-white",
        badge: "bg-green-600"
      },
      purple: {
        border: popular ? "border-purple-500" : "border-gray-200",
        icon: "bg-purple-100 text-purple-600",
        button: "bg-purple-600 hover:bg-purple-700 text-white",
        badge: "bg-purple-600"
      }
    }
    return baseClasses[color as keyof typeof baseClasses] || baseClasses.blue
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Tarifs transparents
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
            Choisissez la formule qui correspond à vos besoins. 
            Pas de frais cachés, pas d&apos;engagement minimum.
          </p>
          
          {/* Toggle Billing */}
          <div className="flex items-center justify-center mb-12">
            <div className="bg-white/10 rounded-full p-1 backdrop-blur-sm">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'monthly' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-white hover:text-blue-100'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === 'annual' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-white hover:text-blue-100'
                }`}
              >
                Annuel
                <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const colorClasses = getColorClasses(plan.color, plan.popular)
              const Icon = plan.icon
              
              return (
                <div
                  key={plan.name}
                  className={`relative bg-white rounded-2xl shadow-sm border-2 ${colorClasses.border} ${
                    plan.popular ? 'transform scale-105 shadow-xl' : ''
                  } transition-all hover:shadow-lg`}
                >
                  {plan.popular && (
                    <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 ${colorClasses.badge} text-white px-6 py-2 rounded-full text-sm font-medium flex items-center`}>
                      <Star className="h-4 w-4 mr-1" />
                      Plus populaire
                    </div>
                  )}
                  
                  <div className="p-8">
                    <div className={`flex items-center justify-center w-16 h-16 ${colorClasses.icon} rounded-full mb-6`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-6">{plan.description}</p>
                    
                    <div className="mb-6">
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-gray-900">
                          {plan.price[billingCycle]}€
                        </span>
                        <span className="text-gray-500 ml-2">/mois</span>
                      </div>
                      {billingCycle === 'annual' && (
                        <p className="text-sm text-green-600 mt-1">
                          Économisez {(plan.price.monthly - plan.price.annual) * 12}€/an
                        </p>
                      )}
                    </div>
                    
                    <Link href="/auth/signin">
                      <Button className={`w-full mb-6 ${colorClasses.button}`}>
                        Commencer maintenant
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Inclus :</h4>
                      <ul className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {plan.limitations.length > 0 && (
                        <div className="pt-4 border-t border-gray-100">
                          <h4 className="font-semibold text-gray-900 mb-3">Limitations :</h4>
                          <ul className="space-y-2">
                            {plan.limitations.map((limitation, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-gray-400 mr-3">•</span>
                                <span className="text-gray-500 text-sm">{limitation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Tarification au succès */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-12">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-6 mx-auto">
                <Calculator className="h-8 w-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Tarification au succès
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Pour les dossiers complexes ou de montants élevés, 
                nous proposons une tarification au succès
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl p-8 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Comment ça fonctionne ?</h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    Aucun frais d&apos;ouverture de dossier
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    Honoraires prélevés uniquement sur les sommes récupérées
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    Pourcentage dégressif selon le montant
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    Transparence totale sur les coûts
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl p-8 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Barème indicatif</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">0 - 5 000€</span>
                    <span className="font-semibold text-gray-900">25%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">5 000 - 20 000€</span>
                    <span className="font-semibold text-gray-900">20%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">20 000 - 50 000€</span>
                    <span className="font-semibold text-gray-900">15%</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">+ 50 000€</span>
                    <span className="font-semibold text-gray-900">Sur devis</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                Demander un devis personnalisé
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services additionnels */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Services additionnels
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Complétez votre solution de recouvrement avec nos services experts
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-6">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Audit de créances</h3>
              <p className="text-gray-600 mb-6">
                Analyse approfondie de vos créances pour optimiser 
                vos chances de recouvrement.
              </p>
              <div className="text-2xl font-bold text-gray-900 mb-4">150€</div>
              <p className="text-sm text-gray-500">par audit complet</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-full mb-6">
                <FileText className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Rédaction d&apos;actes</h3>
              <p className="text-gray-600 mb-6">
                Mise en demeure personnalisée et actes juridiques 
                sur mesure par nos avocats.
              </p>
              <div className="text-2xl font-bold text-gray-900 mb-4">75€</div>
              <p className="text-sm text-gray-500">par acte rédigé</p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-6">
                <Phone className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Consultation juridique</h3>
              <p className="text-gray-600 mb-6">
                Conseil personnalisé avec nos experts en droit 
                du recouvrement et des affaires.
              </p>
              <div className="text-2xl font-bold text-gray-900 mb-4">120€</div>
              <p className="text-sm text-gray-500">par heure de consultation</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Pricing */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Questions sur nos tarifs
            </h2>
          </div>

          <div className="space-y-8">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Puis-je changer de formule en cours d&apos;abonnement ?
              </h3>
              <p className="text-gray-600">
                Oui, vous pouvez upgrader ou downgrader votre formule à tout moment. 
                Les changements prennent effet immédiatement avec proratisation.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Y a-t-il des frais de résiliation ?
              </h3>
              <p className="text-gray-600">
                Aucun frais de résiliation. Vous pouvez annuler votre abonnement 
                à tout moment depuis votre espace client.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Les frais d&apos;huissier sont-ils inclus ?
              </h3>
              <p className="text-gray-600">
                Les frais d&apos;huissier et de tribunal sont facturés séparément selon 
                les tarifs officiels. Nous vous informons à l&apos;avance de tous les coûts.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Proposez-vous une période d&apos;essai ?
              </h3>
              <p className="text-gray-600">
                Oui, nous offrons 14 jours d&apos;essai gratuit sur toutes nos formules. 
                Aucune carte bancaire requise pour commencer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à commencer ?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Choisissez votre formule et récupérez vos premières créances dès aujourd&apos;hui
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signin">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Commencer l&apos;essai gratuit
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600">
              <Mail className="h-4 w-4 mr-2" />
              Demander une démo
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

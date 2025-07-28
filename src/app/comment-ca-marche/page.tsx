'use client'

import { 
  CheckCircle, 
  Clock, 
  FileText, 
  Scale, 
  Shield, 
  Users, 
  ArrowRight,
  Phone,
  Mail,
  Gavel,
  TrendingUp,
  Award,
  Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function CommentCaMarche() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Comment ça marche ?
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-8">
              Découvrez notre processus de recouvrement professionnel, 
              de la relance amiable jusqu'à l'exécution forcée
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signin">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Commencer maintenant
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600">
                  Voir les tarifs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Processus étape par étape */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Notre processus en 4 étapes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Un processus éprouvé et conforme au droit français pour maximiser 
              vos chances de recouvrement
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Étape 1 */}
            <div className="relative">
              <div className="bg-blue-50 rounded-2xl p-8 h-full">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mb-6">
                  1
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Relance Amiable</h3>
                <p className="text-gray-600 mb-6">
                  Nous contactons votre débiteur par courrier recommandé et appels téléphoniques 
                  pour tenter une résolution à l'amiable dans les meilleurs délais.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Mail className="h-4 w-4 mr-2" />
                    Courrier recommandé
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Phone className="h-4 w-4 mr-2" />
                    Appels de relance
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-2" />
                    Délai : 15 jours
                  </div>
                </div>
              </div>
              <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <ArrowRight className="h-8 w-8 text-blue-300" />
              </div>
            </div>

            {/* Étape 2 */}
            <div className="relative">
              <div className="bg-yellow-50 rounded-2xl p-8 h-full">
                <div className="flex items-center justify-center w-16 h-16 bg-yellow-600 text-white rounded-full text-2xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Mise en Demeure</h3>
                <p className="text-gray-600 mb-6">
                  Si la relance amiable échoue, nous envoyons une mise en demeure officielle 
                  avec valeur juridique, rédigée par nos avocats spécialisés.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Scale className="h-4 w-4 mr-2" />
                    Valeur juridique
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <FileText className="h-4 w-4 mr-2" />
                    Acte d'huissier
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-2" />
                    Délai : 8 jours
                  </div>
                </div>
              </div>
              <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <ArrowRight className="h-8 w-8 text-yellow-300" />
              </div>
            </div>

            {/* Étape 3 */}
            <div className="relative">
              <div className="bg-orange-50 rounded-2xl p-8 h-full">
                <div className="flex items-center justify-center w-16 h-16 bg-orange-600 text-white rounded-full text-2xl font-bold mb-6">
                  3
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Injonction de Payer</h3>
                <p className="text-gray-600 mb-6">
                  Procédure judiciaire simplifiée devant le tribunal compétent. 
                  Nous gérons entièrement le dossier juridique pour vous.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Gavel className="h-4 w-4 mr-2" />
                    Tribunal compétent
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Shield className="h-4 w-4 mr-2" />
                    Gestion complète
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-2" />
                    Délai : 30 jours
                  </div>
                </div>
              </div>
              <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                <ArrowRight className="h-8 w-8 text-orange-300" />
              </div>
            </div>

            {/* Étape 4 */}
            <div className="relative">
              <div className="bg-green-50 rounded-2xl p-8 h-full">
                <div className="flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-full text-2xl font-bold mb-6">
                  4
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Exécution Forcée</h3>
                <p className="text-gray-600 mb-6">
                  Si nécessaire, nous procédons aux saisies et mesures d'exécution 
                  pour récupérer vos créances avec l'aide d'huissiers de justice.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Target className="h-4 w-4 mr-2" />
                    Saisies mobilières
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Saisies bancaires
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Award className="h-4 w-4 mr-2" />
                    Recouvrement effectif
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir Yesod ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Notre expertise juridique et notre approche technologique garantissent 
              un service de recouvrement efficace et transparent
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-6">
                <Scale className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Expertise Juridique</h3>
              <p className="text-gray-600 mb-4">
                Cabinet d'avocats spécialisé en droit des affaires et recouvrement. 
                Plus de 15 ans d'expérience dans le secteur.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Avocats spécialisés
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Conformité juridique
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Veille réglementaire
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-6">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Taux de Réussite Élevé</h3>
              <p className="text-gray-600 mb-4">
                85% de taux de recouvrement sur nos dossiers traités. 
                Méthodes éprouvées et approche personnalisée.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  85% de réussite
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Délais optimisés
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Suivi personnalisé
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 text-purple-600 rounded-full mb-6">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Accompagnement Complet</h3>
              <p className="text-gray-600 mb-4">
                De la création du dossier jusqu'au recouvrement final. 
                Interface digitale moderne et équipe dédiée.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Plateforme digitale
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Équipe dédiée
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Support réactif
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Questions fréquentes
            </h2>
          </div>

          <div className="space-y-8">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Combien de temps dure le processus de recouvrement ?
              </h3>
              <p className="text-gray-600">
                Le délai varie selon la complexité du dossier. En moyenne, 60 à 90 jours 
                pour un recouvrement amiable, et 6 à 12 mois pour une procédure judiciaire complète.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Quels sont les frais appliqués ?
              </h3>
              <p className="text-gray-600">
                Nos honoraires sont transparents et adaptés à votre situation. 
                Tarification au succès possible selon les dossiers. Consultez notre page tarifs pour plus de détails.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Que se passe-t-il si le débiteur n'a pas de biens saisissables ?
              </h3>
              <p className="text-gray-600">
                Nous effectuons systématiquement des recherches patrimoniales avant d'engager 
                les procédures d'exécution. Notre expertise nous permet d'identifier les actifs saisissables.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Puis-je suivre l'avancement de mon dossier ?
              </h3>
              <p className="text-gray-600">
                Absolument. Notre plateforme vous permet de suivre en temps réel l'état de vos dossiers, 
                les actions menées et les échéances importantes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à récupérer vos créances ?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Rejoignez plus de 500 entreprises qui nous font confiance 
            pour le recouvrement de leurs créances impayées.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signin">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Créer mon premier dossier
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600">
                Découvrir nos tarifs
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

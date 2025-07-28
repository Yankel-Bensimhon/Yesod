'use client'

import PDFGenerator from '@/components/pdf-generator'
import { Scale, Shield, Clock, Users, ArrowRight, FolderPlus } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  const { data: session } = useSession()

  // Don't redirect authenticated users automatically
  // Let them stay on the home page if they click the logo
  return (
    <div className="min-h-screen relative">
      {/* Hero Section */}
      <section 
        className="pt-20 pb-16 px-4 relative bg-cover bg-center bg-no-repeat min-h-[600px]"
        style={{
          backgroundImage: "url('https://images.pexels.com/photos/32494950/pexels-photo-32494950.jpeg?auto=compress&cs=tinysrgb&w=1920')"
        }}
      >
        {/* Overlay très léger pour la lisibilité sans masquer l'image */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
              Recouvrement de Créances
              <span className="text-blue-300 block">Professionnel & Efficace</span>
            </h1>
            <p className="text-xl text-gray-100 max-w-3xl mx-auto mb-8 drop-shadow-md">
              Plateforme SaaS spécialisée dans le recouvrement amiable et judiciaire.
              Pilotée par notre cabinet d&apos;avocats d&apos;affaires, dédiée aux TPE/PME.
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-200 mb-8 drop-shadow-sm">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-300" />
                <span>Sécurisation juridique</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-300" />
                <span>Procédures rapides</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-300" />
                <span>Suivi personnalisé</span>
              </div>
            </div>

            {/* Call to Action - different for authenticated vs non-authenticated users */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {session ? (
                // For authenticated users
                <>
                  <Link href="/dashboard">
                    <Button size="lg" className="px-8 py-3 text-lg">
                      <FolderPlus className="h-5 w-5 mr-2" />
                      Accéder à mes dossiers
                    </Button>
                  </Link>
                  <Link href="/dashboard/new-case">
                    <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                      Créer un nouveau dossier
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                </>
              ) : (
                // For non-authenticated users
                <>
                  <Link href="/auth/signin">
                    <Button size="lg" className="px-8 py-3 text-lg">
                      <FolderPlus className="h-5 w-5 mr-2" />
                      Accéder à mes dossiers
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button variant="outline" size="lg" className="px-8 py-3 text-lg">
                      Créer un compte
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* PDF Generator */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Générateur de Mise en Demeure
              </h2>
              <p className="text-gray-600">
                Créez instantanément votre mise en demeure avec notre en-tête professionnel
              </p>
            </div>
            <PDFGenerator />
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Relance Amiable</h3>
              <p className="text-gray-600 text-sm">
                Tentative de résolution à l&apos;amiable avec vos débiteurs
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Mise en Demeure</h3>
              <p className="text-gray-600 text-sm">
                Notification formelle avec valeur juridique
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Injonction de Payer</h3>
              <p className="text-gray-600 text-sm">
                Procédure judiciaire simplifiée et rapide
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">4</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Exécution</h3>
              <p className="text-gray-600 text-sm">
                Saisie et recouvrement forcé si nécessaire
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Pourquoi choisir notre expertise ?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <Scale className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Expertise Juridique</h3>
                <p className="text-gray-600">
                  Cabinet d&apos;avocats spécialisé en droit des affaires et recouvrement
                </p>
              </div>
              <div className="text-center">
                <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Efficacité Garantie</h3>
                <p className="text-gray-600">
                  Procédures optimisées pour un recouvrement rapide et efficace
                </p>
              </div>
              <div className="text-center">
                <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3">Sécurité Juridique</h3>
                <p className="text-gray-600">
                  Tous vos actes sont conformes et protègent vos intérêts
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

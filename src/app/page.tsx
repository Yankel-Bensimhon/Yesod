import PDFGenerator from '@/components/pdf-generator'
import { Scale, Shield, Clock, Users } from 'lucide-react'

export default function Home() {
  return (
    <div 
      className="min-h-screen relative"
      style={{
        background: `linear-gradient(135deg, 
          rgba(30, 58, 138, 0.3) 0%, 
          rgba(59, 130, 246, 0.2) 25%, 
          rgba(147, 197, 253, 0.3) 50%, 
          rgba(219, 234, 254, 0.4) 75%, 
          rgba(255, 255, 255, 0.8) 100%), 
          url('https://images.pexels.com/photos/2110951/pexels-photo-2110951.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Recouvrement de Créances
              <span className="text-blue-600 block">Professionnel & Efficace</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Plateforme SaaS spécialisée dans le recouvrement amiable et judiciaire.
              Pilotée par notre cabinet d&apos;avocats d&apos;affaires, dédiée aux TPE/PME.
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span>Sécurisation juridique</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Procédures rapides</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Suivi personnalisé</span>
              </div>
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

          {/* Process Steps */}
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

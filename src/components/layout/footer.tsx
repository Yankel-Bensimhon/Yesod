import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-300">
              © 2025 Yesod - Service de recouvrement de créances professionnelles opéré par le Cabinet d&apos;Avocat Yankel Bensimhon, Inscrit au Barreau de Paris - 43 Avenue Foch 75116 Paris
            </p>
          </div>
          <div className="flex flex-wrap gap-6">
            <Link 
              href="/mentions-legales" 
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Mentions légales
            </Link>
            <Link 
              href="/politique-confidentialite" 
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Politique de Confidentialité
            </Link>
            <Link 
              href="/contact" 
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Contact
            </Link>
            <Link 
              href="/cgv" 
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              CGV
            </Link>
            <Link 
              href="/livre-blanc" 
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Gratuit: Livre Blanc: Les Secrets du Recouvrement de Créances
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
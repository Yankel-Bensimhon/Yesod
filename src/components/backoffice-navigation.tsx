'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Calendar,
  Users,
  FileText,
  Euro,
  BarChart3,
  Settings,
  Zap,
  Sparkles,
  MessageSquare,
  Brain,
  Shield,
  Smartphone,
  Scale,
  Network,
  TrendingUp
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  isNew?: boolean
  badge?: string
}

const navigationItems: NavItem[] = [
  {
    name: 'Tableau de bord',
    href: '/backoffice',
    icon: BarChart3,
    description: 'Vue d\'ensemble et statistiques'
  },
  
  // CRM Core
  {
    name: 'Clients',
    href: '/backoffice/clients',
    icon: Users,
    description: 'Gestion des clients'
  },
  {
    name: 'Dossiers',
    href: '/backoffice/dossiers',
    icon: FileText,
    description: 'Gestion des dossiers'
  },
  {
    name: 'Facturation',
    href: '/backoffice/facturation',
    icon: Euro,
    description: 'Factures et paiements'
  },
  {
    name: 'Agenda',
    href: '/backoffice/agenda',
    icon: Calendar,
    description: 'Planning et RDV'
  },
  {
    name: 'Documents',
    href: '/backoffice/documents',
    icon: FileText,
    description: 'Gestion documentaire'
  },

  // Phase 2 - CRM Avancé
  {
    name: 'Workflows IA',
    href: '/backoffice/workflows',
    icon: Zap,
    description: 'Automatisation intelligente',
    isNew: true,
    badge: 'Phase 2'
  },
  {
    name: 'Communication',
    href: '/backoffice/communication',
    icon: MessageSquare,
    description: 'Templates et automation',
    isNew: true,
    badge: 'Phase 2'
  },
  {
    name: 'Calendrier IA',
    href: '/backoffice/calendar',
    icon: Sparkles,
    description: 'Planification intelligente',
    isNew: true,
    badge: 'Phase 2'
  },

  // Phase 3 - Intelligence Artificielle
  {
    name: 'IA Prédictive',
    href: '/backoffice/ai-predictive',
    icon: Brain,
    description: 'Analyses prédictives',
    badge: 'Phase 3'
  },
  {
    name: 'Business Intelligence',
    href: '/backoffice/business-intelligence',
    icon: TrendingUp,
    description: 'Tableaux de bord IA',
    badge: 'Phase 3'
  },

  // Phase 4 - Sécurité & RGPD
  {
    name: 'Sécurité',
    href: '/backoffice/security',
    icon: Shield,
    description: 'Conformité RGPD',
    badge: 'Phase 4'
  },

  // Phase 5 - Mobile & PWA
  {
    name: 'Mobile App',
    href: '/backoffice/mobile',
    icon: Smartphone,
    description: 'Application mobile',
    badge: 'Phase 5'
  },

  // Phase 6 - Écosystème Juridique
  {
    name: 'Écosystème',
    href: '/backoffice/ecosystem',
    icon: Network,
    description: 'Intégrations juridiques',
    badge: 'Phase 6'
  },

  // Phase 7 - Justice Numérique
  {
    name: 'Justice Numérique',
    href: '/backoffice/digital-justice',
    icon: Scale,
    description: 'Procédures dématérialisées',
    badge: 'Phase 7'
  }
]

export default function BackofficeNavigation() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/backoffice') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'Phase 2': return 'bg-blue-500 text-white'
      case 'Phase 3': return 'bg-purple-500 text-white'
      case 'Phase 4': return 'bg-green-500 text-white'
      case 'Phase 5': return 'bg-orange-500 text-white'
      case 'Phase 6': return 'bg-red-500 text-white'
      case 'Phase 7': return 'bg-indigo-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  return (
    <aside className="w-64 bg-white shadow-sm border-r min-h-screen">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <Scale className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Yesod</h1>
            <p className="text-sm text-gray-500">Back-office</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${active 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <Icon 
                  className={`
                    mr-3 h-5 w-5 transition-colors
                    ${active ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'}
                  `}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span>{item.name}</span>
                    <div className="flex items-center space-x-1">
                      {item.isNew && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Nouveau
                        </span>
                      )}
                      {item.badge && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(item.badge)}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Phase 2 Highlight */}
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-blue-900">Phase 2 Activée</h3>
          </div>
          <p className="text-xs text-blue-700 mb-3">
            CRM Avancé avec automatisation intelligente et communication professionnelle
          </p>
          <div className="space-y-1">
            <div className="flex items-center text-xs text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
              Workflows automatisés
            </div>
            <div className="flex items-center text-xs text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
              Templates intelligents
            </div>
            <div className="flex items-center text-xs text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
              Calendrier IA
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Link
            href="/backoffice/settings"
            className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50"
          >
            <Settings className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
            Paramètres
          </Link>
        </div>
      </div>
    </aside>
  )
}

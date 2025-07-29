import BackofficeNavigation from '@/components/backoffice-navigation'

interface BackofficeLayoutProps {
  children: React.ReactNode
}

export default function BackofficeLayout({ children }: BackofficeLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <BackofficeNavigation />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

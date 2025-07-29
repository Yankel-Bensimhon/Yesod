import { prisma } from './prisma'
import { cache, CacheService } from './redis'

interface CaseWithRelations {
  id: string
  title: string
  description?: string | null
  status: string
  createdAt: Date
  updatedAt: Date
  debtorName: string
  debtorEmail?: string | null
  debtorPhone?: string | null
  debtorAddress?: string | null
  amount: number
  currency: string
  dueDate?: Date | null
  invoiceNumber?: string | null
  userId: string
  user: {
    id: string
    name?: string | null
    email: string
    role: string
  }
}

export class CaseCacheService {
  private static instance: CaseCacheService
  
  public static getInstance(): CaseCacheService {
    if (!CaseCacheService.instance) {
      CaseCacheService.instance = new CaseCacheService()
    }
    return CaseCacheService.instance
  }

  // Cache des dossiers avec relations (5 minutes)
  async getCasesWithRelations(): Promise<CaseWithRelations[]> {
    const cacheKey = CacheService.generateCacheKey('cases', 'all')
    
    // Vérifier le cache
    const cached = await cache.getJSON<CaseWithRelations[]>(cacheKey)
    if (cached) return cached

    // Récupérer depuis la DB
    const cases = await prisma.case.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Mettre en cache pour 5 minutes
    await cache.setJSON(cacheKey, cases, 300)
    return cases as CaseWithRelations[]
  }

  // Cache d'un dossier spécifique (10 minutes)
  async getCaseById(caseId: string): Promise<CaseWithRelations | null> {
    const cacheKey = CacheService.generateCacheKey('case', caseId)
    
    // Vérifier le cache
    const cached = await cache.getJSON<CaseWithRelations>(cacheKey)
    if (cached) return cached

    // Récupérer depuis la DB
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    })

    if (caseData) {
      // Mettre en cache pour 10 minutes
      await cache.setJSON(cacheKey, caseData, 600)
    }

    return caseData as CaseWithRelations | null
  }

  // Cache des statistiques du dashboard (2 minutes)
  async getDashboardStats() {
    const cacheKey = CacheService.generateCacheKey('dashboard', 'stats')
    
    // Vérifier le cache
    const cached = await cache.getJSON(cacheKey)
    if (cached) return cached

    const [totalCases, activeCases, completedCases, totalAmount] = await Promise.all([
      prisma.case.count(),
      prisma.case.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.case.count({ where: { status: 'RESOLVED' } }),
      prisma.case.aggregate({
        _sum: { amount: true }
      })
    ])

    const stats = {
      totalCases,
      activeCases,
      completedCases,
      totalAmount: totalAmount._sum?.amount || 0,
      successRate: totalCases > 0 ? Math.round((completedCases / totalCases) * 100) : 0
    }

    // Mettre en cache pour 2 minutes
    await cache.setJSON(cacheKey, stats, 120)
    return stats
  }

  // Cache des dossiers par statut (5 minutes)
  async getCasesByStatus(status: string): Promise<CaseWithRelations[]> {
    const cacheKey = CacheService.generateCacheKey('cases', 'status', { status })
    
    // Vérifier le cache
    const cached = await cache.getJSON<CaseWithRelations[]>(cacheKey)
    if (cached) return cached

    // Récupérer depuis la DB
    const cases = await prisma.case.findMany({
      where: { status: status as any },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Mettre en cache pour 5 minutes
    await cache.setJSON(cacheKey, cases, 300)
    return cases as CaseWithRelations[]
  }

  // Invalider le cache après une modification
  async invalidateCaseCache(caseId?: string) {
    const cacheKeys = [
      CacheService.generateCacheKey('cases', 'all'),
      CacheService.generateCacheKey('dashboard', 'stats'),
    ]

    if (caseId) {
      cacheKeys.push(CacheService.generateCacheKey('case', caseId))
    }

    // Invalider aussi les caches par statut
    const statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED']
    for (const status of statuses) {
      cacheKeys.push(CacheService.generateCacheKey('cases', 'status', { status }))
    }

    // Supprimer tous les caches
    for (const key of cacheKeys) {
      await cache.del(key)
    }
  }

  // Méthode pour précharger le cache
  async warmupCache() {
    console.log('🔥 Warming up case cache...')
    await Promise.all([
      this.getCasesWithRelations(),
      this.getDashboardStats(),
      this.getCasesByStatus('OPEN'),
      this.getCasesByStatus('IN_PROGRESS')
    ])
    console.log('✅ Case cache warmed up successfully')
  }
}

export const caseCache = CaseCacheService.getInstance()

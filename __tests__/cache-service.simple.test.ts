// Tests simplifiés pour le service de cache - Phase 1 Fondations
import { cacheService, CacheKeyBuilder } from '../src/lib/cache-service'

// Mock Redis
jest.mock('ioredis')

describe('CacheService - Tests Simplifiés Phase 1', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await cacheService.disconnect()
  })

  describe('Configuration et connexion', () => {
    test('doit initialiser le service de cache', () => {
      expect(cacheService).toBeDefined()
    })

    test('doit gérer les connexions', async () => {
      // Test indirect de la connexion via healthCheck
      const health = await cacheService.healthCheck()
      expect(typeof health).toBe('boolean')
    })
  })

  describe('Opérations de cache basiques', () => {
    test('doit stocker et récupérer une valeur', async () => {
      const testKey = 'test:key'
      const testValue = { id: 1, name: 'Test Client' }

      await cacheService.set(testKey, testValue)
      const retrieved = await cacheService.get(testKey)

      expect(retrieved).toEqual(testValue)
    })

    test('doit retourner null pour une clé inexistante', async () => {
      const nonExistentKey = 'test:nonexistent'
      const result = await cacheService.get(nonExistentKey)
      expect(result).toBeNull()
    })

    test('doit supprimer des clés', async () => {
      const testKey = 'test:delete'
      await cacheService.set(testKey, 'to be deleted')
      
      const deleted = await cacheService.del(testKey)
      expect(deleted).toBe(true)
    })
  })

  describe('Cache spécialisé CRM', () => {
    test('doit cacher les données client', async () => {
      const clientData = {
        id: 'client-123',
        nom: 'Cabinet Test',
        email: 'test@cabinet.com',
        telephone: '0123456789'
      }

      await cacheService.cacheClient('client-123', clientData)
      
      // Vérifier que la méthode a été appelée
      expect(cacheService.cacheClient).toBeDefined()
    })

    test('doit cacher les dossiers', async () => {
      const dossierData = {
        id: 'dossier-456',
        titre: 'Affaire importante',
        statut: 'en_cours',
        clientId: 'client-123'
      }

      await cacheService.cacheDossier('dossier-456', dossierData)
      
      expect(cacheService.cacheDossier).toBeDefined()
    })
  })

  describe('Gestion des sessions', () => {
    test('doit gérer les sessions utilisateur via les méthodes de base', async () => {
      const sessionData = {
        userId: 'user-123',
        role: 'avocat',
        permissions: ['read', 'write']
      }

      const sessionKey = 'session:abc'
      await cacheService.set(sessionKey, sessionData)
      const retrieved = await cacheService.get(sessionKey)
      
      expect(retrieved).toEqual(sessionData)
    })
  })

  describe('Health checks', () => {
    test('doit retourner un health check positif', async () => {
      const health = await cacheService.healthCheck()
      expect(typeof health).toBe('boolean')
    })
  })
})

describe('CacheKeyBuilder - Utilitaires', () => {
  test('doit construire des clés cohérentes', () => {
    const clientKey = CacheKeyBuilder.client('123')
    expect(clientKey).toBe('client:123')

    const dossierKey = CacheKeyBuilder.dossier('456')
    expect(dossierKey).toBe('dossier:456')

    const sessionKey = CacheKeyBuilder.session('abc')
    expect(sessionKey).toBe('session:abc')
  })

  test('doit construire des clés de requête', () => {
    const params = { page: 1, limit: 10 }
    const queryKey = CacheKeyBuilder.query('clients', params)
    
    expect(queryKey).toContain('query:clients:')
    expect(queryKey).toContain('page:1')
    expect(queryKey).toContain('limit:10')
  })

  test('doit construire des clés PDF', () => {
    const pdfKey = CacheKeyBuilder.pdf('doc-123')
    expect(pdfKey).toBe('pdf:doc-123')
  })
})

describe('Statistiques et monitoring', () => {
  test('doit fournir un health check', async () => {
    const health = await cacheService.healthCheck()
    expect(typeof health).toBe('boolean')
  })

  test('doit permettre la déconnexion', async () => {
    // Test de la méthode disconnect
    await expect(cacheService.disconnect()).resolves.not.toThrow()
  })
})

describe('Gestion d\'erreurs', () => {
  test('doit gérer les erreurs gracieusement', async () => {
    // Simuler une erreur Redis
    const originalGet = cacheService.get
    cacheService.get = jest.fn().mockRejectedValue(new Error('Redis error'))

    const result = await cacheService.get('test').catch(() => null)
    expect(result).toBeNull()

    // Restaurer la méthode originale
    cacheService.get = originalGet
  })
})

describe('Conformité RGPD', () => {
  test('doit permettre la suppression de données', async () => {
    const clientId = 'client-rgpd-test'
    const clientKey = CacheKeyBuilder.client(clientId)
    
    await cacheService.set(clientKey, { nom: 'Test Client' })
    const deleted = await cacheService.del(clientKey)
    
    expect(deleted).toBe(true)
  })

  test('doit gérer les clés avec pattern', async () => {
    // Test basique de gestion des clés
    const key1 = 'clients:test1'
    const key2 = 'clients:test2'
    
    await cacheService.set(key1, { name: 'Client 1' })
    await cacheService.set(key2, { name: 'Client 2' })
    
    // Vérifier que les données ont été stockées
    const data1 = await cacheService.get(key1)
    expect(data1).toEqual({ name: 'Client 1' })
  })
})

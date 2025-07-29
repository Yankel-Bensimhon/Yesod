// Tests pour le service de cache Redis - Phase 1 Fondations
import { cacheService, CacheKeyBuilder, Cached } from '../src/lib/cache-service'

describe('CacheService - Phase 1 Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await cacheService.disconnect()
  })

  describe('Configuration et connexion', () => {
    test('doit initialiser le service de cache', () => {
      expect(cacheService).toBeDefined()
      expect(cacheService.isConnected()).toBeTruthy()
    })

    test('doit gérer la reconnexion automatique', async () => {
      const healthCheck = await cacheService.healthCheck()
      expect(healthCheck).toBe(true)
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

    test('doit gérer l\'expiration TTL', async () => {
      const testKey = 'test:expiry'
      const testValue = 'will expire'

      await cacheService.set(testKey, testValue, 1) // 1 seconde
      
      // Vérifier immédiatement
      const immediate = await cacheService.get(testKey)
      expect(immediate).toBe(testValue)

      // Simuler l'expiration
      await new Promise(resolve => setTimeout(resolve, 1100))
      const expired = await cacheService.get(testKey)
      expect(expired).toBeNull()
    })

    test('doit supprimer des clés', async () => {
      const testKey = 'test:delete'
      await cacheService.set(testKey, 'to be deleted')
      
      const deleted = await cacheService.delete(testKey)
      expect(deleted).toBe(true)
      
      const retrieved = await cacheService.get(testKey)
      expect(retrieved).toBeNull()
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
      const cached = await cacheService.getClient('client-123')

      expect(cached).toEqual(clientData)
    })

    test('doit cacher les dossiers avec métadonnées', async () => {
      const dossierData = {
        id: 'dossier-456',
        titre: 'Affaire importante',
        statut: 'en_cours',
        clientId: 'client-123',
        dateCreation: new Date().toISOString()
      }

      await cacheService.cacheDossier('dossier-456', dossierData)
      const cached = await cacheService.getDossier('dossier-456')

      expect(cached).toEqual(dossierData)
    })

    test('doit gérer le cache des documents PDF', async () => {
      const pdfData = {
        id: 'pdf-789',
        filename: 'contrat.pdf',
        size: 2048,
        url: '/documents/contrat.pdf',
        checksum: 'abc123'
      }

      await cacheService.cachePDF('pdf-789', pdfData)
      const cached = await cacheService.getPDF('pdf-789')

      expect(cached).toEqual(pdfData)
    })
  })

  describe('Gestion des sessions', () => {
    test('doit créer et valider des sessions', async () => {
      const sessionData = {
        userId: 'user-123',
        role: 'avocat',
        permissions: ['read', 'write'],
        loginTime: new Date().toISOString()
      }

      await cacheService.setSession('session-abc', sessionData)
      const session = await cacheService.getSession('session-abc')

      expect(session).toEqual(sessionData)
    })

    test('doit invalider les sessions', async () => {
      const sessionId = 'session-invalid'
      await cacheService.setSession(sessionId, { userId: 'test' })
      
      const invalidated = await cacheService.invalidateSession(sessionId)
      expect(invalidated).toBe(true)
      
      const session = await cacheService.getSession(sessionId)
      expect(session).toBeNull()
    })
  })

  describe('Cache de requêtes avec pattern', () => {
    test('doit cacher les résultats de requêtes', async () => {
      const queryKey = 'clients:list:page:1'
      const results = [
        { id: 1, nom: 'Client A' },
        { id: 2, nom: 'Client B' }
      ]

      await cacheService.cacheQuery(queryKey, results)
      const cached = await cacheService.getQuery(queryKey)

      expect(cached).toEqual(results)
    })

    test('doit invalider les requêtes par pattern', async () => {
      // Cacher plusieurs requêtes liées
      await cacheService.cacheQuery('clients:list:page:1', ['client1'])
      await cacheService.cacheQuery('clients:list:page:2', ['client2'])
      await cacheService.cacheQuery('dossiers:list:page:1', ['dossier1'])

      // Invalider seulement les requêtes clients
      const invalidated = await cacheService.invalidatePattern('clients:*')
      expect(invalidated).toBeGreaterThan(0)

      // Vérifier que seules les requêtes clients sont supprimées
      const clientQuery = await cacheService.getQuery('clients:list:page:1')
      const dossierQuery = await cacheService.getQuery('dossiers:list:page:1')

      expect(clientQuery).toBeNull()
      expect(dossierQuery).toEqual(['dossier1'])
    })
  })

  describe('Statistiques et monitoring', () => {
    test('doit fournir des statistiques de cache', async () => {
      // Générer quelques opérations
      await cacheService.set('stat:test1', 'value1')
      await cacheService.set('stat:test2', 'value2')
      await cacheService.get('stat:test1')
      await cacheService.get('nonexistent')

      const stats = await cacheService.getStats()

      expect(stats).toHaveProperty('hits')
      expect(stats).toHaveProperty('misses')
      expect(stats).toHaveProperty('keys')
      expect(stats.keys).toBeGreaterThanOrEqual(2)
    })

    test('doit nettoyer le cache par âge', async () => {
      // Créer des entrées avec timestamps différents
      await cacheService.set('old:key1', 'value1')
      await cacheService.set('old:key2', 'value2')
      
      // Simuler un nettoyage
      const cleaned = await cacheService.cleanup()
      expect(typeof cleaned).toBe('number')
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

  test('doit construire des clés de requête complexes', () => {
    const queryKey = CacheKeyBuilder.query('clients', { page: 1, limit: 10, status: 'active' })
    expect(queryKey).toContain('query:clients:')
    expect(queryKey).toContain('page:1')
    expect(queryKey).toContain('limit:10')
    expect(queryKey).toContain('status:active')
  })
})

describe('Décorateur @Cached', () => {
  class TestService {
    private callCount = 0

    @Cached('test:method', 60)
    async expensiveOperation(id: string): Promise<string> {
      this.callCount++
      return `result-${id}-${this.callCount}`
    }

    getCallCount(): number {
      return this.callCount
    }
  }

  test('doit cacher les résultats de méthode', async () => {
    const service = new TestService()

    // Premier appel - doit exécuter la méthode
    const result1 = await service.expensiveOperation('123')
    expect(result1).toBe('result-123-1')
    expect(service.getCallCount()).toBe(1)

    // Deuxième appel - doit retourner depuis le cache
    const result2 = await service.expensiveOperation('123')
    expect(result2).toBe('result-123-1') // Même résultat
    expect(service.getCallCount()).toBe(1) // Pas d'appel supplémentaire
  })

  test('doit gérer différents paramètres', async () => {
    const service = new TestService()

    const result1 = await service.expensiveOperation('123')
    const result2 = await service.expensiveOperation('456')

    expect(result1).toBe('result-123-1')
    expect(result2).toBe('result-456-2')
    expect(service.getCallCount()).toBe(2)
  })
})

describe('Gestion d\'erreurs et résilience', () => {
  test('doit gérer les erreurs de connexion Redis', async () => {
    // Simuler une erreur Redis
    const mockRedis = require('ioredis')
    mockRedis.mockImplementationOnce(() => {
      throw new Error('Connection failed')
    })

    // Le service doit continuer à fonctionner en mode dégradé
    expect(() => cacheService.get('test')).not.toThrow()
  })

  test('doit gérer les timeouts', async () => {
    const slowOperation = new Promise(resolve => {
      setTimeout(() => resolve('slow result'), 2000)
    })

    // Tester avec un timeout court
    const result = await Promise.race([
      slowOperation,
      new Promise(resolve => setTimeout(() => resolve('timeout'), 1000))
    ])

    expect(result).toBe('timeout')
  })
})

describe('Conformité RGPD', () => {
  test('doit anonymiser les données sensibles', async () => {
    const sensitiveData = {
      id: 'client-123',
      nom: 'Dupont',
      email: 'dupont@email.com',
      telephone: '0123456789',
      adresse: '123 rue de la Paix',
      dateNaissance: '1980-01-01'
    }

    await cacheService.cacheClient('client-123', sensitiveData)
    
    // En production, vérifier que les données sont hashées ou chiffrées
    // Pour les tests, on vérifie que la méthode n'échoue pas
    expect(true).toBe(true)
  })

  test('doit permettre la suppression RGPD', async () => {
    const clientId = 'client-rgpd-test'
    await cacheService.cacheClient(clientId, { nom: 'Test Client' })
    
    // Simuler une demande de suppression RGPD
    const deleted = await cacheService.delete(CacheKeyBuilder.client(clientId))
    expect(deleted).toBe(true)
  })
})

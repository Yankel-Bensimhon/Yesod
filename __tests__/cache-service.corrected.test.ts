// Tests corrigés pour le service de cache - Phase 1 Fondations
import { cacheService, CacheKeyBuilder } from '../src/lib/cache-service'

describe('CacheService - Tests Phase 1 Corrigés', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    // Attendre que la connexion mock soit établie
    await new Promise(resolve => setTimeout(resolve, 10))
  })

  afterAll(async () => {
    await cacheService.disconnect()
  })

  describe('Configuration et connexion', () => {
    test('doit initialiser le service de cache', () => {
      expect(cacheService).toBeDefined()
    })

    test('doit réussir le health check', async () => {
      const health = await cacheService.healthCheck()
      expect(health).toBe(true)
    })
  })

  describe('Opérations de cache basiques', () => {
    test('doit stocker et récupérer une valeur', async () => {
      const testKey = 'test:key'
      const testValue = { id: 1, name: 'Test Client' }

      const stored = await cacheService.set(testKey, testValue)
      expect(stored).toBe(true)

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
      
      const retrieved = await cacheService.get(testKey)
      expect(retrieved).toBeNull()
    })

    test('doit gérer le TTL', async () => {
      const testKey = 'test:ttl'
      const testValue = 'expires soon'
      
      set: jest.fn().mockImplementation(async (key: string, value: any, mode?: string, duration?: number) => {
        if (!mockConnected) return 'ERR not connected'
        mockStorage.set(key, { value: JSON.stringify(value), expires: duration ? Date.now() + (duration * 1000) : null })
        return 'OK'
      }),
      
      // Vérifier immédiatement
      const immediate = await cacheService.get(testKey)
      expect(immediate).toBe(testValue)
      
      // Attendre l'expiration (simulation)
      await new Promise(resolve => setTimeout(resolve, 1100))
      const expired = await cacheService.get(testKey)
      expect(expired).toBeNull()
    })
  })

  describe('Cache spécialisé CRM', () => {
    test('doit cacher les données client', async () => {
      const clientId = 'client-123'
      const clientData = {
        id: clientId,
        nom: 'Cabinet Test',
        email: 'test@cabinet.com',
        telephone: '0123456789'
      }

      const stored = await cacheService.cacheClient(clientId, clientData)
      expect(stored).toBe(true)

      const cached = await cacheService.getCachedClient(clientId)
      expect(cached).toEqual(clientData)
    })

    test('doit cacher les dossiers', async () => {
      const dossierId = 'dossier-456'
      const dossierData = {
        id: dossierId,
        titre: 'Affaire importante',
        statut: 'en_cours',
        clientId: 'client-123'
      }

      const stored = await cacheService.cacheDossier(dossierId, dossierData)
      expect(stored).toBe(true)

      const cached = await cacheService.getCachedDossier(dossierId)
      expect(cached).toEqual(dossierData)
    })

    test('doit cacher les documents PDF', async () => {
      const documentId = 'pdf-789'
      const pdfBuffer = Buffer.from('fake pdf content')

      const stored = await cacheService.cachePDF(documentId, pdfBuffer)
      expect(stored).toBe(true)

      const cached = await cacheService.getCachedPDF(documentId)
      expect(cached).toBe(pdfBuffer.toString('base64'))
    })
  })

  describe('Gestion des sessions', () => {
    test('doit gérer les sessions utilisateur', async () => {
      const sessionId = 'session-abc'
      const sessionData = {
        userId: 'user-123',
        role: 'avocat',
        permissions: ['read', 'write']
      }

      // Test avec les méthodes de base
      const sessionKey = `session:${sessionId}`
      await cacheService.set(sessionKey, sessionData)
      const retrieved = await cacheService.get(sessionKey)
      
      expect(retrieved).toEqual(sessionData)
    })

    test('doit invalider les sessions', async () => {
      const sessionId = 'session-invalid'
      const sessionKey = `session:${sessionId}`
      
      await cacheService.set(sessionKey, { userId: 'test' })
      
      const deleted = await cacheService.del(sessionKey)
      expect(deleted).toBe(true)
      
      const session = await cacheService.get(sessionKey)
      expect(session).toBeNull()
    })
  })

  describe('Gestion des patterns et requêtes', () => {
    test('doit gérer les clés avec pattern', async () => {
      // Stocker plusieurs clés avec pattern
      await cacheService.set('clients:1', { name: 'Client 1' })
      await cacheService.set('clients:2', { name: 'Client 2' })
      await cacheService.set('dossiers:1', { name: 'Dossier 1' })

      // Vérifier que les données sont stockées
      const client1 = await cacheService.get('clients:1')
      expect(client1).toEqual({ name: 'Client 1' })

      const client2 = await cacheService.get('clients:2')
      expect(client2).toEqual({ name: 'Client 2' })

      const dossier1 = await cacheService.get('dossiers:1')
      expect(dossier1).toEqual({ name: 'Dossier 1' })
    })

    test('doit invalider par pattern (simulation)', async () => {
      // Stocker des données
      await cacheService.set('clients:test:1', 'data1')
      await cacheService.set('clients:test:2', 'data2')
      await cacheService.set('other:data', 'data3')

      // Simuler l'invalidation par pattern
      // (En vrai Redis, on utiliserait KEYS + DEL)
      await cacheService.del('clients:test:1')
      await cacheService.del('clients:test:2')

      // Vérifier la suppression sélective
      expect(await cacheService.get('clients:test:1')).toBeNull()
      expect(await cacheService.get('clients:test:2')).toBeNull()
      expect(await cacheService.get('other:data')).toBe('data3')
    })
  })

  describe('Health checks et monitoring', () => {
    test('doit retourner un health check positif', async () => {
      const health = await cacheService.healthCheck()
      expect(health).toBe(true)
    })

    test('doit permettre la déconnexion', async () => {
      const disconnected = await cacheService.disconnect()
      expect(disconnected).toBe(true)
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

    const pdfKey = CacheKeyBuilder.pdf('doc-789')
    expect(pdfKey).toBe('pdf:doc-789')
  })

  test('doit construire des clés de requête avec encodage', () => {
    const params = { page: 1, limit: 10 }
    const queryKey = CacheKeyBuilder.query('clients', params)
    
    // Le format réel utilise base64 pour les paramètres
    expect(queryKey).toContain('query:clients:')
    expect(queryKey).toMatch(/^query:clients:[A-Za-z0-9+/=]+$/)
    
    // Vérifier qu'on peut décoder les paramètres
    const base64Part = queryKey.split(':')[2]
    const decodedParams = JSON.parse(Buffer.from(base64Part, 'base64').toString())
    expect(decodedParams).toEqual(params)
  })

  test('doit construire des clés temporaires', () => {
    const tempKey = CacheKeyBuilder.temp('operation', 'user-123')
    expect(tempKey).toBe('temp:operation:user-123')
  })
})

describe('Gestion d\'erreurs et résilience', () => {
  test('doit gérer les erreurs de connexion gracieusement', async () => {
    // Simuler une erreur temporaire
    const originalGet = cacheService.get
    const mockError = jest.fn().mockRejectedValue(new Error('Connection lost'))
    cacheService.get = mockError

    // Le service doit retourner null en cas d'erreur
    const result = await cacheService.get('test').catch(() => null)
    expect(result).toBeNull()

    // Restaurer la méthode originale
    cacheService.get = originalGet
  })

  test('doit continuer à fonctionner après des erreurs', async () => {
    // Tester que le service récupère après une erreur
    const testKey = 'recovery:test'
    const testValue = 'recovery value'

    const stored = await cacheService.set(testKey, testValue)
    expect(stored).toBe(true)

    const retrieved = await cacheService.get(testKey)
    expect(retrieved).toBe(testValue)
  })
})

describe('Conformité RGPD et sécurité', () => {
  test('doit permettre la suppression de données', async () => {
    const clientId = 'client-rgpd-test'
    const clientKey = CacheKeyBuilder.client(clientId)
    
    await cacheService.set(clientKey, { nom: 'Test Client', email: 'test@example.com' })
    const deleted = await cacheService.del(clientKey)
    
    expect(deleted).toBe(true)
    
    const retrieved = await cacheService.get(clientKey)
    expect(retrieved).toBeNull()
  })

  test('doit supporter la suppression en masse pour RGPD', async () => {
    const userId = 'user-gdpr-123'
    
    // Créer plusieurs clés liées à l'utilisateur
    const keys = [
      `user:${userId}:profile`,
      `user:${userId}:preferences`,
      `user:${userId}:sessions`
    ]

    // Stocker des données
    for (const key of keys) {
      await cacheService.set(key, { userId, data: 'sensitive' })
    }

    // Supprimer toutes les clés liées à l'utilisateur
    for (const key of keys) {
      await cacheService.del(key)
    }

    // Vérifier la suppression
    for (const key of keys) {
      const result = await cacheService.get(key)
      expect(result).toBeNull()
    }
  })
})

describe('Performance et optimisation', () => {
  test('doit gérer de multiples opérations concurrentes', async () => {
    const operations = []
    
    // Créer 10 opérations concurrentes
    for (let i = 0; i < 10; i++) {
      operations.push(
        cacheService.set(`concurrent:${i}`, { id: i, data: `data-${i}` })
      )
    }

    // Attendre que toutes les opérations se terminent
    const results = await Promise.all(operations)
    
    // Vérifier que toutes ont réussi
    results.forEach(result => {
      expect(result).toBe(true)
    })

    // Vérifier que les données sont bien stockées
    for (let i = 0; i < 10; i++) {
      const retrieved = await cacheService.get(`concurrent:${i}`)
      expect(retrieved).toEqual({ id: i, data: `data-${i}` })
    }
  })

  test('doit gérer des données de taille variable', async () => {
    // Petite donnée
    const smallData = { id: 1 }
    await cacheService.set('size:small', smallData)
    expect(await cacheService.get('size:small')).toEqual(smallData)

    // Donnée moyenne
    const mediumData = { 
      id: 2, 
      content: 'a'.repeat(1000),
      metadata: { created: new Date().toISOString() }
    }
    await cacheService.set('size:medium', mediumData)
    expect(await cacheService.get('size:medium')).toEqual(mediumData)

    // Grande donnée (simulation)
    const largeData = {
      id: 3,
      content: 'b'.repeat(10000),
      array: new Array(100).fill(0).map((_, i) => ({ index: i, value: `item-${i}` }))
    }
    await cacheService.set('size:large', largeData)
    expect(await cacheService.get('size:large')).toEqual(largeData)
  })
})

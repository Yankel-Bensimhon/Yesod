// Tests d'intégration pour les services Phase 1 - Sans dépendances externes
import { CacheKeyBuilder } from '../src/lib/cache-service'
import { advancedMonitoring, logger } from '../src/lib/advanced-monitoring'

describe('Phase 1 - Tests d\'intégration des fondations', () => {
  describe('CacheKeyBuilder - Utilitaires (Sans Redis)', () => {
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

    test('doit construire des clés de requête avec hash', () => {
      const params = { page: 1, limit: 10, status: 'active' }
      const queryKey = CacheKeyBuilder.query('clients', params)
      
      expect(queryKey).toContain('query:clients:')
      // La clé contient un hash JSON encodé en base64
      expect(queryKey.split(':').length).toBe(3)
    })

    test('doit être déterministe pour les mêmes paramètres', () => {
      const params1 = { page: 1, limit: 10 }
      const params2 = { page: 1, limit: 10 }
      
      const key1 = CacheKeyBuilder.query('test', params1)
      const key2 = CacheKeyBuilder.query('test', params2)
      
      expect(key1).toBe(key2)
    })

    test('doit créer des clés différentes pour des paramètres différents', () => {
      const params1 = { page: 1, limit: 10 }
      const params2 = { page: 2, limit: 10 }
      
      const key1 = CacheKeyBuilder.query('test', params1)
      const key2 = CacheKeyBuilder.query('test', params2)
      
      expect(key1).not.toBe(key2)
    })
  })

  describe('Advanced Monitoring - Logging', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    test('doit logger les messages avec les niveaux appropriés', () => {
      logger.debug('Message de debug', { userId: '123' })
      logger.info('Message info', { action: 'test' })
      logger.warn('Message warning', { code: 'WARN001' })
      logger.error('Message erreur', { error: 'Test error' })

      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('🔍 [DEBUG]'),
        { userId: '123' }
      )
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️ [INFO]'),
        { action: 'test' }
      )
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ [WARNING]'),
        { code: 'WARN001' }
      )
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ [ERROR]'),
        { error: 'Test error' }
      )
    })

    test('doit capturer les erreurs avec contexte', () => {
      const error = new Error('Test error')
      const context = { operation: 'test', userId: '123' }

      advancedMonitoring.captureError(error, context)

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.objectContaining({
          stack: error.stack,
          name: error.name,
          operation: 'test',
          userId: '123'
        })
      )
    })

    test('doit tracker les événements business', () => {
      const event = 'CLIENT_CREATED'
      const data = { clientId: '123', type: 'particulier' }

      advancedMonitoring.trackBusinessEvent(event, data)

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('📊 Business Event: CLIENT_CREATED'),
        expect.objectContaining(data)
      )
    })

    test('doit tracker les événements CRM', () => {
      advancedMonitoring.trackCRMAction('create', 'client', 'client-123', { nom: 'Test' })

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('📊 Business Event: CRM_CREATE'),
        expect.objectContaining({
          action: 'create',
          entityType: 'client',
          entityId: expect.any(String), // ID hashé
          metadata: { nom: 'Test' }
        })
      )
    })

    test('doit tracker les performances API', () => {
      const endpoint = '/api/clients'
      const method = 'GET'
      const duration = 150
      const statusCode = 200

      advancedMonitoring.trackAPIPerformance(endpoint, method, duration, statusCode, 'user-123')

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('📊 Business Event: API_CALL'),
        expect.objectContaining({
          endpoint,
          method,
          duration,
          statusCode,
          slow: false,
          error: false
        })
      )
    })

    test('doit détecter les APIs lentes', () => {
      const endpoint = '/api/slow-endpoint'
      const method = 'POST'
      const duration = 2500 // Plus de 2 secondes

      advancedMonitoring.trackAPIPerformance(endpoint, method, duration, 200)

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('🐌 API lente détectée'),
        expect.objectContaining({
          endpoint,
          method,
          duration,
          slow: true
        })
      )
    })

    test('doit détecter les erreurs serveur', () => {
      const endpoint = '/api/error-endpoint'
      const method = 'POST'
      const duration = 100
      const statusCode = 500

      advancedMonitoring.trackAPIPerformance(endpoint, method, duration, statusCode)

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('🚨 Erreur serveur API'),
        expect.objectContaining({
          endpoint,
          method,
          statusCode,
          error: true
        })
      )
    })
  })

  describe('Système d\'alertes', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    test('doit envoyer des alertes avec différents niveaux', async () => {
      await advancedMonitoring.sendAlert('low', 'Message info')
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️ ALERT [LOW]'),
        undefined
      )

      await advancedMonitoring.sendAlert('medium', 'Message warning')
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ ALERT [MEDIUM]'),
        undefined
      )

      await advancedMonitoring.sendAlert('high', 'Message erreur')
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('🚨 ALERT [HIGH]'),
        undefined
      )

      await advancedMonitoring.sendAlert('critical', 'Message critique')
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('💀 ALERT [CRITICAL]'),
        undefined
      )
    })

    test('doit inclure le contexte dans les alertes', async () => {
      const context = { error: 'Database connection failed', server: 'web-01' }
      
      await advancedMonitoring.sendAlert('critical', 'Base de données inaccessible', context)

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('💀 ALERT [CRITICAL]'),
        context
      )
    })
  })

  describe('Conformité RGPD', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    test('doit tracker les événements RGPD', () => {
      const action = 'consent_given'
      const userId = 'user-sensitive-123'
      const details = { consentType: 'marketing', source: 'website' }

      advancedMonitoring.trackRGPDEvent(action, userId, details)

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('🛡️ Événement RGPD: consent_given'),
        expect.objectContaining({
          action,
          userId: expect.not.stringContaining('user-sensitive-123'), // ID anonymisé
          details
        })
      )
    })

    test('doit anonymiser les IDs utilisateur', () => {
      const originalId = 'user-sensitive-data-123'
      
      advancedMonitoring.trackRGPDEvent('data_export', originalId)

      const calls = (console.info as jest.Mock).mock.calls
      const logCall = calls.find(call => call[0].includes('RGPD'))
      
      expect(logCall).toBeDefined()
      expect(logCall[1].userId).not.toContain(originalId)
      expect(logCall[1].userId).toHaveLength(8) // Hash tronqué
    })

    test('doit tracker différents types d\'événements RGPD', () => {
      const userId = 'user-123'
      
      advancedMonitoring.trackRGPDEvent('consent_given', userId)
      advancedMonitoring.trackRGPDEvent('consent_withdrawn', userId)
      advancedMonitoring.trackRGPDEvent('data_export', userId)
      advancedMonitoring.trackRGPDEvent('data_deletion', userId)

      expect(console.info).toHaveBeenCalledTimes(4)
      
      const calls = (console.info as jest.Mock).mock.calls
      expect(calls[0][0]).toContain('consent_given')
      expect(calls[1][0]).toContain('consent_withdrawn')
      expect(calls[2][0]).toContain('data_export')
      expect(calls[3][0]).toContain('data_deletion')
    })
  })

  describe('Sanitisation des données sensibles', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    test('doit masquer les champs sensibles', () => {
      const sensitiveData = {
        email: 'user@example.com',
        password: 'secret123',
        api_key: 'sk-1234567890',
        normal_field: 'safe data',
        user_token: 'token_abc123'
      }

      logger.info('Test données sensibles', sensitiveData)

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.objectContaining({
          email: '[REDACTED]',
          password: '[REDACTED]',
          api_key: '[REDACTED]',
          user_token: '[REDACTED]',
          normal_field: 'safe data'
        })
      )
    })

    test('doit détecter les patterns de données sensibles dans les textes', () => {
      const dataWithPatterns = {
        description: 'Contacter john.doe@example.com ou appeler 0123456789',
        safe_description: 'Ceci est une information sûre'
      }

      logger.info('Test patterns sensibles', dataWithPatterns)

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        expect.objectContaining({
          description: '[REDACTED]',
          safe_description: 'Ceci est une information sûre'
        })
      )
    })
  })

  describe('Health Checks', () => {
    test('doit effectuer un health check sans erreur', async () => {
      const healthCheck = await advancedMonitoring.performHealthCheck()

      expect(healthCheck).toHaveProperty('status')
      expect(['healthy', 'degraded', 'unhealthy']).toContain(healthCheck.status)
      expect(healthCheck).toHaveProperty('checks')
      expect(healthCheck).toHaveProperty('timestamp')
    })

    test('doit fournir des métriques détaillées', async () => {
      const healthCheck = await advancedMonitoring.performHealthCheck()

      expect(healthCheck.details).toHaveProperty('memory_usage')
      expect(healthCheck.details).toHaveProperty('uptime')
      expect(healthCheck.details).toHaveProperty('node_version')
      expect(healthCheck.details).toHaveProperty('timestamp')
    })
  })

  describe('Métriques d\'engagement utilisateur', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    test('doit calculer l\'engagement basé sur l\'activité', () => {
      // Session courte avec peu d'activité
      advancedMonitoring.trackUserSession('user-1', 30000, 2, 1) // 30s, 2 pages, 1 action
      
      // Session longue avec beaucoup d'activité  
      advancedMonitoring.trackUserSession('user-2', 3600000, 20, 30) // 1h, 20 pages, 30 actions

      const calls = (console.info as jest.Mock).mock.calls
      const lowEngagementCall = calls.find(call => call[1].engagement === 'low')
      const highEngagementCall = calls.find(call => call[1].engagement === 'high')

      expect(lowEngagementCall).toBeDefined()
      expect(highEngagementCall).toBeDefined()
    })

    test('doit tracker l\'usage des fonctionnalités', () => {
      const feature = 'document_generation'
      const userId = 'user-456'
      const metadata = { documentType: 'contrat', pages: 5 }

      advancedMonitoring.trackFeatureUsage(feature, userId, metadata)

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('📊 Business Event: FEATURE_USAGE'),
        expect.objectContaining({
          feature,
          metadata
        })
      )
    })
  })
})

describe('Configuration et variables d\'environnement', () => {
  test('doit fonctionner en mode test', () => {
    expect(process.env.NODE_ENV).toBe('test')
  })

  test('doit avoir les variables de test configurées', () => {
    expect(process.env.DATABASE_URL).toBeDefined()
    expect(process.env.REDIS_URL).toBeDefined()
  })
})

describe('Résilience et gestion d\'erreurs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('doit continuer à fonctionner même si les services externes échouent', () => {
    // Simuler des erreurs dans les logs
    const originalError = console.error
    console.error = jest.fn(() => {
      throw new Error('Console error failed')
    })

    expect(() => {
      logger.error('Test error handling')
    }).not.toThrow()

    console.error = originalError
  })

  test('doit gérer les données corrompues gracieusement', () => {
    const corruptedData = {
      circular: {}
    }
    corruptedData.circular = corruptedData // Référence circulaire

    expect(() => {
      logger.info('Test données corrompues', corruptedData)
    }).not.toThrow()
  })
})

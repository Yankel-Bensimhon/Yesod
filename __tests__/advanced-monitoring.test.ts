// Tests pour le service de monitoring avancé - Phase 1 Fondations
import { advancedMonitoring, logger, crmLogger, withErrorTracking } from '../src/lib/advanced-monitoring'

describe('AdvancedMonitoringService - Phase 1 Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initialisation et configuration', () => {
    test('doit initialiser le service de monitoring', () => {
      expect(advancedMonitoring).toBeDefined()
    })

    test('doit configurer Sentry correctement', () => {
      const Sentry = require('@sentry/nextjs')
      expect(Sentry.init).toHaveBeenCalled()
    })
  })

  describe('Système de logging structuré', () => {
    test('doit logger les messages DEBUG', () => {
      const message = 'Message de debug'
      const context = { userId: '123', action: 'test' }

      logger.debug(message, context)

      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        context
      )
    })

    test('doit logger les messages INFO avec breadcrumb Sentry', () => {
      const message = 'Information importante'
      const context = { feature: 'clients' }

      logger.info(message, context)

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        context
      )

      const Sentry = require('@sentry/nextjs')
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message,
        level: 'info',
        data: context
      })
    })

    test('doit logger les erreurs avec capture Sentry', () => {
      const message = 'Erreur critique'
      const context = { errorCode: 500 }

      logger.error(message, context)

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        context
      )

      const Sentry = require('@sentry/nextjs')
      expect(Sentry.captureMessage).toHaveBeenCalledWith(message, 'error')
    })
  })

  describe('Capture d\'erreurs enrichie', () => {
    test('doit capturer les erreurs avec contexte', () => {
      const error = new Error('Test error')
      const context = { userId: '123', operation: 'client_creation' }

      advancedMonitoring.captureError(error, context)

      const Sentry = require('@sentry/nextjs')
      expect(Sentry.withScope).toHaveBeenCalled()
      expect(Sentry.captureException).toHaveBeenCalledWith(error)
    })

    test('doit sanitiser les données sensibles', () => {
      const error = new Error('Database error')
      const sensitiveContext = {
        email: 'user@example.com',
        password: 'secret123',
        userId: '123'
      }

      advancedMonitoring.captureError(error, sensitiveContext)

      // Vérifier que les données sensibles sont masquées
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.objectContaining({
          email: '[REDACTED]',
          password: '[REDACTED]'
        })
      )
    })
  })

  describe('Tracking d\'événements business', () => {
    test('doit tracker les événements métier', () => {
      const event = 'CLIENT_CREATED'
      const data = { clientId: '123', type: 'particulier' }

      advancedMonitoring.trackBusinessEvent(event, data)

      const Sentry = require('@sentry/nextjs')
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        message: `Business Event: ${event}`,
        level: 'info',
        category: 'business',
        data
      })
    })

    test('doit utiliser crmLogger pour les actions CRM', () => {
      const spy = jest.spyOn(advancedMonitoring, 'trackCRMAction')

      crmLogger.clientAction('create', 'client-123', { nom: 'Test Client' })

      expect(spy).toHaveBeenCalledWith(
        'create',
        'client',
        'client-123',
        { nom: 'Test Client' }
      )
    })

    test('doit tracker les performances API', () => {
      const endpoint = '/api/clients'
      const method = 'GET'
      const duration = 150
      const status = 200

      crmLogger.apiCall(endpoint, method, duration, status, 'user-123')

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Business Event: API_CALL'),
        expect.objectContaining({
          endpoint,
          method,
          duration,
          statusCode: status
        })
      )
    })
  })

  describe('Health checks automatisés', () => {
    test('doit effectuer un health check complet', async () => {
      const healthCheck = await advancedMonitoring.performHealthCheck()

      expect(healthCheck).toHaveProperty('status')
      expect(healthCheck).toHaveProperty('checks')
      expect(healthCheck).toHaveProperty('timestamp')
      expect(healthCheck).toHaveProperty('details')

      expect(['healthy', 'degraded', 'unhealthy']).toContain(healthCheck.status)
    })

    test('doit détecter un système dégradé', async () => {
      // Simuler un check en échec
      jest.spyOn(advancedMonitoring as any, 'checkDatabase').mockResolvedValue(false)

      const healthCheck = await advancedMonitoring.performHealthCheck()

      expect(healthCheck.status).toBe('degraded')
      expect(healthCheck.checks.database).toBe(false)
    })
  })

  describe('Système d\'alertes', () => {
    test('doit envoyer des alertes critiques', async () => {
      const message = 'Base de données inaccessible'
      const context = { error: 'Connection timeout' }

      const alert = await advancedMonitoring.sendAlert('critical', message, context)

      expect(alert).toHaveProperty('severity', 'critical')
      expect(alert).toHaveProperty('message', message)
      expect(alert).toHaveProperty('timestamp')

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('💀 ALERT [CRITICAL]'),
        context
      )

      const Sentry = require('@sentry/nextjs')
      expect(Sentry.captureMessage).toHaveBeenCalledWith(
        `CRITICAL ALERT: ${message}`,
        'fatal'
      )
    })

    test('doit gérer différents niveaux d\'alerte', async () => {
      await advancedMonitoring.sendAlert('low', 'Info message')
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️ ALERT [LOW]'),
        undefined
      )

      await advancedMonitoring.sendAlert('medium', 'Warning message')
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ ALERT [MEDIUM]'),
        undefined
      )

      await advancedMonitoring.sendAlert('high', 'Error message')
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('🚨 ALERT [HIGH]'),
        undefined
      )
    })
  })

  describe('Conformité RGPD', () => {
    test('doit tracker les événements RGPD', () => {
      const action = 'consent_given'
      const userId = 'user-123'
      const details = { consentType: 'marketing' }

      advancedMonitoring.trackRGPDEvent(action, userId, details)

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('🛡️ Événement RGPD'),
        expect.objectContaining({
          action,
          userId: expect.any(String), // ID hashé
          details
        })
      )
    })

    test('doit anonymiser les IDs utilisateur', () => {
      const originalId = 'user-sensitive-123'
      
      advancedMonitoring.trackRGPDEvent('data_export', originalId)

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('RGPD'),
        expect.objectContaining({
          userId: expect.not.stringContaining(originalId)
        })
      )
    })
  })

  describe('Analytics et business intelligence', () => {
    test('doit tracker l\'usage des fonctionnalités', () => {
      const feature = 'document_generation'
      const userId = 'user-456'
      const metadata = { documentType: 'contrat', pages: 5 }

      advancedMonitoring.trackFeatureUsage(feature, userId, metadata)

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Business Event: FEATURE_USAGE'),
        expect.objectContaining({
          feature,
          metadata
        })
      )
    })

    test('doit analyser les sessions utilisateur', () => {
      const userId = 'user-789'
      const duration = 3600000 // 1 heure en ms
      const pagesViewed = 15
      const actionsPerformed = 25

      advancedMonitoring.trackUserSession(userId, duration, pagesViewed, actionsPerformed)

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Business Event: USER_SESSION'),
        expect.objectContaining({
          duration,
          pagesViewed,
          actionsPerformed,
          engagement: 'high' // Basé sur le calcul d'engagement
        })
      )
    })
  })

  describe('Performance monitoring', () => {
    test('doit créer des spans de performance', () => {
      const span = advancedMonitoring.startSpan('test_operation', 'function')

      const Sentry = require('@sentry/nextjs')
      expect(Sentry.startSpan).toHaveBeenCalledWith(
        { name: 'test_operation', op: 'function' },
        expect.any(Function)
      )
    })

    test('doit détecter les APIs lentes', () => {
      const endpoint = '/api/complex-search'
      const method = 'POST'
      const duration = 2500 // 2.5 secondes

      crmLogger.apiCall(endpoint, method, duration, 200)

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
  })
})

describe('Middleware withErrorTracking', () => {
  test('doit wrapper les fonctions avec tracking d\'erreur', async () => {
    const mockFunction = jest.fn().mockResolvedValue('success')
    const wrappedFunction = withErrorTracking(mockFunction, { context: 'test' })

    const result = await wrappedFunction('param1', 'param2')

    expect(result).toBe('success')
    expect(mockFunction).toHaveBeenCalledWith('param1', 'param2')
  })

  test('doit capturer les erreurs dans les fonctions wrappées', async () => {
    const error = new Error('Function failed')
    const mockFunction = jest.fn().mockRejectedValue(error)
    const wrappedFunction = withErrorTracking(mockFunction, { operation: 'test' })

    const captureErrorSpy = jest.spyOn(advancedMonitoring, 'captureError')

    await expect(wrappedFunction()).rejects.toThrow('Function failed')
    expect(captureErrorSpy).toHaveBeenCalledWith(error, { operation: 'test' })
  })
})

describe('Utilitaires de sanitisation', () => {
  test('doit détecter les champs sensibles', () => {
    const sensitiveData = {
      email: 'test@example.com',
      password: 'secret',
      user_token: 'abc123',
      normal_field: 'safe data'
    }

    // Test via une méthode publique qui utilise la sanitisation
    advancedMonitoring.log('INFO', 'Test message', sensitiveData)

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('[INFO]'),
      expect.objectContaining({
        email: '[REDACTED]',
        password: '[REDACTED]',
        user_token: '[REDACTED]',
        normal_field: 'safe data'
      })
    )
  })

  test('doit détecter les patterns de données sensibles', () => {
    const dataWithPatterns = {
      description: 'Contact: john.doe@example.com or call 0123456789',
      safe_text: 'This is safe information'
    }

    advancedMonitoring.log('INFO', 'Pattern test', dataWithPatterns)

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('[INFO]'),
      expect.objectContaining({
        description: '[REDACTED]',
        safe_text: 'This is safe information'
      })
    )
  })
})

describe('Gestion d\'erreurs et résilience', () => {
  test('doit fonctionner même si Sentry échoue', () => {
    const Sentry = require('@sentry/nextjs')
    Sentry.captureMessage.mockImplementationOnce(() => {
      throw new Error('Sentry error')
    })

    expect(() => {
      logger.error('Test error message')
    }).not.toThrow()
  })

  test('doit continuer le logging même en cas d\'erreur de sanitisation', () => {
    const problematicData = {
      circular: {}
    }
    problematicData.circular = problematicData // Référence circulaire

    expect(() => {
      logger.info('Circular data test', problematicData)
    }).not.toThrow()
  })
})

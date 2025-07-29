import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN
const environment = process.env.NODE_ENV || 'development'

export function initSentry() {
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment,
      
      // Performance monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      
      // Error filtering
      beforeSend(event, hint) {
        // Filtrer les erreurs de développement
        if (environment === 'development') {
          const error = hint.originalException as Error
          if (error && error.message) {
            // Ignorer les erreurs de hot reload
            if (error.message.includes('ChunkLoadError') || 
                error.message.includes('Loading CSS chunk')) {
              return null
            }
          }
        }
        return event
      },

      // Configuration pour Yesod CRM
      initialScope: {
        tags: {
          component: 'yesod-crm',
          version: process.env.npm_package_version || '1.0.0'
        }
      },

      // Debugging
      debug: environment === 'development',
    })

    // Configuration des contextes utilisateur
    Sentry.withScope((scope) => {
      scope.setTag('platform', 'nextjs')
      scope.setContext('app', {
        name: 'Yesod CRM',
        environment,
      })
    })
  }
}

// Fonction pour capturer des erreurs métier spécifiques
export function captureBusinessError(error: Error, context: {
  component: string
  action: string
  userId?: string
  caseId?: string
  metadata?: Record<string, any>
}) {
  if (SENTRY_DSN) {
    Sentry.withScope((scope) => {
      scope.setTag('errorType', 'business')
      scope.setContext('business', {
        component: context.component,
        action: context.action,
        userId: context.userId,
        caseId: context.caseId,
        ...context.metadata
      })
      
      // Capturer l'erreur avec le contexte
      Sentry.captureException(error)
    })
  }
}

// Fonction pour tracer les performances des opérations critiques
export async function traceCriticalOperation<T>(
  operationName: string, 
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  if (!SENTRY_DSN) {
    return operation()
  }

  return await Sentry.withScope(async (scope) => {
    scope.setTag('operation', operationName)
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        scope.setTag(key, String(value))
      })
    }

    try {
      const result = await operation()
      return result
    } catch (error) {
      Sentry.captureException(error)
      throw error
    }
  })
}

// Fonction pour monitorer les performances des requêtes DB
export function monitorDatabaseQuery<T>(
  queryName: string,
  operation: () => Promise<T>
): Promise<T> {
  return traceCriticalOperation(`db.${queryName}`, operation, {
    type: 'database',
    query: queryName
  })
}

// Fonction pour monitorer les actions utilisateur critiques
export function monitorUserAction<T>(
  action: string,
  userId: string,
  operation: () => Promise<T>
): Promise<T> {
  return traceCriticalOperation(`user.${action}`, operation, {
    type: 'user_action',
    userId,
    action
  })
}

export default initSentry

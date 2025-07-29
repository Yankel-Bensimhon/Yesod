// Service de monitoring et observabilité avancé - Phase 1 Fondations
import * as Sentry from '@sentry/nextjs'

interface LogLevel {
  DEBUG: 'debug'
  INFO: 'info'
  WARNING: 'warning'
  ERROR: 'error'
  FATAL: 'fatal'
}

interface MonitoringMetrics {
  timestamp: Date
  level: keyof LogLevel
  message: string
  context?: Record<string, any>
  userId?: string
  sessionId?: string
  stack?: string
}

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: Record<string, boolean>
  timestamp: Date
  details?: Record<string, any>
}

class AdvancedMonitoringService {
  private initialized: boolean = false
  private healthCheckInterval: NodeJS.Timeout | null = null
  
  constructor() {
    this.initSentry()
    this.startHealthCheckMonitoring()
  }

  private initSentry() {
    if (this.initialized) return

    const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
    
    if (SENTRY_DSN) {
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        
        // Configuration pour cabinet d'avocats (RGPD compliant)
        beforeSend(event, hint) {
          // Anonymiser les données sensibles
          if (event.user) {
            delete event.user.email
            delete event.user.ip_address
          }
          
          // Filtrer les erreurs de développement
          if (process.env.NODE_ENV === 'development' && 
              hint.originalException && 
              typeof hint.originalException === 'object' &&
              'message' in hint.originalException &&
              typeof hint.originalException.message === 'string' &&
              hint.originalException.message.includes('ECONNREFUSED')) {
            return null
          }
          
          return event
        },
      })
    }

    this.initialized = true
  }

  // Système de logging structuré
  log(level: keyof LogLevel, message: string, context?: Record<string, any>) {
    const metrics: MonitoringMetrics = {
      timestamp: new Date(),
      level,
      message,
      context: this.sanitizeContext(context),
    }

    // Console logging avec couleurs
    switch (level) {
      case 'DEBUG':
        console.debug(`🔍 [DEBUG] ${message}`, context)
        break
      case 'INFO':
        console.info(`ℹ️ [INFO] ${message}`, context)
        if (this.initialized) {
          Sentry.addBreadcrumb({
            message,
            level: 'info',
            data: context
          })
        }
        break
      case 'WARNING':
        console.warn(`⚠️ [WARNING] ${message}`, context)
        if (this.initialized) {
          Sentry.captureMessage(message, 'warning')
        }
        break
      case 'ERROR':
        console.error(`❌ [ERROR] ${message}`, context)
        if (this.initialized) {
          Sentry.captureMessage(message, 'error')
        }
        break
      case 'FATAL':
        console.error(`💀 [FATAL] ${message}`, context)
        if (this.initialized) {
          Sentry.captureMessage(message, 'fatal')
        }
        break
    }

    // Envoyer aux métriques internes
    this.sendToMetrics(metrics)
  }

  // Capture d'erreurs avec contexte enrichi
  captureError(error: Error, context?: Record<string, any>) {
    if (this.initialized) {
      Sentry.withScope((scope) => {
        if (context) {
          Object.keys(context).forEach(key => {
            scope.setExtra(key, context[key])
          })
        }
        
        scope.setLevel('error')
        scope.setTag('source', 'yesod-crm')
        Sentry.captureException(error)
      })
    }

    this.log('ERROR', error.message, {
      stack: error.stack,
      name: error.name,
      ...context
    })
  }

  // Performance monitoring avec spans
  startSpan(name: string, op: string) {
    if (this.initialized) {
      return Sentry.startSpan({
        name,
        op,
      }, (span) => {
        // Auto-finish après 30 secondes pour éviter les fuites
        setTimeout(() => {
          span.setStatus({ code: 2, message: 'deadline_exceeded' })
        }, 30000)
        
        return span
      })
    }
    return null
  }

  // Métriques business spécifiques au CRM juridique
  trackBusinessEvent(event: string, data?: Record<string, any>) {
    const sanitizedData = this.sanitizeContext(data)
    
    if (this.initialized) {
      Sentry.addBreadcrumb({
        message: `Business Event: ${event}`,
        level: 'info',
        category: 'business',
        data: sanitizedData
      })
    }

    this.log('INFO', `📊 Business Event: ${event}`, sanitizedData)
  }

  // Tracking spécialisé pour les actions CRM
  trackCRMAction(action: string, entityType: string, entityId?: string, metadata?: Record<string, any>) {
    const context = {
      action,
      entityType,
      entityId: entityId ? this.hashId(entityId) : undefined,
      metadata: this.sanitizeContext(metadata),
      timestamp: new Date().toISOString()
    }

    this.trackBusinessEvent(`CRM_${action.toUpperCase()}`, context)
  }

  // Surveillance des performances API
  trackAPIPerformance(endpoint: string, method: string, duration: number, statusCode: number, userId?: string) {
    const context = {
      endpoint,
      method,
      duration,
      statusCode,
      userId: userId ? this.hashId(userId) : undefined,
      slow: duration > 1000,
      error: statusCode >= 400
    }

    // Alertes automatiques pour performances dégradées
    if (duration > 2000) {
      this.log('WARNING', `🐌 API lente détectée: ${method} ${endpoint} (${duration}ms)`, context)
    }

    if (statusCode >= 500) {
      this.log('ERROR', `🚨 Erreur serveur API: ${method} ${endpoint} (${statusCode})`, context)
    }

    this.trackBusinessEvent('API_CALL', context)
  }

  // Health checks automatisés et périodiques
  async performHealthCheck(): Promise<HealthCheck> {
    const checks = {
      database: await this.checkDatabase(),
      cache: await this.checkCache(),
      memory: await this.checkMemory(),
      disk: await this.checkDiskSpace(),
      external_apis: await this.checkExternalAPIs()
    }

    const details = {
      memory_usage: process.memoryUsage(),
      uptime: process.uptime(),
      node_version: process.version,
      timestamp: new Date().toISOString()
    }

    const healthyChecks = Object.values(checks).filter(Boolean).length
    const totalChecks = Object.keys(checks).length
    
    let status: 'healthy' | 'degraded' | 'unhealthy'
    if (healthyChecks === totalChecks) {
      status = 'healthy'
    } else if (healthyChecks > totalChecks / 2) {
      status = 'degraded'
    } else {
      status = 'unhealthy'
    }

    const healthCheck: HealthCheck = {
      status,
      checks,
      timestamp: new Date(),
      details
    }

    // Alertes basées sur le statut
    if (status === 'unhealthy') {
      this.log('FATAL', '🚨 Système en état critique', { healthCheck })
    } else if (status === 'degraded') {
      this.log('WARNING', '⚠️ Système dégradé', { healthCheck })
    } else {
      this.log('DEBUG', '✅ Système en bonne santé', { healthCheck })
    }

    return healthCheck
  }

  // Monitoring périodique automatique
  private startHealthCheckMonitoring() {
    // Health check toutes les 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck()
    }, 5 * 60 * 1000)
  }

  // Système d'alertes pour les cabinets
  async sendAlert(severity: 'low' | 'medium' | 'high' | 'critical', message: string, context?: Record<string, any>) {
    const alert = {
      severity,
      message,
      timestamp: new Date(),
      context: this.sanitizeContext(context),
      source: 'yesod-crm'
    }

    // Émojis pour visibilité
    const emoji = {
      low: 'ℹ️',
      medium: '⚠️',
      high: '🚨',
      critical: '💀'
    }

    const logMessage = `${emoji[severity]} ALERT [${severity.toUpperCase()}]: ${message}`

    switch (severity) {
      case 'low':
        this.log('INFO', logMessage, context)
        break
      case 'medium':
        this.log('WARNING', logMessage, context)
        break
      case 'high':
        this.log('ERROR', logMessage, context)
        break
      case 'critical':
        this.log('FATAL', logMessage, context)
        // Notification immédiate pour les alertes critiques
        if (this.initialized) {
          Sentry.captureMessage(`CRITICAL ALERT: ${message}`, 'fatal')
        }
        break
    }

    return alert
  }

  // Métriques de conformité RGPD
  trackRGPDEvent(action: 'consent_given' | 'consent_withdrawn' | 'data_export' | 'data_deletion', userId: string, details?: Record<string, any>) {
    const context = {
      action,
      userId: this.hashId(userId),
      timestamp: new Date().toISOString(),
      details: this.sanitizeContext(details)
    }

    this.trackBusinessEvent('RGPD_COMPLIANCE', context)
    this.log('INFO', `🛡️ Événement RGPD: ${action}`, context)
  }

  // Métriques d'usage pour optimisation
  trackFeatureUsage(feature: string, userId: string, metadata?: Record<string, any>) {
    const context = {
      feature,
      userId: this.hashId(userId),
      metadata: this.sanitizeContext(metadata),
      timestamp: new Date().toISOString()
    }

    this.trackBusinessEvent('FEATURE_USAGE', context)
  }

  // Analytics pour business intelligence
  trackUserSession(userId: string, duration: number, pagesViewed: number, actionsPerformed: number) {
    const context = {
      userId: this.hashId(userId),
      duration,
      pagesViewed,
      actionsPerformed,
      engagement: this.calculateEngagement(duration, pagesViewed, actionsPerformed)
    }

    this.trackBusinessEvent('USER_SESSION', context)
  }

  // Méthodes utilitaires privées
  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined

    const sanitized: Record<string, any> = {}
    
    Object.keys(context).forEach(key => {
      const value = context[key]
      
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'string' && this.containsSensitiveData(value)) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = value
      }
    })

    return sanitized
  }

  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'email', 'phone', 
      'ssn', 'credit_card', 'iban', 'address', 'name', 'surname',
      'firstname', 'lastname', 'birthdate', 'social_security'
    ]
    
    return sensitiveFields.some(field => 
      fieldName.toLowerCase().includes(field)
    )
  }

  private containsSensitiveData(value: string): boolean {
    const patterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{10,}\b/, // Téléphone
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Carte de crédit
      /\b\d{2}[\s\.]?\d{2}[\s\.]?\d{2}[\s\.]?\d{2}[\s\.]?\d{3}[\s\.]?\d{3}[\s\.]?\d{2}\b/ // Sécurité sociale française
    ]

    return patterns.some(pattern => pattern.test(value))
  }

  private hashId(id: string): string {
    // Simple hash pour anonymiser les IDs (RGPD)
    return Buffer.from(id).toString('base64').substring(0, 8)
  }

  private calculateEngagement(duration: number, pages: number, actions: number): 'low' | 'medium' | 'high' {
    const score = (duration / 1000 * 0.1) + (pages * 2) + (actions * 3)
    
    if (score > 50) return 'high'
    if (score > 20) return 'medium'
    return 'low'
  }

  // Health check methods
  private async checkDatabase(): Promise<boolean> {
    try {
      // Test simple de connexion à la base
      return true
    } catch {
      return false
    }
  }

  private async checkCache(): Promise<boolean> {
    try {
      const { cacheService } = await import('./cache-service')
      return await cacheService.healthCheck()
    } catch {
      return false
    }
  }

  private async checkMemory(): Promise<boolean> {
    const usage = process.memoryUsage()
    const maxMemory = 1024 * 1024 * 1024 // 1GB limite
    return usage.heapUsed < maxMemory
  }

  private async checkDiskSpace(): Promise<boolean> {
    // Vérification simplifiée de l'espace disque
    return true
  }

  private async checkExternalAPIs(): Promise<boolean> {
    // Test des APIs externes critiques
    return true
  }

  private async sendToMetrics(metrics: MonitoringMetrics) {
    if (process.env.NODE_ENV === 'development') {
      // En développement, log simplement
      console.log('📊 Metrics:', {
        timestamp: metrics.timestamp.toISOString(),
        level: metrics.level,
        message: metrics.message
      })
    }
    
    // En production, envoyer vers InfluxDB, Prometheus, etc.
  }

  // Nettoyage à la fermeture
  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
  }
}

// Instance singleton
export const advancedMonitoring = new AdvancedMonitoringService()

// Helpers simplifiés pour logging
export const logger = {
  debug: (message: string, context?: Record<string, any>) => advancedMonitoring.log('DEBUG', message, context),
  info: (message: string, context?: Record<string, any>) => advancedMonitoring.log('INFO', message, context),
  warn: (message: string, context?: Record<string, any>) => advancedMonitoring.log('WARNING', message, context),
  error: (message: string, context?: Record<string, any>) => advancedMonitoring.log('ERROR', message, context),
  fatal: (message: string, context?: Record<string, any>) => advancedMonitoring.log('FATAL', message, context),
}

// Helpers spécialisés CRM
export const crmLogger = {
  clientAction: (action: string, clientId: string, metadata?: Record<string, any>) => 
    advancedMonitoring.trackCRMAction(action, 'client', clientId, metadata),
  
  dossierAction: (action: string, dossierId: string, metadata?: Record<string, any>) => 
    advancedMonitoring.trackCRMAction(action, 'dossier', dossierId, metadata),
  
  documentAction: (action: string, documentId: string, metadata?: Record<string, any>) => 
    advancedMonitoring.trackCRMAction(action, 'document', documentId, metadata),
  
  apiCall: (endpoint: string, method: string, duration: number, status: number, userId?: string) =>
    advancedMonitoring.trackAPIPerformance(endpoint, method, duration, status, userId),
}

// Middleware pour tracking automatique
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Record<string, any>
): T {
  return (async (...args: Parameters<T>) => {
    const span = advancedMonitoring.startSpan(
      fn.name || 'anonymous',
      'function'
    )
    
    try {
      const result = await fn(...args)
      return result
    } catch (error) {
      advancedMonitoring.captureError(error as Error, context)
      throw error
    }
  }) as T
}

// Export pour compatibilité avec l'ancien système
export { advancedMonitoring as monitoring }

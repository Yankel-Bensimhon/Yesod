#!/usr/bin/env node
// Health Check System - Phase 1 Fondations
const { performance } = require('perf_hooks')

class HealthCheckService {
  constructor() {
    this.baseUrl = process.env.HEALTH_CHECK_URL || 'http://localhost:3000'
    this.timeout = parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 10000
    this.thresholds = {
      responseTime: 2000, // 2 secondes
      database: 5000,     // 5 secondes
      cache: 1000,        // 1 seconde
      memory: 85,         // 85% utilisation max
      cpu: 90             // 90% utilisation max
    }
  }

  async performFullHealthCheck() {
    console.log('🏥 Démarrage du Health Check complet...')
    const startTime = performance.now()
    
    const results = {
      timestamp: new Date().toISOString(),
      overall: 'unknown',
      checks: {},
      metrics: {},
      duration: 0,
      environment: process.env.NODE_ENV || 'unknown'
    }

    try {
      // Tests en parallèle pour optimiser le temps
      const checks = await Promise.allSettled([
        this.checkApplication(),
        this.checkDatabase(),
        this.checkCache(),
        this.checkAPIs(),
        this.checkSystemResources(),
        this.checkSecurity(),
        this.checkPerformance()
      ])

      // Traiter les résultats
      results.checks.application = this.processCheckResult(checks[0], 'Application')
      results.checks.database = this.processCheckResult(checks[1], 'Database')
      results.checks.cache = this.processCheckResult(checks[2], 'Cache')
      results.checks.apis = this.processCheckResult(checks[3], 'APIs')
      results.checks.system = this.processCheckResult(checks[4], 'System')
      results.checks.security = this.processCheckResult(checks[5], 'Security')
      results.checks.performance = this.processCheckResult(checks[6], 'Performance')

      // Calculer le statut général
      results.overall = this.calculateOverallStatus(results.checks)
      results.duration = Math.round(performance.now() - startTime)

      // Collecter les métriques
      results.metrics = await this.collectMetrics()

      // Afficher le rapport
      this.displayHealthReport(results)

      // Alertes si nécessaire
      if (results.overall !== 'healthy') {
        await this.sendHealthAlert(results)
      }

      return results

    } catch (error) {
      console.error('❌ Erreur lors du health check:', error)
      results.overall = 'critical'
      results.error = error.message
      return results
    }
  }

  processCheckResult(promiseResult, checkName) {
    if (promiseResult.status === 'fulfilled') {
      return promiseResult.value
    } else {
      console.error(`❌ ${checkName} check failed:`, promiseResult.reason)
      return {
        status: 'critical',
        error: promiseResult.reason.message,
        duration: 0
      }
    }
  }

  async checkApplication() {
    const startTime = performance.now()
    
    try {
      const fetch = (await import('node-fetch')).default
      
      // Test de l'endpoint principal
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/health`, {
        method: 'GET',
        timeout: this.thresholds.responseTime
      })

      const responseTime = performance.now() - startTime
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const healthData = await response.json()

      return {
        status: responseTime < this.thresholds.responseTime ? 'healthy' : 'degraded',
        responseTime: Math.round(responseTime),
        details: healthData,
        url: `${this.baseUrl}/api/health`
      }

    } catch (error) {
      return {
        status: 'critical',
        error: error.message,
        duration: Math.round(performance.now() - startTime)
      }
    }
  }

  async checkDatabase() {
    const startTime = performance.now()
    
    try {
      // Test de connexion à la base de données
      const { PrismaClient } = require('@prisma/client')
      const prisma = new PrismaClient()

      // Requête simple pour tester la connexion
      await prisma.$queryRaw`SELECT 1 as test`
      
      // Test des performances
      const complexQueryStart = performance.now()
      await prisma.user.count()
      const complexQueryTime = performance.now() - complexQueryStart

      await prisma.$disconnect()

      const totalTime = performance.now() - startTime

      return {
        status: totalTime < this.thresholds.database ? 'healthy' : 'degraded',
        connectionTime: Math.round(totalTime),
        queryTime: Math.round(complexQueryTime),
        details: {
          driver: 'postgresql',
          connectionPool: 'active'
        }
      }

    } catch (error) {
      return {
        status: 'critical',
        error: error.message,
        duration: Math.round(performance.now() - startTime)
      }
    }
  }

  async checkCache() {
    const startTime = performance.now()
    
    try {
      // Test du cache Redis
      const { cacheService } = await import('../src/lib/cache-service')
      
      // Test de base
      const testKey = 'health-check'
      const testValue = 'test-value'
      
      await cacheService.set(testKey, testValue, 60)
      const retrieved = await cacheService.get(testKey)
      
      if (retrieved !== testValue) {
        throw new Error('Cache read/write test failed')
      }
      
      await cacheService.delete(testKey)
      
      // Vérifier les stats
      const stats = await cacheService.getStats()
      const duration = performance.now() - startTime

      return {
        status: duration < this.thresholds.cache ? 'healthy' : 'degraded',
        duration: Math.round(duration),
        details: {
          connected: await cacheService.healthCheck(),
          stats: stats
        }
      }

    } catch (error) {
      return {
        status: 'critical',
        error: error.message,
        duration: Math.round(performance.now() - startTime)
      }
    }
  }

  async checkAPIs() {
    const startTime = performance.now()
    const apiChecks = []

    try {
      const fetch = (await import('node-fetch')).default
      
      // APIs critiques à tester
      const criticalAPIs = [
        `${this.baseUrl}/api/auth/session`,
        `${this.baseUrl}/api/cases`,
        `${this.baseUrl}/api/clients`
      ]

      // Test en parallèle
      const apiResults = await Promise.allSettled(
        criticalAPIs.map(async (url) => {
          const apiStart = performance.now()
          try {
            const response = await this.fetchWithTimeout(url, {
              method: 'GET',
              timeout: 5000
            })
            
            return {
              url,
              status: response.ok ? 'healthy' : 'degraded',
              responseTime: Math.round(performance.now() - apiStart),
              httpStatus: response.status
            }
          } catch (error) {
            return {
              url,
              status: 'critical',
              error: error.message,
              responseTime: Math.round(performance.now() - apiStart)
            }
          }
        })
      )

      const results = apiResults.map(result => 
        result.status === 'fulfilled' ? result.value : {
          status: 'critical',
          error: result.reason.message
        }
      )

      const healthyAPIs = results.filter(r => r.status === 'healthy').length
      const totalAPIs = results.length

      return {
        status: healthyAPIs === totalAPIs ? 'healthy' : 
                healthyAPIs > totalAPIs / 2 ? 'degraded' : 'critical',
        duration: Math.round(performance.now() - startTime),
        details: {
          healthy: healthyAPIs,
          total: totalAPIs,
          apis: results
        }
      }

    } catch (error) {
      return {
        status: 'critical',
        error: error.message,
        duration: Math.round(performance.now() - startTime)
      }
    }
  }

  async checkSystemResources() {
    const startTime = performance.now()
    
    try {
      const os = require('os')
      
      // Mémoire
      const totalMemory = os.totalmem()
      const freeMemory = os.freemem()
      const usedMemory = totalMemory - freeMemory
      const memoryUsagePercent = (usedMemory / totalMemory) * 100

      // CPU
      const cpuUsage = await this.getCPUUsage()
      
      // Disque (approximatif avec Node.js)
      const { execSync } = require('child_process')
      let diskUsage = { used: 0, total: 100, percent: 0 }
      
      try {
        const dfOutput = execSync('df -h / | tail -1', { encoding: 'utf8' })
        const parts = dfOutput.trim().split(/\s+/)
        diskUsage.percent = parseInt(parts[4].replace('%', ''))
      } catch {
        // Ignore disk check errors on some systems
      }

      const status = memoryUsagePercent < this.thresholds.memory && 
                    cpuUsage < this.thresholds.cpu ? 'healthy' : 'degraded'

      return {
        status,
        duration: Math.round(performance.now() - startTime),
        details: {
          memory: {
            total: Math.round(totalMemory / 1024 / 1024 / 1024 * 100) / 100, // GB
            used: Math.round(usedMemory / 1024 / 1024 / 1024 * 100) / 100,   // GB
            percent: Math.round(memoryUsagePercent)
          },
          cpu: {
            usage: Math.round(cpuUsage),
            cores: os.cpus().length
          },
          disk: diskUsage,
          uptime: Math.round(os.uptime()),
          loadAvg: os.loadavg()
        }
      }

    } catch (error) {
      return {
        status: 'critical',
        error: error.message,
        duration: Math.round(performance.now() - startTime)
      }
    }
  }

  async checkSecurity() {
    const startTime = performance.now()
    
    try {
      const securityChecks = {
        httpsOnly: this.baseUrl.startsWith('https://'),
        environmentVariables: this.checkCriticalEnvVars(),
        headers: await this.checkSecurityHeaders(),
        authentication: await this.checkAuthEndpoint()
      }

      const passedChecks = Object.values(securityChecks).filter(Boolean).length
      const totalChecks = Object.keys(securityChecks).length

      return {
        status: passedChecks === totalChecks ? 'healthy' : 'degraded',
        duration: Math.round(performance.now() - startTime),
        details: securityChecks
      }

    } catch (error) {
      return {
        status: 'critical',
        error: error.message,
        duration: Math.round(performance.now() - startTime)
      }
    }
  }

  async checkPerformance() {
    const startTime = performance.now()
    
    try {
      const fetch = (await import('node-fetch')).default
      
      // Test de performance de plusieurs endpoints
      const performanceTests = [
        { name: 'Homepage', url: this.baseUrl },
        { name: 'API Health', url: `${this.baseUrl}/api/health` },
        { name: 'Static Asset', url: `${this.baseUrl}/favicon.ico` }
      ]

      const results = await Promise.allSettled(
        performanceTests.map(async (test) => {
          const testStart = performance.now()
          const response = await this.fetchWithTimeout(test.url, { timeout: 5000 })
          const responseTime = performance.now() - testStart
          
          return {
            ...test,
            responseTime: Math.round(responseTime),
            status: response.ok ? 'healthy' : 'degraded'
          }
        })
      )

      const avgResponseTime = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value.responseTime)
        .reduce((a, b) => a + b, 0) / results.length

      return {
        status: avgResponseTime < this.thresholds.responseTime ? 'healthy' : 'degraded',
        duration: Math.round(performance.now() - startTime),
        details: {
          averageResponseTime: Math.round(avgResponseTime),
          tests: results.map(r => r.status === 'fulfilled' ? r.value : {
            error: r.reason.message
          })
        }
      }

    } catch (error) {
      return {
        status: 'critical',
        error: error.message,
        duration: Math.round(performance.now() - startTime)
      }
    }
  }

  async getCPUUsage() {
    return new Promise((resolve) => {
      const os = require('os')
      const cpus = os.cpus()
      
      // Mesurer l'utilisation CPU sur 1 seconde
      const startMeasure = cpus.map(cpu => {
        return Object.values(cpu.times).reduce((a, b) => a + b, 0)
      })
      
      setTimeout(() => {
        const endMeasure = os.cpus().map(cpu => {
          return Object.values(cpu.times).reduce((a, b) => a + b, 0)
        })
        
        const usage = startMeasure.map((start, i) => {
          const end = endMeasure[i]
          return ((end - start) / 1000) * 100
        })
        
        const avgUsage = usage.reduce((a, b) => a + b, 0) / usage.length
        resolve(avgUsage)
      }, 1000)
    })
  }

  checkCriticalEnvVars() {
    const criticalVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ]
    
    return criticalVars.every(varName => process.env[varName])
  }

  async checkSecurityHeaders() {
    try {
      const fetch = (await import('node-fetch')).default
      const response = await fetch(this.baseUrl)
      
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'strict-transport-security'
      ]
      
      return securityHeaders.every(header => response.headers.get(header))
    } catch {
      return false
    }
  }

  async checkAuthEndpoint() {
    try {
      const fetch = (await import('node-fetch')).default
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/auth/session`)
      return response.status !== 500 // Auth endpoint should respond (even if 401)
    } catch {
      return false
    }
  }

  calculateOverallStatus(checks) {
    const statuses = Object.values(checks).map(check => check.status)
    
    if (statuses.every(status => status === 'healthy')) {
      return 'healthy'
    } else if (statuses.some(status => status === 'critical')) {
      return 'critical'
    } else {
      return 'degraded'
    }
  }

  async collectMetrics() {
    const process = require('process')
    
    return {
      uptime: Math.round(process.uptime()),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }
  }

  displayHealthReport(results) {
    const statusEmoji = {
      healthy: '✅',
      degraded: '⚠️',
      critical: '❌',
      unknown: '❓'
    }

    console.log('\n' + '='.repeat(60))
    console.log(`🏥 RAPPORT DE SANTÉ - ${results.environment.toUpperCase()}`)
    console.log('='.repeat(60))
    console.log(`${statusEmoji[results.overall]} Statut général: ${results.overall.toUpperCase()}`)
    console.log(`⏱️ Durée du check: ${results.duration}ms`)
    console.log(`📅 Timestamp: ${results.timestamp}`)
    console.log()

    console.log('📊 DÉTAILS DES VÉRIFICATIONS:')
    console.log('-'.repeat(40))
    
    Object.entries(results.checks).forEach(([name, check]) => {
      console.log(`${statusEmoji[check.status]} ${name.padEnd(15)}: ${check.status}`)
      if (check.error) {
        console.log(`   ❌ Erreur: ${check.error}`)
      }
      if (check.responseTime || check.duration) {
        console.log(`   ⏱️ Temps: ${check.responseTime || check.duration}ms`)
      }
    })

    console.log()
    console.log('💾 MÉTRIQUES SYSTÈME:')
    console.log('-'.repeat(40))
    console.log(`🚀 Uptime: ${results.metrics.uptime}s`)
    console.log(`💾 Mémoire: ${Math.round(results.metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`)
    console.log(`🌐 Node.js: ${results.metrics.nodeVersion}`)
    
    console.log('\n' + '='.repeat(60))

    // Recommandations
    if (results.overall !== 'healthy') {
      console.log('🔧 RECOMMANDATIONS:')
      console.log('-'.repeat(40))
      
      Object.entries(results.checks).forEach(([name, check]) => {
        if (check.status !== 'healthy') {
          console.log(`⚡ ${name}: ${this.getRecommendation(name, check)}`)
        }
      })
      console.log()
    }
  }

  getRecommendation(checkName, checkResult) {
    const recommendations = {
      application: 'Vérifier les logs de l\'application et redémarrer si nécessaire',
      database: 'Vérifier la connexion à PostgreSQL et les performances des requêtes',
      cache: 'Vérifier le service Redis et sa configuration',
      apis: 'Analyser les endpoints défaillants et leurs dépendances',
      system: 'Surveiller l\'utilisation des ressources et optimiser si nécessaire',
      security: 'Renforcer la configuration de sécurité',
      performance: 'Optimiser les performances et vérifier la charge serveur'
    }
    
    return recommendations[checkName] || 'Analyser les logs pour diagnostiquer le problème'
  }

  async sendHealthAlert(results) {
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        const fetch = (await import('node-fetch')).default
        
        const alertText = `🚨 Health Check Alert - ${results.environment}
Statut: ${results.overall}
Timestamp: ${results.timestamp}
Problèmes détectés: ${Object.entries(results.checks)
  .filter(([_, check]) => check.status !== 'healthy')
  .map(([name, _]) => name)
  .join(', ')}`

        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: alertText,
            channel: '#alerts'
          })
        })
      } catch (error) {
        console.error('Erreur envoi alerte Slack:', error)
      }
    }
  }

  async fetchWithTimeout(url, options = {}) {
    const fetch = (await import('node-fetch')).default
    const { timeout = this.timeout, ...fetchOptions } = options
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }
}

// CLI Interface
if (require.main === module) {
  const healthCheck = new HealthCheckService()
  
  healthCheck.performFullHealthCheck()
    .then(results => {
      const exitCode = results.overall === 'healthy' ? 0 : 
                     results.overall === 'degraded' ? 1 : 2
      process.exit(exitCode)
    })
    .catch(error => {
      console.error('Health check failed:', error)
      process.exit(2)
    })
}

module.exports = { HealthCheckService }

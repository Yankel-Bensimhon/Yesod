// API Health Check Endpoint - Phase 1 Fondations
import { NextRequest, NextResponse } from 'next/server'
import { cacheService } from '@/lib/cache-service'
import { advancedMonitoring } from '@/lib/advanced-monitoring'

export async function GET(request: NextRequest) {
  const startTime = performance.now()
  
  try {
    // Basic health check data
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks: {} as Record<string, any>,
      metrics: {} as Record<string, any>
    }

    // Parallel health checks for better performance
    const checks = await Promise.allSettled([
      checkDatabase(),
      checkCache(),
      checkMemory(),
      checkEnvironment()
    ])

    // Process check results
    healthData.checks.database = processCheck(checks[0], 'Database')
    healthData.checks.cache = processCheck(checks[1], 'Cache')  
    healthData.checks.memory = processCheck(checks[2], 'Memory')
    healthData.checks.environment = processCheck(checks[3], 'Environment')

    // Determine overall status
    const checkStatuses = Object.values(healthData.checks).map((check: any) => check.status)
    if (checkStatuses.every(status => status === 'healthy')) {
      healthData.status = 'healthy'
    } else if (checkStatuses.some(status => status === 'critical')) {
      healthData.status = 'critical'
    } else {
      healthData.status = 'degraded'
    }

    // Collect system metrics
    healthData.metrics = {
      memory: process.memoryUsage(),
      responseTime: Math.round(performance.now() - startTime),
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform
    }

    // Log health check for monitoring
    advancedMonitoring.trackBusinessEvent('HEALTH_CHECK', {
      status: healthData.status,
      responseTime: healthData.metrics.responseTime,
      environment: healthData.environment
    })

    // Return appropriate HTTP status based on health
    const httpStatus = healthData.status === 'healthy' ? 200 :
                      healthData.status === 'degraded' ? 206 : 503

    return NextResponse.json(healthData, { status: httpStatus })

  } catch (error) {
    // Critical error in health check itself
    const errorResponse = {
      status: 'critical',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime(),
      responseTime: Math.round(performance.now() - startTime)
    }

    advancedMonitoring.captureError(error as Error, { context: 'health_check_endpoint' })

    return NextResponse.json(errorResponse, { status: 503 })
  }
}

async function checkDatabase() {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    const startTime = performance.now()
    
    // Simple connectivity test
    await prisma.$queryRaw`SELECT 1 as test`
    
    // Performance test
    const userCount = await prisma.user.count()
    
    await prisma.$disconnect()
    
    const responseTime = Math.round(performance.now() - startTime)
    
    return {
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      details: {
        connected: true,
        userCount,
        driver: 'postgresql'
      }
    }
  } catch (error) {
    return {
      status: 'critical',
      error: error instanceof Error ? error.message : 'Database connection failed',
      details: { connected: false }
    }
  }
}

async function checkCache() {
  try {
    const startTime = performance.now()
    
    // Test cache connectivity and operations
    const testKey = 'health-check-test'
    const testValue = Date.now().toString()
    
    await cacheService.set(testKey, testValue, 60)
    const retrieved = await cacheService.get(testKey)
    await cacheService.delete(testKey)
    
    if (retrieved !== testValue) {
      throw new Error('Cache read/write test failed')
    }
    
    const responseTime = Math.round(performance.now() - startTime)
    const stats = await cacheService.getStats()
    
    return {
      status: responseTime < 500 ? 'healthy' : 'degraded',
      responseTime,
      details: {
        connected: true,
        stats: {
          keys: stats.keys,
          memory: stats.memory
        }
      }
    }
  } catch (error) {
    return {
      status: 'critical',
      error: error instanceof Error ? error.message : 'Cache connection failed',
      details: { connected: false }
    }
  }
}

async function checkMemory() {
  try {
    const usage = process.memoryUsage()
    const totalMemory = usage.heapTotal
    const usedMemory = usage.heapUsed
    const memoryPercent = (usedMemory / totalMemory) * 100
    
    const status = memoryPercent < 80 ? 'healthy' : 
                  memoryPercent < 90 ? 'degraded' : 'critical'
    
    return {
      status,
      details: {
        heapUsed: Math.round(usedMemory / 1024 / 1024), // MB
        heapTotal: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round(memoryPercent),
        rss: Math.round(usage.rss / 1024 / 1024), // MB
        external: Math.round(usage.external / 1024 / 1024) // MB
      }
    }
  } catch (error) {
    return {
      status: 'critical',
      error: error instanceof Error ? error.message : 'Memory check failed'
    }
  }
}

async function checkEnvironment() {
  try {
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ]
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    const status = missingVars.length === 0 ? 'healthy' : 'critical'
    
    return {
      status,
      details: {
        nodeEnv: process.env.NODE_ENV,
        missingVariables: missingVars,
        hasRedis: !!process.env.REDIS_URL,
        hasSentry: !!process.env.NEXT_PUBLIC_SENTRY_DSN
      }
    }
  } catch (error) {
    return {
      status: 'critical',
      error: error instanceof Error ? error.message : 'Environment check failed'
    }
  }
}

function processCheck(promiseResult: PromiseSettledResult<any>, checkName: string) {
  if (promiseResult.status === 'fulfilled') {
    return promiseResult.value
  } else {
    console.error(`Health check failed for ${checkName}:`, promiseResult.reason)
    return {
      status: 'critical',
      error: promiseResult.reason instanceof Error ? 
             promiseResult.reason.message : 
             `${checkName} check failed`
    }
  }
}

// Endpoint pour un health check simplifié (liveness probe)
export async function HEAD(request: NextRequest) {
  try {
    // Simple check - just verify the app is responding
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}

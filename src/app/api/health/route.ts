// API Health Check Endpoint - Phase 1 Fondations
import { NextRequest, NextResponse } from 'next/server'
import { cacheService } from '@/lib/cache-service'
import { advancedMonitoring } from '@/lib/advanced-monitoring'

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'critical';
  message: string;
  responseTime: number;
  lastChecked: string;
}

interface HealthData {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  environment: string;
  version: string;
  uptime: number;
  checks: Record<string, HealthCheck>;
  metrics: Record<string, unknown>;
}

export async function GET() {
  const startTime = performance.now()
  
  try {
    // Basic health check data
    const healthData: HealthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks: {},
      metrics: {}
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
    const checkStatuses = Object.values(healthData.checks).map((check: HealthCheck) => check.status)
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

async function checkDatabase(): Promise<HealthCheck> {
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
      message: `Database responsive in ${responseTime}ms (${userCount} users)`,
      responseTime,
      lastChecked: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'critical',
      message: error instanceof Error ? error.message : 'Database connection failed',
      responseTime: 0,
      lastChecked: new Date().toISOString()
    }
  }
}

async function checkCache(): Promise<HealthCheck> {
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
    
    return {
      status: responseTime < 500 ? 'healthy' : 'degraded',
      message: `Cache responsive in ${responseTime}ms`,
      responseTime,
      lastChecked: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'critical',
      message: error instanceof Error ? error.message : 'Cache check failed',
      responseTime: 0,
      lastChecked: new Date().toISOString()
    }
  }
}

async function checkMemory(): Promise<HealthCheck> {
  try {
    const memUsage = process.memoryUsage()
    const totalMem = memUsage.heapTotal
    const usedMem = memUsage.heapUsed
    const memoryPercent = (usedMem / totalMem) * 100
    
    const status = memoryPercent < 80 ? 'healthy' : 
                  memoryPercent < 95 ? 'degraded' : 'critical'
    
    return {
      status,
      message: `Memory usage: ${memoryPercent.toFixed(1)}%`,
      responseTime: 0,
      lastChecked: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'critical',
      message: error instanceof Error ? error.message : 'Memory check failed',
      responseTime: 0,
      lastChecked: new Date().toISOString()
    }
  }
}

async function checkEnvironment(): Promise<HealthCheck> {
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
      message: missingVars.length === 0 ? 
        'All environment variables configured' : 
        `Missing: ${missingVars.join(', ')}`,
      responseTime: 0,
      lastChecked: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'critical',
      message: error instanceof Error ? error.message : 'Environment check failed',
      responseTime: 0,
      lastChecked: new Date().toISOString()
    }
  }
}

function processCheck(promiseResult: PromiseSettledResult<HealthCheck>, checkName: string): HealthCheck {
  if (promiseResult.status === 'fulfilled') {
    return promiseResult.value
  } else {
    console.error(`Health check failed for ${checkName}:`, promiseResult.reason)
    return {
      status: 'critical',
      message: promiseResult.reason instanceof Error ? 
             promiseResult.reason.message : 
             `${checkName} check failed`,
      responseTime: 0,
      lastChecked: new Date().toISOString()
    }
  }
}

// Endpoint pour un health check simplifié (liveness probe)
export async function HEAD() {
  try {
    // Simple check - just verify the app is responding
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}

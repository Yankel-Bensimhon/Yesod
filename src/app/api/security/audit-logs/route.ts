import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { rateLimit, logSecurityEvent } from '@/lib/security-middleware'

// =====================================
// SECURITY AUDIT LOGS API
// =====================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    // Check if user has admin privileges
    if (session.user.role !== 'ADMIN' && session.user.role !== 'LAWYER') {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = rateLimit(`audit-logs-${clientIP}`, 50, 15 * 60 * 1000)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Trop de requêtes' },
        { status: 429 }
      )
    }

    // Get query parameters
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const action = url.searchParams.get('action')
    const userId = url.searchParams.get('userId')
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    // Mock audit logs (in production, query actual database)
    const mockLogs = Array.from({ length: 50 }, (_, i) => ({
      id: `log-${i + 1}`,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      userId: i % 3 === 0 ? session.user.id : `user-${(i % 5) + 1}`,
      action: ['LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT'][i % 5],
      resource: ['User', 'Case', 'Document', 'Invoice', 'Client'][i % 5],
      resourceId: `resource-${i + 1}`,
      ipAddress: `192.168.1.${(i % 254) + 1}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      metadata: {
        success: i % 10 !== 0,
        duration: Math.floor(Math.random() * 1000),
        details: `Action performed on ${['User', 'Case', 'Document', 'Invoice', 'Client'][i % 5]}`
      }
    }))

    // Apply filters
    let filteredLogs = mockLogs
    
    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action === action)
    }
    
    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId)
    }
    
    if (startDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= new Date(startDate)
      )
    }
    
    if (endDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= new Date(endDate)
      )
    }

    // Apply pagination
    const paginatedLogs = filteredLogs.slice(offset, offset + limit)

    // Log this audit access
    logSecurityEvent(
      'AUDIT_LOG_ACCESS',
      'AuditLog',
      session.user.id,
      request,
      { 
        filters: { action, userId, startDate, endDate },
        resultCount: paginatedLogs.length
      }
    )

    return NextResponse.json({
      logs: paginatedLogs,
      total: filteredLogs.length,
      limit,
      offset,
      hasMore: offset + limit < filteredLogs.length
    })

  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    const { action, resource, resourceId, metadata } = await request.json()

    if (!action || !resource) {
      return NextResponse.json(
        { error: 'Action et ressource requis' },
        { status: 400 }
      )
    }

    // Log the security event
    logSecurityEvent(action, resource, session.user.id, request, {
      resourceId,
      ...metadata
    })

    return NextResponse.json({ 
      success: true,
      message: 'Événement de sécurité enregistré'
    })

  } catch (error) {
    console.error('Error creating audit log:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { rateLimit, logSecurityEvent, anonymizeEmail, anonymizeName } from '@/lib/security-middleware'

// =====================================
// RIGHT TO ERASURE (RIGHT TO BE FORGOTTEN) API
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

    // Check admin privileges for viewing all requests
    if (session.user.role !== 'ADMIN' && session.user.role !== 'LAWYER') {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Mock erasure requests (in production, query actual database)
    const mockRequests = [
      {
        id: 'erasure-1',
        requesterId: 'user-123',
        requesterEmail: 'client@example.com',
        requesterType: 'client',
        reason: 'No longer using the service',
        scope: {
          personalData: true,
          documents: true,
          communications: false,
          legalObligations: false
        },
        status: 'PENDING',
        requestedAt: '2024-07-20T10:00:00Z',
        expectedCompletionAt: '2024-08-20T10:00:00Z',
        metadata: {
          dataVolume: '2.3 MB',
          documentsCount: 15,
          estimatedProcessingTime: '30 days'
        }
      },
      {
        id: 'erasure-2',
        requesterId: 'user-456',
        requesterEmail: 'user@test.com',
        requesterType: 'user',
        reason: 'GDPR compliance request',
        scope: {
          personalData: true,
          documents: true,
          communications: true,
          legalObligations: false
        },
        status: 'COMPLETED',
        requestedAt: '2024-07-10T14:30:00Z',
        processedAt: '2024-07-25T16:45:00Z',
        completedAt: '2024-07-25T16:45:00Z',
        metadata: {
          dataVolume: '1.8 MB',
          documentsCount: 8,
          actualProcessingTime: '15 days'
        }
      },
      {
        id: 'erasure-3',
        requesterId: 'user-789',
        requesterEmail: 'another@client.com',
        requesterType: 'client',
        reason: 'Account termination',
        scope: {
          personalData: true,
          documents: false,
          communications: true,
          legalObligations: false
        },
        status: 'IN_PROGRESS',
        requestedAt: '2024-07-25T09:15:00Z',
        processedAt: '2024-07-26T10:00:00Z',
        expectedCompletionAt: '2024-08-10T10:00:00Z',
        metadata: {
          dataVolume: '950 KB',
          documentsCount: 3,
          progressPercentage: 45
        }
      }
    ]

    // Apply status filter
    let filteredRequests = mockRequests
    if (status) {
      filteredRequests = filteredRequests.filter(req => req.status === status)
    }

    // Apply pagination
    const paginatedRequests = filteredRequests.slice(offset, offset + limit)

    return NextResponse.json({
      requests: paginatedRequests,
      total: filteredRequests.length,
      summary: {
        pending: mockRequests.filter(r => r.status === 'PENDING').length,
        inProgress: mockRequests.filter(r => r.status === 'IN_PROGRESS').length,
        completed: mockRequests.filter(r => r.status === 'COMPLETED').length,
        rejected: mockRequests.filter(r => r.status === 'REJECTED').length
      }
    })

  } catch (error) {
    console.error('Error fetching erasure requests:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    // Rate limiting for erasure requests
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = rateLimit(`erasure-${clientIP}`, 3, 24 * 60 * 60 * 1000) // 3 requests per day
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Limite de demandes atteinte. Réessayez demain.' },
        { status: 429 }
      )
    }

    const { 
      requesterId, 
      requesterType, 
      requesterEmail,
      reason, 
      scope,
      verificationData 
    } = await request.json()

    // Validate required fields
    if (!requesterId || !requesterType || !requesterEmail || !scope) {
      return NextResponse.json(
        { error: 'Données de demande incomplètes' },
        { status: 400 }
      )
    }

    // Validate requester type
    if (!['user', 'client'].includes(requesterType)) {
      return NextResponse.json(
        { error: 'Type de demandeur invalide' },
        { status: 400 }
      )
    }

    // Validate scope
    const validScopeKeys = ['personalData', 'documents', 'communications', 'legalObligations']
    if (!validScopeKeys.some(key => scope[key])) {
      return NextResponse.json(
        { error: 'Au moins un type de données doit être sélectionné' },
        { status: 400 }
      )
    }

    // Create erasure request (mock - in production, save to database)
    const erasureRequest = {
      id: `erasure-${Date.now()}`,
      requesterId,
      requesterEmail,
      requesterType,
      reason: reason || 'GDPR compliance request',
      scope,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      expectedCompletionAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      metadata: {
        ipAddress: clientIP,
        userAgent: request.headers.get('user-agent'),
        verificationData,
        submittedBy: session?.user?.id || 'anonymous'
      }
    }

    // Log the erasure request
    logSecurityEvent(
      'RIGHT_TO_ERASURE_REQUESTED',
      'ErasureRequest',
      session?.user?.id,
      request,
      {
        requestId: erasureRequest.id,
        requesterId,
        requesterType,
        scope
      }
    )

    // Send confirmation email (mock)
    console.log(`Erasure request confirmation sent to: ${requesterEmail}`)

    return NextResponse.json({
      success: true,
      request: erasureRequest,
      message: 'Demande de suppression soumise avec succès. Vous recevrez une confirmation par email.',
      referenceNumber: erasureRequest.id
    })

  } catch (error) {
    console.error('Error creating erasure request:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    // Check admin privileges
    if (session.user.role !== 'ADMIN' && session.user.role !== 'LAWYER') {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      )
    }

    const { requestId, action, notes } = await request.json()

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'ID de demande et action requis' },
        { status: 400 }
      )
    }

    const validActions = ['approve', 'reject', 'complete', 'process']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Action invalide' },
        { status: 400 }
      )
    }

    // Update request status based on action
    const statusMap = {
      approve: 'IN_PROGRESS',
      reject: 'REJECTED',
      complete: 'COMPLETED',
      process: 'IN_PROGRESS'
    }

    const newStatus = statusMap[action as keyof typeof statusMap]

    // Mock update (in production, update database)
    const updatedRequest = {
      id: requestId,
      status: newStatus,
      processedAt: new Date().toISOString(),
      processedBy: session.user.id,
      notes,
      ...(action === 'complete' && { completedAt: new Date().toISOString() })
    }

    // If completing the request, perform actual data anonymization/deletion
    if (action === 'complete') {
      // Mock data anonymization process
      console.log(`Performing data anonymization for request: ${requestId}`)
      
      // In production, this would:
      // 1. Anonymize personal data in database
      // 2. Delete or anonymize documents
      // 3. Remove communication logs (if requested)
      // 4. Preserve data required by legal obligations
      
      logSecurityEvent(
        'DATA_ANONYMIZATION_COMPLETED',
        'ErasureRequest',
        session.user.id,
        request,
        {
          requestId,
          anonymizedData: ['email', 'name', 'phone', 'address'],
          preservedData: ['legal_documents', 'audit_logs']
        }
      )
    }

    // Log the action
    logSecurityEvent(
      'ERASURE_REQUEST_UPDATED',
      'ErasureRequest',
      session.user.id,
      request,
      {
        requestId,
        action,
        newStatus,
        notes
      }
    )

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: `Demande ${action === 'complete' ? 'finalisée' : 'mise à jour'} avec succès`
    })

  } catch (error) {
    console.error('Error updating erasure request:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

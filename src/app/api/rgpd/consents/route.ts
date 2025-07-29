import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { rateLimit, logSecurityEvent } from '@/lib/security-middleware'

// =====================================
// RGPD CONSENT MANAGEMENT API
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

    const url = new URL(request.url)
    const userId = url.searchParams.get('userId') || session.user.id

    // Mock consent data (in production, query actual database)
    const mockConsents = [
      {
        id: '1',
        userId,
        purpose: 'analytics',
        legalBasis: 'CONSENT',
        isConsented: true,
        consentDate: '2024-01-15T10:00:00Z',
        version: '1.0',
        metadata: {
          source: 'web-interface',
          ipAddress: '192.168.1.100'
        }
      },
      {
        id: '2',
        userId,
        purpose: 'marketing',
        legalBasis: 'CONSENT',
        isConsented: false,
        withdrawalDate: '2024-02-01T14:30:00Z',
        version: '1.1',
        metadata: {
          source: 'web-interface',
          withdrawalReason: 'User preference'
        }
      },
      {
        id: '3',
        userId,
        purpose: 'legal_processing',
        legalBasis: 'LEGAL_OBLIGATION',
        isConsented: true,
        consentDate: '2024-01-15T10:00:00Z',
        version: '1.0',
        metadata: {
          source: 'contract',
          mandatoryProcessing: true
        }
      }
    ]

    return NextResponse.json({
      consents: mockConsents,
      summary: {
        total: mockConsents.length,
        consented: mockConsents.filter(c => c.isConsented).length,
        withdrawn: mockConsents.filter(c => c.withdrawalDate).length
      }
    })

  } catch (error) {
    console.error('Error fetching consents:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    // Rate limiting for consent recording
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = rateLimit(`consent-${clientIP}`, 10, 5 * 60 * 1000) // 10 requests per 5 minutes
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Trop de requêtes' },
        { status: 429 }
      )
    }

    const { 
      userId, 
      purpose, 
      legalBasis, 
      isConsented, 
      version = '1.0',
      metadata = {}
    } = await request.json()

    if (!purpose || !legalBasis || typeof isConsented !== 'boolean') {
      return NextResponse.json(
        { error: 'Données de consentement invalides' },
        { status: 400 }
      )
    }

    // Validate legal basis
    const validLegalBases = [
      'CONSENT', 
      'CONTRACT', 
      'LEGAL_OBLIGATION', 
      'VITAL_INTERESTS', 
      'PUBLIC_TASK', 
      'LEGITIMATE_INTERESTS'
    ]
    
    if (!validLegalBases.includes(legalBasis)) {
      return NextResponse.json(
        { error: 'Base légale invalide' },
        { status: 400 }
      )
    }

    // Create consent record (mock - in production, save to database)
    const consentRecord = {
      id: `consent-${Date.now()}`,
      userId: userId || (session?.user?.id),
      purpose,
      legalBasis,
      isConsented,
      consentDate: isConsented ? new Date().toISOString() : null,
      withdrawalDate: !isConsented ? new Date().toISOString() : null,
      version,
      metadata: {
        ...metadata,
        ipAddress: clientIP,
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      }
    }

    // Log the consent action
    logSecurityEvent(
      isConsented ? 'CONSENT_GIVEN' : 'CONSENT_WITHDRAWN',
      'Consent',
      session?.user?.id,
      request,
      {
        purpose,
        legalBasis,
        consentId: consentRecord.id
      }
    )

    return NextResponse.json({
      success: true,
      consent: consentRecord,
      message: `Consentement ${isConsented ? 'enregistré' : 'retiré'} avec succès`
    })

  } catch (error) {
    console.error('Error recording consent:', error)
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

    const { consentId, isConsented, reason } = await request.json()

    if (!consentId || typeof isConsented !== 'boolean') {
      return NextResponse.json(
        { error: 'Données de mise à jour invalides' },
        { status: 400 }
      )
    }

    // Update consent (mock - in production, update database)
    const updatedConsent = {
      id: consentId,
      isConsented,
      [isConsented ? 'consentDate' : 'withdrawalDate']: new Date().toISOString(),
      metadata: {
        updatedBy: session.user.id,
        reason,
        updateTimestamp: new Date().toISOString()
      }
    }

    // Log the consent update
    logSecurityEvent(
      'CONSENT_UPDATED',
      'Consent',
      session.user.id,
      request,
      {
        consentId,
        newStatus: isConsented,
        reason
      }
    )

    return NextResponse.json({
      success: true,
      consent: updatedConsent,
      message: 'Consentement mis à jour avec succès'
    })

  } catch (error) {
    console.error('Error updating consent:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

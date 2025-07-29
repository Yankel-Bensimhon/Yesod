import { NextRequest, NextResponse } from 'next/server'
import { CommunicationManager } from '@/lib/communication-service'

// POST /api/communication/send - Envoi de communication automatique
export async function POST(request: NextRequest) {
  try {
    // Simulation de session pour la démo
    const session = { user: { role: 'LAWYER' } }
    
    if (!session || session.user.role !== 'LAWYER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { caseId, trigger } = await request.json()
    
    if (!caseId || !trigger) {
      return NextResponse.json({ 
        error: 'Case ID and trigger are required' 
      }, { status: 400 })
    }

    const validTriggers = ['overdue_1d', 'overdue_7d', 'overdue_15d', 'payment_received']
    if (!validTriggers.includes(trigger)) {
      return NextResponse.json({ 
        error: 'Invalid trigger type' 
      }, { status: 400 })
    }

    const communications = await CommunicationManager.sendAutomatedCommunication(caseId, trigger)
    
    return NextResponse.json({
      success: true,
      message: `Sent ${communications.length} communications`,
      communications: communications.map(c => ({
        id: c.id,
        type: c.type,
        recipient: c.recipient,
        status: c.status,
        sentAt: c.sentAt
      }))
    })
  } catch (error) {
    console.error('Error sending communication:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/communication/history/:caseId - Historique communications d'un dossier
export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    // Simulation de session pour la démo
    const session = { user: { role: 'LAWYER' } }
    
    if (!session || session.user.role !== 'LAWYER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { caseId } = params
    
    if (!caseId) {
      return NextResponse.json({ error: 'Case ID required' }, { status: 400 })
    }

    const history = await CommunicationManager.getCommunicationHistory(caseId)
    
    return NextResponse.json({
      success: true,
      history
    })
  } catch (error) {
    console.error('Error fetching communication history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

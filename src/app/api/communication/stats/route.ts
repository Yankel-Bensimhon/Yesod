import { NextRequest, NextResponse } from 'next/server'
import { CommunicationManager } from '@/lib/communication-service'

// GET /api/communication/stats - Statistiques de communication
export async function GET(request: NextRequest) {
  try {
    // Simulation de session pour la démo
    const session = { user: { role: 'LAWYER' } }
    
    if (!session || session.user.role !== 'LAWYER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await CommunicationManager.getCommunicationStats()
    
    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Error fetching communication stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

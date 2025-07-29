import { NextRequest, NextResponse } from 'next/server'
import { CaseScoringEngine } from '@/lib/workflow-automation'

// GET /api/workflow/scoring/:caseId - Score de recouvrabilité d'un dossier
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

    const scoring = await CaseScoringEngine.calculateRecoverabilityScore(caseId)
    
    return NextResponse.json({
      success: true,
      scoring
    })
  } catch (error) {
    console.error('Error calculating case score:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/workflow/scoring/batch - Scores multiples
export async function POST(request: NextRequest) {
  try {
    // Simulation de session pour la démo
    const session = { user: { role: 'LAWYER' } }
    
    if (!session || session.user.role !== 'LAWYER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()

    if (action === 'update_all') {
      const scores = await CaseScoringEngine.updateAllScores()
      return NextResponse.json({
        success: true,
        message: `Updated ${scores.length} case scores`,
        scores
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating case scores:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

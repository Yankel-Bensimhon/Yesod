import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import WorkflowEngine, { CaseScoringEngine, PredictiveAnalytics } from '@/lib/workflow-automation'

// GET /api/workflow/triggers - Liste des déclencheurs actifs
export async function GET(request: NextRequest) {
  try {
    // Simulation de session pour la démo
    const session = { user: { role: 'LAWYER' } }
    
    if (!session || session.user.role !== 'LAWYER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workflows = await WorkflowEngine.getActiveWorkflows()
    return NextResponse.json({
      success: true,
      workflows
    })
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/workflow/triggers - Traitement manuel des workflows
export async function POST(request: NextRequest) {
  try {
    // Simulation de session pour la démo
    const session = { user: { role: 'LAWYER' } }
    
    if (!session || session.user.role !== 'LAWYER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()

    if (action === 'process_all') {
      await WorkflowEngine.processWorkflows()
      return NextResponse.json({
        success: true,
        message: 'Workflows processed successfully'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing workflows:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

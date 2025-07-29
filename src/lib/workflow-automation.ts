// =====================================
// PHASE 2 - WORKFLOW AUTOMATION ENGINE
// =====================================

import { prisma } from './prisma'

// Types pour le workflow
export interface WorkflowTrigger {
  id: string
  name: string
  conditions: WorkflowCondition[]
  actions: WorkflowAction[]
  isActive: boolean
  priority: number
}

export interface WorkflowCondition {
  field: string
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'days_since'
  value: string | number | Date
}

export interface WorkflowAction {
  type: 'send_email' | 'send_sms' | 'create_task' | 'update_status' | 'schedule_call' | 'generate_document'
  template?: string
  parameters: Record<string, any>
  delay?: number // minutes
}

export interface CaseScoring {
  caseId: string
  recoverabilityScore: number // 0-100
  priorityLevel: 'low' | 'medium' | 'high' | 'critical'
  recommendedActions: string[]
  lastUpdated: Date
}

// =====================================
// WORKFLOW ENGINE PRINCIPAL
// =====================================

export class WorkflowEngine {
  
  // Déclenchement automatique des workflows
  static async processWorkflows() {
    try {
      const activeWorkflows = await WorkflowEngine.getActiveWorkflows()
      
      for (const workflow of activeWorkflows) {
        await WorkflowEngine.executeWorkflow(workflow)
      }
      
      console.log(`Processed ${activeWorkflows.length} workflows`)
    } catch (error) {
      console.error('Error processing workflows:', error)
    }
  }

  // Récupération des workflows actifs
  static async getActiveWorkflows(): Promise<WorkflowTrigger[]> {
    return [
      {
        id: 'overdue-reminder-1',
        name: 'Premier rappel créance échue',
        conditions: [
          { field: 'dueDate', operator: 'days_since', value: 1 },
          { field: 'status', operator: 'equals', value: 'OPEN' }
        ],
        actions: [
          {
            type: 'send_email',
            template: 'first_reminder',
            parameters: { urgency: 'medium' }
          },
          {
            type: 'create_task',
            parameters: { 
              title: 'Suivre premier rappel',
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
          }
        ],
        isActive: true,
        priority: 1
      },
      {
        id: 'overdue-reminder-2',
        name: 'Rappel urgent - 7 jours',
        conditions: [
          { field: 'dueDate', operator: 'days_since', value: 7 },
          { field: 'status', operator: 'equals', value: 'OPEN' }
        ],
        actions: [
          {
            type: 'send_email',
            template: 'urgent_reminder',
            parameters: { urgency: 'high' }
          },
          {
            type: 'send_sms',
            template: 'urgent_sms',
            parameters: {}
          },
          {
            type: 'update_status',
            parameters: { newStatus: 'URGENT' }
          }
        ],
        isActive: true,
        priority: 2
      },
      {
        id: 'formal-notice-trigger',
        name: 'Déclenchement mise en demeure',
        conditions: [
          { field: 'dueDate', operator: 'days_since', value: 15 },
          { field: 'status', operator: 'equals', value: 'URGENT' }
        ],
        actions: [
          {
            type: 'generate_document',
            template: 'formal_notice',
            parameters: { documentType: 'FORMAL_NOTICE' }
          },
          {
            type: 'schedule_call',
            parameters: { 
              priority: 'high',
              scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
            }
          }
        ],
        isActive: true,
        priority: 3
      }
    ]
  }

  // Exécution d'un workflow spécifique
  static async executeWorkflow(workflow: WorkflowTrigger) {
    try {
      const eligibleCases = await WorkflowEngine.findEligibleCases(workflow.conditions)
      
      for (const caseItem of eligibleCases) {
        for (const action of workflow.actions) {
          await WorkflowEngine.executeAction(action, caseItem)
        }
      }
      
      console.log(`Workflow ${workflow.name} executed for ${eligibleCases.length} cases`)
    } catch (error) {
      console.error(`Error executing workflow ${workflow.name}:`, error)
    }
  }

  // Recherche des dossiers éligibles
  static async findEligibleCases(conditions: WorkflowCondition[]) {
    // Simulation - en production, on utiliserait Prisma avec des requêtes complexes
    const allCases = await prisma.case.findMany({
      include: {
        client: true,
        actions: true
      }
    })

    return allCases.filter(caseItem => {
      return conditions.every(condition => {
        switch (condition.operator) {
          case 'days_since':
            if (condition.field === 'dueDate') {
              const dueDate = new Date(caseItem.dueDate || Date.now())
              const daysSince = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
              return daysSince >= condition.value
            }
            return false
          case 'equals':
            return (caseItem as any)[condition.field] === condition.value
          default:
            return false
        }
      })
    })
  }

  // Exécution d'une action
  static async executeAction(action: WorkflowAction, caseItem: any) {
    try {
      switch (action.type) {
        case 'send_email':
          await EmailAutomation.sendAutomatedEmail(
            caseItem,
            action.template || 'default',
            action.parameters
          )
          break
        
        case 'send_sms':
          await SMSAutomation.sendAutomatedSMS(
            caseItem,
            action.template || 'default',
            action.parameters
          )
          break
        
        case 'create_task':
          await TaskAutomation.createTask(caseItem, action.parameters)
          break
        
        case 'update_status':
          await prisma.case.update({
            where: { id: caseItem.id },
            data: { status: action.parameters.newStatus }
          })
          break
        
        case 'generate_document':
          await DocumentAutomation.generateDocument(caseItem, action.parameters)
          break
        
        case 'schedule_call':
          await CalendarAutomation.scheduleCall(caseItem, action.parameters)
          break
      }
    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error)
    }
  }
}

// =====================================
// SYSTÈME DE SCORING INTELLIGENT
// =====================================

export class CaseScoringEngine {
  
  // Calcul du score de recouvrabilité
  static async calculateRecoverabilityScore(caseId: string): Promise<CaseScoring> {
    try {
      const caseData = await prisma.case.findUnique({
        where: { id: caseId },
        include: {
          client: true,
          actions: true,
          documents: true
        }
      })

      if (!caseData) {
        throw new Error('Case not found')
      }

      let score = 50 // Score de base

      // Facteurs positifs
      if (caseData.amount && caseData.amount < 5000) score += 20 // Petits montants plus faciles
      if (caseData.actions.length > 0) score += 15 // Actions déjà entreprises
      if (caseData.client.type === 'CORPORATE') score += 10 // Entreprises plus solvables
      if (caseData.documents.length >= 3) score += 10 // Bonne documentation

      // Facteurs négatifs
      const daysOverdue = caseData.dueDate ? 
        Math.floor((Date.now() - new Date(caseData.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0
      
      if (daysOverdue > 90) score -= 30 // Très ancien
      else if (daysOverdue > 30) score -= 15 // Ancien
      
      if (caseData.amount && caseData.amount > 50000) score -= 15 // Gros montants plus difficiles

      // Limites
      score = Math.max(0, Math.min(100, score))

      // Niveau de priorité basé sur le score
      let priorityLevel: 'low' | 'medium' | 'high' | 'critical'
      if (score >= 80) priorityLevel = 'high'
      else if (score >= 60) priorityLevel = 'medium'
      else if (score >= 30) priorityLevel = 'low'
      else priorityLevel = 'critical'

      // Recommandations basées sur le score
      const recommendedActions = CaseScoringEngine.generateRecommendations(score, daysOverdue, caseData)

      return {
        caseId,
        recoverabilityScore: score,
        priorityLevel,
        recommendedActions,
        lastUpdated: new Date()
      }
    } catch (error) {
      console.error('Error calculating recoverability score:', error)
      throw error
    }
  }

  // Génération de recommandations d'actions
  static generateRecommendations(score: number, daysOverdue: number, caseData: any): string[] {
    const recommendations: string[] = []

    if (score >= 70) {
      recommendations.push('Priorité élevée - Relance téléphonique immédiate')
      recommendations.push('Proposer un plan de paiement')
    } else if (score >= 50) {
      recommendations.push('Envoyer une mise en demeure')
      recommendations.push('Programmer un RDV de négociation')
    } else if (score >= 30) {
      recommendations.push('Évaluer la solvabilité du débiteur')
      recommendations.push('Envisager une procédure judiciaire')
    } else {
      recommendations.push('Considérer un abandon de créance')
      recommendations.push('Transférer vers une société de recouvrement')
    }

    if (daysOverdue > 60) {
      recommendations.push('Urgence - Action immédiate requise')
    }

    if (caseData.client.type === 'CORPORATE') {
      recommendations.push('Vérifier la situation financière entreprise')
    }

    return recommendations
  }

  // Mise à jour des scores pour tous les dossiers
  static async updateAllScores() {
    try {
      const allCases = await prisma.case.findMany({
        select: { id: true }
      })

      const scores = await Promise.all(
        allCases.map(c => CaseScoringEngine.calculateRecoverabilityScore(c.id))
      )

      console.log(`Updated scores for ${scores.length} cases`)
      return scores
    } catch (error) {
      console.error('Error updating all scores:', error)
      throw error
    }
  }
}

// =====================================
// AUTOMATION MODULES
// =====================================

export class EmailAutomation {
  static async sendAutomatedEmail(caseItem: any, template: string, parameters: any) {
    console.log(`Sending email for case ${caseItem.id} using template ${template}`)
    // Implémentation réelle avec service email (SendGrid, etc.)
  }
}

export class SMSAutomation {
  static async sendAutomatedSMS(caseItem: any, template: string, parameters: any) {
    console.log(`Sending SMS for case ${caseItem.id} using template ${template}`)
    // Implémentation réelle avec service SMS (Twilio, etc.)
  }
}

export class TaskAutomation {
  static async createTask(caseItem: any, parameters: any) {
    console.log(`Creating task for case ${caseItem.id}:`, parameters.title)
    // Création de tâche dans le système
  }
}

export class DocumentAutomation {
  static async generateDocument(caseItem: any, parameters: any) {
    console.log(`Generating document for case ${caseItem.id}:`, parameters.documentType)
    // Génération automatique de documents
  }
}

export class CalendarAutomation {
  static async scheduleCall(caseItem: any, parameters: any) {
    console.log(`Scheduling call for case ${caseItem.id}`)
    // Programmation d'appel dans l'agenda
  }
}

// =====================================
// INTELLIGENCE ARTIFICIELLE PRÉDICTIVE
// =====================================

export class PredictiveAnalytics {
  
  // Prédiction de probabilité de paiement
  static async predictPaymentProbability(caseId: string): Promise<{
    probability: number
    confidence: number
    factors: string[]
  }> {
    // Simulation d'IA - en production, utiliser un modèle ML réel
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: { client: true, actions: true }
    })

    if (!caseData) throw new Error('Case not found')

    // Facteurs simulés
    let probability = 0.5
    const factors: string[] = []

    if (caseData.client.type === 'CORPORATE') {
      probability += 0.2
      factors.push('Type entreprise (+20%)')
    }

    if (caseData.amount && caseData.amount < 10000) {
      probability += 0.15
      factors.push('Montant raisonnable (+15%)')
    }

    if (caseData.actions.length > 2) {
      probability += 0.1
      factors.push('Actions multiples (+10%)')
    }

    const daysOverdue = caseData.dueDate ? 
      Math.floor((Date.now() - new Date(caseData.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0
    
    if (daysOverdue > 90) {
      probability -= 0.3
      factors.push('Très ancien (-30%)')
    }

    probability = Math.max(0, Math.min(1, probability))

    return {
      probability: Math.round(probability * 100),
      confidence: 85, // Confiance du modèle
      factors
    }
  }

  // Optimisation des stratégies par profil débiteur
  static async optimizeStrategy(clientId: string): Promise<{
    strategy: string
    expectedSuccess: number
    recommendedActions: string[]
  }> {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { cases: true }
    })

    if (!client) throw new Error('Client not found')

    // Analyse du profil
    const totalAmount = client.cases.reduce((sum, c) => sum + (c.amount || 0), 0)
    const caseCount = client.cases.length

    let strategy = 'Standard'
    let expectedSuccess = 60

    if (client.type === 'CORPORATE' && totalAmount > 50000) {
      strategy = 'Corporate High-Value'
      expectedSuccess = 75
    } else if (caseCount > 3) {
      strategy = 'Multi-Case Client'
      expectedSuccess = 45
    } else if (totalAmount < 5000) {
      strategy = 'Small Claims Fast Track'
      expectedSuccess = 80
    }

    return {
      strategy,
      expectedSuccess,
      recommendedActions: [
        'Analyse approfondie du profil',
        'Adaptation de la communication',
        'Suivi personnalisé'
      ]
    }
  }
}

// Export par défaut
export default WorkflowEngine

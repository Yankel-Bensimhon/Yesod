import { PrismaClient } from '@prisma/client';
import { CacheService } from '../redis';
import { captureBusinessError } from '../sentry';

const prisma = new PrismaClient();
const cache = CacheService.getInstance();

export interface WorkflowAction {
  id: string;
  type: 'email' | 'sms' | 'call' | 'letter' | 'legal';
  delay: number; // jours
  template: string;
  condition?: (caseData: any) => boolean;
}

export interface WorkflowConfig {
  id: string;
  name: string;
  description: string;
  triggers: {
    daysOverdue: number;
    amount: { min?: number; max?: number };
    debtorType: 'individual' | 'company' | 'all';
  };
  actions: WorkflowAction[];
  isActive: boolean;
}

// Workflows prédéfinis pour cabinets d'avocats
export const DEFAULT_WORKFLOWS: WorkflowConfig[] = [
  {
    id: 'standard-recovery',
    name: 'Recouvrement Standard',
    description: 'Workflow classique pour créances inférieures à 10 000€',
    triggers: {
      daysOverdue: 0,
      amount: { max: 10000 },
      debtorType: 'all'
    },
    actions: [
      {
        id: 'reminder-1',
        type: 'email',
        delay: 7,
        template: 'gentle-reminder',
        condition: (data) => data.amount < 5000
      },
      {
        id: 'formal-notice',
        type: 'letter',
        delay: 15,
        template: 'formal-notice'
      },
      {
        id: 'phone-call',
        type: 'call',
        delay: 30,
        template: 'negotiation-call'
      },
      {
        id: 'legal-action',
        type: 'legal',
        delay: 60,
        template: 'legal-proceedings'
      }
    ],
    isActive: true
  },
  {
    id: 'high-value-recovery',
    name: 'Recouvrement Créances Importantes',
    description: 'Workflow personnalisé pour créances > 10 000€',
    triggers: {
      daysOverdue: 0,
      amount: { min: 10000 },
      debtorType: 'all'
    },
    actions: [
      {
        id: 'personal-contact',
        type: 'call',
        delay: 3,
        template: 'high-value-contact'
      },
      {
        id: 'formal-email',
        type: 'email',
        delay: 7,
        template: 'formal-demand'
      },
      {
        id: 'registered-letter',
        type: 'letter',
        delay: 14,
        template: 'registered-notice'
      },
      {
        id: 'legal-consultation',
        type: 'legal',
        delay: 21,
        template: 'legal-strategy-meeting'
      }
    ],
    isActive: true
  },
  {
    id: 'company-recovery',
    name: 'Recouvrement Entreprises',
    description: 'Workflow spécialisé pour débiteurs entreprises',
    triggers: {
      daysOverdue: 0,
      amount: { min: 1000 },
      debtorType: 'company'
    },
    actions: [
      {
        id: 'b2b-reminder',
        type: 'email',
        delay: 5,
        template: 'b2b-payment-reminder'
      },
      {
        id: 'account-manager-call',
        type: 'call',
        delay: 10,
        template: 'b2b-negotiation'
      },
      {
        id: 'payment-plan',
        type: 'email',
        delay: 20,
        template: 'payment-plan-offer'
      },
      {
        id: 'commercial-court',
        type: 'legal',
        delay: 45,
        template: 'commercial-proceedings'
      }
    ],
    isActive: true
  }
];

export class RecoveryWorkflowEngine {
  private static instance: RecoveryWorkflowEngine;

  public static getInstance(): RecoveryWorkflowEngine {
    if (!RecoveryWorkflowEngine.instance) {
      RecoveryWorkflowEngine.instance = new RecoveryWorkflowEngine();
    }
    return RecoveryWorkflowEngine.instance;
  }

  // Évaluer tous les dossiers pour déclencher les workflows
  async evaluateAllCases(): Promise<void> {
    try {
      const overdueCases = await prisma.case.findMany({
        where: {
          status: {
            in: ['OPEN', 'IN_PROGRESS']
          },
          dueDate: {
            lt: new Date()
          }
        },
        include: {
          client: true,
          debtor: true,
          actions: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      console.log(`🔍 Évaluation de ${overdueCases.length} dossiers en retard`);

      for (const caseData of overdueCases) {
        await this.evaluateCase(caseData);
      }

      // Mettre en cache le résultat
      await cache.set('last-workflow-evaluation', new Date().toISOString(), 3600);

    } catch (error) {
      captureBusinessError(error as Error, {
        component: 'workflow',
        action: 'workflow-evaluation',
        metadata: {
          operation: 'evaluate-all-cases'
        }
      });
      throw error;
    }
  }

  // Évaluer un dossier spécifique
  private async evaluateCase(caseData: any): Promise<void> {
    const daysOverdue = Math.floor(
      (new Date().getTime() - new Date(caseData.dueDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log(`📊 Dossier ${caseData.reference}: ${daysOverdue} jours de retard`);

    for (const workflow of DEFAULT_WORKFLOWS) {
      if (await this.shouldTriggerWorkflow(workflow, caseData, daysOverdue)) {
        await this.executeWorkflow(workflow, caseData, daysOverdue);
      }
    }
  }

  // Vérifier si un workflow doit être déclenché
  private async shouldTriggerWorkflow(
    workflow: WorkflowConfig,
    caseData: any,
    daysOverdue: number
  ): Promise<boolean> {
    if (!workflow.isActive) return false;

    // Vérifier les conditions de déclenchement
    if (daysOverdue < workflow.triggers.daysOverdue) return false;

    if (workflow.triggers.amount?.min && caseData.amount < workflow.triggers.amount.min) {
      return false;
    }

    if (workflow.triggers.amount?.max && caseData.amount > workflow.triggers.amount.max) {
      return false;
    }

    if (workflow.triggers.debtorType !== 'all') {
      const debtorType = caseData.debtor.type || 'individual';
      if (debtorType !== workflow.triggers.debtorType) return false;
    }

    // Vérifier si le workflow n'a pas déjà été exécuté récemment
    const lastExecution = await cache.get(`workflow-${workflow.id}-case-${caseData.id}`);
    if (lastExecution) {
      const lastExecutionDate = new Date(lastExecution);
      const hoursSinceLastExecution = (new Date().getTime() - lastExecutionDate.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastExecution < 24) return false; // Éviter les doublons
    }

    return true;
  }

  // Exécuter un workflow
  private async executeWorkflow(
    workflow: WorkflowConfig,
    caseData: any,
    daysOverdue: number
  ): Promise<void> {
    console.log(`⚙️ Exécution workflow "${workflow.name}" pour dossier ${caseData.reference}`);

    for (const action of workflow.actions) {
      if (daysOverdue >= action.delay) {
        // Vérifier la condition si elle existe
        if (action.condition && !action.condition(caseData)) {
          continue;
        }

        await this.executeAction(action, caseData, workflow);
      }
    }

    // Marquer le workflow comme exécuté
    await cache.set(
      `workflow-${workflow.id}-case-${caseData.id}`,
      new Date().toISOString(),
      86400 // 24h
    );
  }

  // Exécuter une action spécifique
  private async executeAction(
    action: WorkflowAction,
    caseData: any,
    workflow: WorkflowConfig
  ): Promise<void> {
    try {
      // Vérifier si l'action n'a pas déjà été exécutée
      const actionKey = `action-${action.id}-case-${caseData.id}`;
      const lastActionExecution = await cache.get(actionKey);
      
      if (lastActionExecution) {
        console.log(`⏭️ Action ${action.id} déjà exécutée pour ${caseData.reference}`);
        return;
      }

      // Créer l'action dans la base de données
      const newAction = await prisma.caseAction.create({
        data: {
          caseId: caseData.id,
          type: action.type.toUpperCase(),
          description: `Workflow ${workflow.name}: ${action.template}`,
          status: 'SCHEDULED',
          scheduledDate: new Date(),
          metadata: {
            workflowId: workflow.id,
            actionId: action.id,
            template: action.template,
            automated: true
          }
        }
      });

      console.log(`✅ Action ${action.type} programmée pour ${caseData.reference} (ID: ${newAction.id})`);

      // Programmer l'exécution effective selon le type d'action
      await this.scheduleActionExecution(action, caseData, newAction.id);

      // Marquer l'action comme programmée
      await cache.set(actionKey, new Date().toISOString(), 86400 * 7); // 7 jours

    } catch (error) {
      captureBusinessError(error as Error, {
        component: 'workflow',
        action: 'workflow-action-execution',
        metadata: {
          actionType: action.type,
          caseId: caseData.id,
          workflowId: workflow.id
        }
      });
    }
  }

  // Programmer l'exécution effective d'une action
  private async scheduleActionExecution(
    action: WorkflowAction,
    caseData: any,
    actionId: string
  ): Promise<void> {
    switch (action.type) {
      case 'email':
        // Intégration avec le service d'email
        console.log(`📧 Email programmé: ${action.template} pour ${caseData.debtor.email}`);
        break;

      case 'sms':
        // Intégration avec le service SMS
        console.log(`📱 SMS programmé: ${action.template} pour ${caseData.debtor.phone}`);
        break;

      case 'call':
        // Créer une tâche pour l'équipe
        console.log(`📞 Appel à programmer: ${action.template} pour ${caseData.debtor.name}`);
        break;

      case 'letter':
        // Générer automatiquement la lettre
        console.log(`📄 Courrier à générer: ${action.template} pour ${caseData.debtor.name}`);
        break;

      case 'legal':
        // Escalader vers l'équipe juridique
        console.log(`⚖️ Action juridique: ${action.template} pour dossier ${caseData.reference}`);
        break;
    }
  }

  // Obtenir les statistiques des workflows
  async getWorkflowStats(): Promise<any> {
    try {
      const cacheKey = 'workflow-stats';
      const cached = await cache.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const stats = {
        totalWorkflowsExecuted: await this.countWorkflowExecutions(),
        actionsByType: await this.getActionStatsByType(),
        successRate: await this.calculateSuccessRate(),
        averageRecoveryTime: await this.calculateAverageRecoveryTime(),
        topPerformingWorkflows: await this.getTopPerformingWorkflows()
      };

      await cache.set(cacheKey, JSON.stringify(stats), 1800); // 30 minutes
      return stats;

    } catch (error) {
      captureBusinessError(error as Error, {
        component: 'workflow',
        action: 'workflow-stats',
        metadata: {
          operation: 'get-stats'
        }
      });
      return {};
    }
  }

  private async countWorkflowExecutions(): Promise<number> {
    return await prisma.caseAction.count({
      where: {
        metadata: {
          path: ['automated'],
          equals: true
        }
      }
    });
  }

  private async getActionStatsByType(): Promise<Record<string, number>> {
    const actions = await prisma.caseAction.groupBy({
      by: ['type'],
      _count: {
        type: true
      },
      where: {
        metadata: {
          path: ['automated'],
          equals: true
        }
      }
    });

    return actions.reduce((acc, action) => {
      acc[action.type] = action._count.type;
      return acc;
    }, {} as Record<string, number>);
  }

  private async calculateSuccessRate(): Promise<number> {
    const totalActions = await prisma.caseAction.count({
      where: {
        metadata: {
          path: ['automated'],
          equals: true
        }
      }
    });

    const completedActions = await prisma.caseAction.count({
      where: {
        metadata: {
          path: ['automated'],
          equals: true
        },
        status: 'COMPLETED'
      }
    });

    return totalActions > 0 ? (completedActions / totalActions) * 100 : 0;
  }

  private async calculateAverageRecoveryTime(): Promise<number> {
    const recoveredCases = await prisma.case.findMany({
      where: {
        status: 'RECOVERED',
        updatedAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 derniers jours
        }
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    });

    if (recoveredCases.length === 0) return 0;

    const totalDays = recoveredCases.reduce((sum, caseData) => {
      const days = Math.floor(
        (caseData.updatedAt.getTime() - caseData.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);

    return totalDays / recoveredCases.length;
  }

  private async getTopPerformingWorkflows(): Promise<any[]> {
    // Analyse des workflows les plus efficaces
    const workflowPerformance = DEFAULT_WORKFLOWS.map(workflow => ({
      id: workflow.id,
      name: workflow.name,
      // Ici on pourrait calculer le taux de succès par workflow
      // en analysant les actions et les résultats
    }));

    return workflowPerformance;
  }
}

// Fonction utilitaire pour démarrer l'évaluation périodique
export async function startWorkflowEngine(): Promise<void> {
  const engine = RecoveryWorkflowEngine.getInstance();
  
  console.log('🚀 Démarrage du moteur de workflow de recouvrement');
  
  // Évaluation initiale
  await engine.evaluateAllCases();
  
  // Programmer l'évaluation toutes les heures
  setInterval(async () => {
    try {
      await engine.evaluateAllCases();
    } catch (error) {
      console.error('❌ Erreur lors de l\'évaluation des workflows:', error);
    }
  }, 60 * 60 * 1000); // Toutes les heures
}

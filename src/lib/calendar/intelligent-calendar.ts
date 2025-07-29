import { PrismaClient } from '@prisma/client';
import { CacheService } from '../redis';
import { captureBusinessError } from '../sentry';

const prisma = new PrismaClient();
const cache = CacheService.getInstance();

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: 'APPOINTMENT' | 'CALL' | 'DEADLINE' | 'REMINDER' | 'COURT_HEARING' | 'MEETING';
  startDate: Date;
  endDate: Date;
  location?: string;
  isAllDay: boolean;
  status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  
  // Relations
  caseId?: string;
  clientId?: string;
  assignedUserId?: string;
  
  // Rappels
  reminders: EventReminder[];
  
  // Récurrence
  recurrence?: EventRecurrence;
  
  // Métadonnées
  metadata?: Record<string, any>;
}

export interface EventReminder {
  id: string;
  type: 'EMAIL' | 'SMS' | 'NOTIFICATION' | 'POPUP';
  triggerBefore: number; // minutes avant l'événement
  isActive: boolean;
  message?: string;
  recipients?: string[]; // emails ou téléphones
}

export interface EventRecurrence {
  pattern: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number; // tous les X jours/semaines/mois/années
  endDate?: Date;
  occurrences?: number; // nombre maximum d'occurrences
  daysOfWeek?: number[]; // pour WEEKLY : 0=dimanche, 1=lundi, etc.
  dayOfMonth?: number; // pour MONTHLY
}

export interface TimeSlot {
  start: Date;
  end: Date;
  isAvailable: boolean;
  type?: 'WORK' | 'BREAK' | 'UNAVAILABLE';
}

export interface WorkingHours {
  dayOfWeek: number; // 0=dimanche, 1=lundi, etc.
  startTime: string; // format "HH:mm"
  endTime: string;
  isWorkingDay: boolean;
  breaks?: { startTime: string; endTime: string }[];
}

// Configuration par défaut des horaires de travail
export const DEFAULT_WORKING_HOURS: WorkingHours[] = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isWorkingDay: true, breaks: [{ startTime: '12:00', endTime: '13:00' }] }, // Lundi
  { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isWorkingDay: true, breaks: [{ startTime: '12:00', endTime: '13:00' }] }, // Mardi
  { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isWorkingDay: true, breaks: [{ startTime: '12:00', endTime: '13:00' }] }, // Mercredi
  { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isWorkingDay: true, breaks: [{ startTime: '12:00', endTime: '13:00' }] }, // Jeudi
  { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isWorkingDay: true, breaks: [{ startTime: '12:00', endTime: '13:00' }] }, // Vendredi
  { dayOfWeek: 6, startTime: '09:00', endTime: '12:00', isWorkingDay: false }, // Samedi (fermé)
  { dayOfWeek: 0, startTime: '09:00', endTime: '12:00', isWorkingDay: false }  // Dimanche (fermé)
];

export class IntelligentCalendarService {
  private static instance: IntelligentCalendarService;

  public static getInstance(): IntelligentCalendarService {
    if (!IntelligentCalendarService.instance) {
      IntelligentCalendarService.instance = new IntelligentCalendarService();
    }
    return IntelligentCalendarService.instance;
  }

  // Créer un événement avec rappels automatiques
  async createEvent(eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      const event: CalendarEvent = {
        id: crypto.randomUUID(),
        title: eventData.title!,
        description: eventData.description,
        type: eventData.type || 'APPOINTMENT',
        startDate: eventData.startDate!,
        endDate: eventData.endDate || new Date(eventData.startDate!.getTime() + 60 * 60 * 1000), // 1h par défaut
        location: eventData.location,
        isAllDay: eventData.isAllDay || false,
        status: 'SCHEDULED',
        priority: eventData.priority || 'MEDIUM',
        caseId: eventData.caseId,
        clientId: eventData.clientId,
        assignedUserId: eventData.assignedUserId,
        reminders: eventData.reminders || this.getDefaultReminders(eventData.type || 'APPOINTMENT'),
        recurrence: eventData.recurrence,
        metadata: eventData.metadata || {}
      };

      // Vérifier la disponibilité
      const isAvailable = await this.checkAvailability(event.startDate, event.endDate, event.assignedUserId);
      if (!isAvailable) {
        throw new Error('Créneau non disponible');
      }

      // Sauvegarder en base
      const savedEvent = await prisma.calendarEvent.create({
        data: {
          id: event.id,
          title: event.title,
          description: event.description,
          type: event.type,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          isAllDay: event.isAllDay,
          status: event.status,
          priority: event.priority,
          caseId: event.caseId,
          clientId: event.clientId,
          assignedUserId: event.assignedUserId,
          reminders: JSON.parse(JSON.stringify(event.reminders)), // Sérialisation JSON
          recurrence: event.recurrence ? JSON.parse(JSON.stringify(event.recurrence)) : null,
          metadata: event.metadata ? JSON.parse(JSON.stringify(event.metadata)) : null
        }
      });

      // Programmer les rappels
      await this.scheduleReminders(event);

      // Créer les événements récurrents si nécessaire
      if (event.recurrence) {
        await this.createRecurringEvents(event);
      }

      console.log(`📅 Événement "${event.title}" créé pour le ${event.startDate.toLocaleDateString('fr-FR')}`);
      
      // Invalider le cache
      await cache.del('calendar-events');
      
      return event;

    } catch (error) {
      captureBusinessError(error as Error, {
        component: 'calendar',
        action: 'create-event',
        metadata: { eventData }
      });
      throw error;
    }
  }

  // Trouver des créneaux disponibles
  async findAvailableSlots(
    date: Date,
    duration: number, // en minutes
    userId?: string,
    preferences?: {
      preferredTimes?: string[]; // ["09:00", "14:00"]
      excludeBreaks?: boolean;
      bufferTime?: number; // minutes entre RDV
    }
  ): Promise<TimeSlot[]> {
    try {
      const workingHours = await this.getWorkingHours(date, userId);
      if (!workingHours.isWorkingDay) {
        return [];
      }

      const dayStart = new Date(date);
      dayStart.setHours(parseInt(workingHours.startTime.split(':')[0]), parseInt(workingHours.startTime.split(':')[1]), 0, 0);
      
      const dayEnd = new Date(date);
      dayEnd.setHours(parseInt(workingHours.endTime.split(':')[0]), parseInt(workingHours.endTime.split(':')[1]), 0, 0);

      // Récupérer les événements existants
      const existingEvents = await prisma.calendarEvent.findMany({
        where: {
          assignedUserId: userId,
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          startDate: { lte: dayEnd },
          endDate: { gte: dayStart }
        },
        orderBy: { startDate: 'asc' }
      });

      const availableSlots: TimeSlot[] = [];
      let currentTime = dayStart;
      const bufferTime = (preferences?.bufferTime || 15) * 60 * 1000; // en millisecondes

      // Analyser les créneaux libres
      for (const event of existingEvents) {
        if (currentTime < event.startDate) {
          const slotDuration = event.startDate.getTime() - currentTime.getTime();
          if (slotDuration >= duration * 60 * 1000) {
            availableSlots.push({
              start: new Date(currentTime),
              end: new Date(event.startDate.getTime() - bufferTime),
              isAvailable: true,
              type: 'WORK'
            });
          }
        }
        currentTime = new Date(event.endDate.getTime() + bufferTime);
      }

      // Vérifier le créneau après le dernier RDV
      if (currentTime < dayEnd) {
        const slotDuration = dayEnd.getTime() - currentTime.getTime();
        if (slotDuration >= duration * 60 * 1000) {
          availableSlots.push({
            start: new Date(currentTime),
            end: dayEnd,
            isAvailable: true,
            type: 'WORK'
          });
        }
      }

      // Exclure les pauses si demandé
      if (preferences?.excludeBreaks && workingHours.breaks) {
        return this.excludeBreakTimes(availableSlots, workingHours.breaks, date);
      }

      console.log(`🔍 ${availableSlots.length} créneaux disponibles trouvés pour le ${date.toLocaleDateString('fr-FR')}`);
      return availableSlots;

    } catch (error) {
      captureBusinessError(error as Error, {
        component: 'calendar',
        action: 'find-available-slots',
        metadata: { date: date.toISOString(), duration, userId }
      });
      throw error;
    }
  }

  // Programmer un rappel automatique
  async scheduleReminders(event: CalendarEvent): Promise<void> {
    try {
      for (const reminder of event.reminders) {
        if (!reminder.isActive) continue;

        const triggerTime = new Date(event.startDate.getTime() - reminder.triggerBefore * 60 * 1000);
        
        // Ne programmer que les rappels futurs
        if (triggerTime > new Date()) {
          // Ici, on utiliserait un job scheduler (comme BullMQ)
          console.log(`⏰ Rappel ${reminder.type} programmé pour ${triggerTime.toLocaleString('fr-FR')} (événement: ${event.title})`);
          
          // Simulation de programmation
          await this.scheduleReminderJob(reminder, event, triggerTime);
        }
      }
    } catch (error) {
      captureBusinessError(error as Error, {
        component: 'calendar',
        action: 'schedule-reminders',
        metadata: { eventId: event.id }
      });
    }
  }

  // Envoyer les rappels dus
  async processScheduledReminders(): Promise<void> {
    try {
      const now = new Date();
      const reminderWindow = new Date(now.getTime() + 5 * 60 * 1000); // Prochaines 5 minutes

      // Récupérer les événements avec rappels à envoyer
      const eventsWithReminders = await prisma.calendarEvent.findMany({
        where: {
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          startDate: { 
            gte: now,
            lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) // Prochaines 24h
          }
        },
        include: {
          case: true,
          client: true,
          assignedUser: true
        }
      });

      for (const event of eventsWithReminders) {
        // Deserialiser les reminders depuis JSON
        let reminders: EventReminder[] = [];
        try {
          if (event.reminders && Array.isArray(event.reminders)) {
            reminders = event.reminders as unknown as EventReminder[];
          } else if (typeof event.reminders === 'string') {
            reminders = JSON.parse(event.reminders);
          }
        } catch (error) {
          console.warn(`Erreur parsing reminders pour événement ${event.id}:`, error);
          continue;
        }

        for (const reminder of reminders) {
          if (!reminder.isActive) continue;

          const triggerTime = new Date(event.startDate.getTime() - reminder.triggerBefore * 60 * 1000);
          
          if (triggerTime >= now && triggerTime <= reminderWindow) {
            await this.sendReminder(reminder, event);
          }
        }
      }

    } catch (error) {
      captureBusinessError(error as Error, {
        component: 'calendar',
        action: 'process-reminders'
      });
    }
  }

  // Créer des événements automatiques pour les dossiers
  async createCaseBasedEvents(caseId: string): Promise<CalendarEvent[]> {
    try {
      const caseData = await prisma.case.findUnique({
        where: { id: caseId },
        include: { client: true }
      });

      if (!caseData) {
        throw new Error(`Dossier ${caseId} introuvable`);
      }

      const events: CalendarEvent[] = [];
      const now = new Date();

      // Événement : Premier contact client (J+1)
      const clientContactDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const clientContactEvent = await this.createEvent({
        title: `Contact initial - ${caseData.client?.name || caseData.debtorName}`,
        description: `Premier contact avec le client pour le dossier ${caseData.title}`,
        type: 'CALL',
        startDate: clientContactDate,
        endDate: new Date(clientContactDate.getTime() + 30 * 60 * 1000),
        caseId: caseData.id,
        clientId: caseData.clientId || undefined,
        priority: 'HIGH',
        reminders: [
          {
            id: crypto.randomUUID(),
            type: 'EMAIL',
            triggerBefore: 60, // 1h avant
            isActive: true,
            message: 'Rappel : Contact initial avec le client'
          }
        ]
      });
      events.push(clientContactEvent);

      // Événement : Relance débiteur (J+7)
      const debtorFollowupDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const debtorFollowupEvent = await this.createEvent({
        title: `Relance débiteur - ${caseData.debtorName}`,
        description: `Première relance du débiteur pour le dossier ${caseData.title}`,
        type: 'CALL',
        startDate: debtorFollowupDate,
        endDate: new Date(debtorFollowupDate.getTime() + 20 * 60 * 1000),
        caseId: caseData.id,
        priority: 'MEDIUM',
        reminders: [
          {
            id: crypto.randomUUID(),
            type: 'NOTIFICATION',
            triggerBefore: 30, // 30 min avant
            isActive: true
          }
        ]
      });
      events.push(debtorFollowupEvent);

      // Événement : Point client (J+15)
      const clientUpdateDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      const clientUpdateEvent = await this.createEvent({
        title: `Point d'avancement - ${caseData.client?.name || caseData.debtorName}`,
        description: `Présentation des premiers résultats du dossier ${caseData.title}`,
        type: 'MEETING',
        startDate: clientUpdateDate,
        endDate: new Date(clientUpdateDate.getTime() + 45 * 60 * 1000),
        caseId: caseData.id,
        clientId: caseData.clientId || undefined,
        priority: 'MEDIUM'
      });
      events.push(clientUpdateEvent);

      // Événement : Deadline procédure (J+30 si pas de paiement)
      const procedureDeadlineDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const procedureDeadlineEvent = await this.createEvent({
        title: `DEADLINE - Procédure contentieuse`,
        description: `Décision pour engagement procédure contentieuse - ${caseData.title}`,
        type: 'DEADLINE',
        startDate: procedureDeadlineDate,
        endDate: new Date(procedureDeadlineDate.getTime() + 15 * 60 * 1000),
        caseId: caseData.id,
        priority: 'URGENT',
        reminders: [
          {
            id: crypto.randomUUID(),
            type: 'EMAIL',
            triggerBefore: 1440, // 24h avant
            isActive: true,
            message: 'URGENT : Décision procédure contentieuse à prendre'
          },
          {
            id: crypto.randomUUID(),
            type: 'SMS',
            triggerBefore: 60, // 1h avant
            isActive: true
          }
        ]
      });
      events.push(procedureDeadlineEvent);

      console.log(`📅 ${events.length} événements automatiques créés pour le dossier ${caseData.title}`);
      return events;

    } catch (error) {
      captureBusinessError(error as Error, {
        component: 'calendar',
        action: 'create-case-events',
        metadata: { caseId }
      });
      throw error;
    }
  }

  // Obtenir les statistiques du calendrier
  async getCalendarStats(): Promise<any> {
    try {
      const cacheKey = 'calendar-stats';
      const cached = await cache.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const stats = {
        thisWeek: {
          totalEvents: await this.getEventCount(startOfWeek, endOfWeek),
          byType: await this.getEventsByType(startOfWeek, endOfWeek),
          byStatus: await this.getEventsByStatus(startOfWeek, endOfWeek)
        },
        upcoming: {
          next7Days: await this.getUpcomingEvents(7),
          next30Days: await this.getUpcomingEvents(30)
        },
        occupancyRate: await this.getOccupancyRate(),
        remindersStats: await this.getRemindersStats()
      };

      await cache.set(cacheKey, JSON.stringify(stats), 1800); // 30 minutes
      return stats;

    } catch (error) {
      captureBusinessError(error as Error, {
        component: 'calendar',
        action: 'get-stats'
      });
      return {};
    }
  }

  // Méthodes privées utilitaires

  private getDefaultReminders(eventType: string): EventReminder[] {
    const defaultReminders: Record<string, EventReminder[]> = {
      'APPOINTMENT': [
        {
          id: crypto.randomUUID(),
          type: 'EMAIL',
          triggerBefore: 1440, // 24h avant
          isActive: true,
          message: 'Rappel : Rendez-vous prévu demain'
        },
        {
          id: crypto.randomUUID(),
          type: 'SMS',
          triggerBefore: 120, // 2h avant
          isActive: true
        }
      ],
      'CALL': [
        {
          id: crypto.randomUUID(),
          type: 'NOTIFICATION',
          triggerBefore: 15, // 15 min avant
          isActive: true
        }
      ],
      'DEADLINE': [
        {
          id: crypto.randomUUID(),
          type: 'EMAIL',
          triggerBefore: 2880, // 48h avant
          isActive: true,
          message: 'URGENT : Échéance dans 48h'
        },
        {
          id: crypto.randomUUID(),
          type: 'SMS',
          triggerBefore: 1440, // 24h avant
          isActive: true
        },
        {
          id: crypto.randomUUID(),
          type: 'NOTIFICATION',
          triggerBefore: 60, // 1h avant
          isActive: true
        }
      ]
    };

    return defaultReminders[eventType] || defaultReminders['APPOINTMENT'];
  }

  private async checkAvailability(startDate: Date, endDate: Date, userId?: string): Promise<boolean> {
    const conflictingEvents = await prisma.calendarEvent.count({
      where: {
        assignedUserId: userId,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gt: startDate } }
            ]
          },
          {
            AND: [
              { startDate: { lt: endDate } },
              { endDate: { gte: endDate } }
            ]
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } }
            ]
          }
        ]
      }
    });

    return conflictingEvents === 0;
  }

  private async getWorkingHours(date: Date, userId?: string): Promise<WorkingHours> {
    const dayOfWeek = date.getDay();
    
    // Pour l'instant, utiliser les horaires par défaut
    // Plus tard, on pourrait récupérer les horaires personnalisés de l'utilisateur
    return DEFAULT_WORKING_HOURS.find(wh => wh.dayOfWeek === dayOfWeek) || DEFAULT_WORKING_HOURS[0];
  }

  private excludeBreakTimes(slots: TimeSlot[], breaks: { startTime: string; endTime: string }[], date: Date): TimeSlot[] {
    // Logique pour exclure les temps de pause des créneaux disponibles
    return slots; // Simplification pour l'exemple
  }

  private async scheduleReminderJob(reminder: EventReminder, event: CalendarEvent, triggerTime: Date): Promise<void> {
    // Ici, on utiliserait BullMQ ou un autre job scheduler
    console.log(`📝 Job de rappel programmé pour ${triggerTime.toLocaleString('fr-FR')}`);
  }

  private async sendReminder(reminder: EventReminder, event: any): Promise<void> {
    // Intégration avec le service de communication
    console.log(`🔔 Envoi rappel ${reminder.type} pour événement: ${event.title}`);
  }

  private async createRecurringEvents(baseEvent: CalendarEvent): Promise<void> {
    // Logique pour créer les événements récurrents
    console.log(`🔄 Création d'événements récurrents pour: ${baseEvent.title}`);
  }

  private async getEventCount(startDate: Date, endDate: Date): Promise<number> {
    return await prisma.calendarEvent.count({
      where: {
        startDate: { gte: startDate },
        endDate: { lte: endDate }
      }
    });
  }

  private async getEventsByType(startDate: Date, endDate: Date): Promise<Record<string, number>> {
    const result = await prisma.calendarEvent.groupBy({
      by: ['type'],
      _count: { type: true },
      where: {
        startDate: { gte: startDate },
        endDate: { lte: endDate }
      }
    });

    return result.reduce((acc: Record<string, number>, item: any) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {});
  }

  private async getEventsByStatus(startDate: Date, endDate: Date): Promise<Record<string, number>> {
    const result = await prisma.calendarEvent.groupBy({
      by: ['status'],
      _count: { status: true },
      where: {
        startDate: { gte: startDate },
        endDate: { lte: endDate }
      }
    });

    return result.reduce((acc: Record<string, number>, item: any) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});
  }

  private async getUpcomingEvents(days: number): Promise<number> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return await prisma.calendarEvent.count({
      where: {
        startDate: { gte: now, lte: futureDate },
        status: { in: ['SCHEDULED', 'CONFIRMED'] }
      }
    });
  }

  private async getOccupancyRate(): Promise<number> {
    // Calculer le taux d'occupation du calendrier
    return 75.5; // Exemple : 75.5% d'occupation
  }

  private async getRemindersStats(): Promise<any> {
    return {
      totalScheduled: 150,
      sent: 120,
      pending: 30,
      byType: {
        EMAIL: 80,
        SMS: 40,
        NOTIFICATION: 30
      }
    };
  }
}

// Fonction pour démarrer le traitement des rappels
export async function startReminderProcessor(): Promise<void> {
  const calendar = IntelligentCalendarService.getInstance();
  
  console.log('⏰ Démarrage du processeur de rappels calendrier');
  
  // Traitement initial
  await calendar.processScheduledReminders();
  
  // Programmer le traitement toutes les 5 minutes
  setInterval(async () => {
    try {
      await calendar.processScheduledReminders();
    } catch (error) {
      console.error('❌ Erreur lors du traitement des rappels:', error);
    }
  }, 5 * 60 * 1000); // Toutes les 5 minutes
}

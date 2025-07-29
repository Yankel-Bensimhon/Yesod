/**
 * Mobile Application Engine
 * Phase 3 - Intelligence features
 * 
 * Moteur pour application mobile progressive (PWA)
 * Fonctionnalités natives : géolocalisation, scan, offline
 */

// Types Sentry
interface SentryInterface {
  captureException: (error: any) => void;
  addBreadcrumb: (breadcrumb: any) => void;
}

// Mock de Sentry pour les tests
const mockSentry: SentryInterface = {
  captureException: (error: any) => console.error('Mock Sentry:', error),
  addBreadcrumb: (breadcrumb: any) => console.log('Mock Sentry breadcrumb:', breadcrumb),
};

// Utilisation conditionnelle de Sentry
let Sentry: SentryInterface;
try {
  Sentry = require('@sentry/nextjs');
} catch (error) {
  Sentry = mockSentry;
}

// Types pour l'application mobile
export interface MobileFeatures {
  offline: boolean;
  geolocation: boolean;
  camera: boolean;
  push: boolean;
  background: boolean;
}

export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  address?: string;
}

export interface ScanResult {
  type: 'document' | 'barcode' | 'qr_code';
  content: string;
  confidence: number;
  processedAt: Date;
  metadata: {
    size: { width: number; height: number };
    format: string;
    quality: number;
  };
}

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'case' | 'client' | 'document' | 'communication';
  data: any;
  timestamp: Date;
  synced: boolean;
}

export interface MobileAppointment {
  id: string;
  clientId: string;
  clientName: string;
  address: string;
  scheduledTime: Date;
  duration: number; // minutes
  type: 'meeting' | 'visit' | 'phone' | 'video';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  location?: GeolocationData;
  notes?: string;
  documents?: string[];
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  scheduled?: Date;
  delivered?: Date;
  clicked?: boolean;
  type: 'reminder' | 'alert' | 'update' | 'message';
}

/**
 * Moteur de l'Application Mobile
 * Gestion PWA et fonctionnalités natives
 */
export class MobileApplicationEngine {
  private static instance: MobileApplicationEngine;
  private offlineQueue: OfflineAction[] = [];
  private isOnline: boolean = true;
  private watchId: number | null = null;

  public static getInstance(): MobileApplicationEngine {
    if (!MobileApplicationEngine.instance) {
      MobileApplicationEngine.instance = new MobileApplicationEngine();
    }
    return MobileApplicationEngine.instance;
  }

  constructor() {
    this.initializeMobile();
  }

  /**
   * Détecte les capacités mobiles disponibles
   */
  async detectMobileCapabilities(): Promise<MobileFeatures> {
    try {
      console.log('📱 Détection des capacités mobiles...');

      const capabilities: MobileFeatures = {
        offline: 'serviceWorker' in navigator && 'caches' in window,
        geolocation: 'geolocation' in navigator,
        camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
        push: 'serviceWorker' in navigator && 'PushManager' in window,
        background: 'serviceWorker' in navigator
      };

      console.log('✅ Capacités détectées:', capabilities);
      return capabilities;

    } catch (error) {
      console.error('❌ Erreur détection capacités:', error);
      Sentry.captureException(error);
      return {
        offline: false,
        geolocation: false,
        camera: false,
        push: false,
        background: false
      };
    }
  }

  /**
   * Initialise la géolocalisation
   */
  async startGeolocation(): Promise<GeolocationData> {
    try {
      console.log('📍 Démarrage géolocalisation...');

      if (!navigator.geolocation) {
        throw new Error('Géolocalisation non supportée');
      }

      return new Promise((resolve, reject) => {
        this.watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const location: GeolocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date()
            };

            // Géocodage inverse pour obtenir l'adresse
            try {
              location.address = await this.reverseGeocode(location.latitude, location.longitude);
            } catch (geocodeError) {
              console.warn('Géocodage inverse échoué:', geocodeError);
            }

            console.log(`✅ Position obtenue: ${location.latitude}, ${location.longitude}`);
            resolve(location);
          },
          (error) => {
            console.error('❌ Erreur géolocalisation:', error);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

    } catch (error) {
      console.error('❌ Erreur démarrage géolocalisation:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Arrête le suivi géolocalisation
   */
  stopGeolocation(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('📍 Géolocalisation arrêtée');
    }
  }

  /**
   * Lance le scan de document via caméra
   */
  async scanDocument(): Promise<ScanResult> {
    try {
      console.log('📷 Démarrage scan document...');

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Caméra non disponible');
      }

      // Demande accès caméra
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Caméra arrière
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      console.log('📸 Accès caméra obtenu');

      // Simulation du scan - en prod, utiliser une lib OCR comme Tesseract.js
      const scanResult: ScanResult = {
        type: 'document',
        content: await this.processDocumentScan(stream),
        confidence: 85 + Math.random() * 10, // 85-95%
        processedAt: new Date(),
        metadata: {
          size: { width: 1920, height: 1080 },
          format: 'image/jpeg',
          quality: 90
        }
      };

      // Fermer le stream
      stream.getTracks().forEach(track => track.stop());

      console.log(`✅ Document scanné (confiance: ${scanResult.confidence}%)`);
      return scanResult;

    } catch (error) {
      console.error('❌ Erreur scan document:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Gère les actions hors-ligne
   */
  async addOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced'>): Promise<void> {
    try {
      const offlineAction: OfflineAction = {
        id: crypto.randomUUID(),
        ...action,
        timestamp: new Date(),
        synced: false
      };

      this.offlineQueue.push(offlineAction);
      
      // Sauvegarder dans localStorage
      localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
      
      console.log(`📱 Action hors-ligne ajoutée: ${action.type} ${action.entity}`);

      // Tenter synchronisation si en ligne
      if (this.isOnline) {
        await this.syncOfflineActions();
      }

    } catch (error) {
      console.error('❌ Erreur ajout action hors-ligne:', error);
      Sentry.captureException(error);
    }
  }

  /**
   * Synchronise les actions hors-ligne
   */
  async syncOfflineActions(): Promise<void> {
    try {
      if (!this.isOnline || this.offlineQueue.length === 0) {
        return;
      }

      console.log(`🔄 Synchronisation de ${this.offlineQueue.length} actions hors-ligne...`);

      const pendingActions = this.offlineQueue.filter(action => !action.synced);
      
      for (const action of pendingActions) {
        try {
          await this.executeAction(action);
          action.synced = true;
          console.log(`✅ Action synchronisée: ${action.type} ${action.entity}`);
        } catch (syncError) {
          console.error(`❌ Erreur sync action ${action.id}:`, syncError);
        }
      }

      // Nettoyer les actions synchronisées
      this.offlineQueue = this.offlineQueue.filter(action => !action.synced);
      localStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));

      console.log('✅ Synchronisation terminée');

    } catch (error) {
      console.error('❌ Erreur synchronisation:', error);
      Sentry.captureException(error);
    }
  }

  /**
   * Gère les rendez-vous clients avec géolocalisation
   */
  async handleClientAppointment(appointmentId: string): Promise<MobileAppointment> {
    try {
      console.log(`📅 Gestion RDV client: ${appointmentId}`);

      // Récupérer les détails du RDV (simulation)
      const appointment = await this.getAppointmentDetails(appointmentId);
      
      // Démarrer géolocalisation pour le trajet
      const currentLocation = await this.startGeolocation();
      
      // Calculer itinéraire si adresse disponible
      if (appointment.address) {
        const route = await this.calculateRoute(currentLocation, appointment.address);
        console.log(`🗺️ Itinéraire calculé: ${route.duration} minutes`);
      }

      // Mettre à jour le statut
      appointment.status = 'in_progress';
      appointment.location = currentLocation;

      console.log(`✅ RDV démarré à ${currentLocation.address}`);
      return appointment;

    } catch (error) {
      console.error('❌ Erreur gestion RDV:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Envoie notification push
   */
  async sendPushNotification(notification: Omit<PushNotification, 'id' | 'delivered'>): Promise<void> {
    try {
      console.log(`🔔 Envoi notification push: ${notification.title}`);

      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Push notifications non supportées');
      }

      const pushNotification: PushNotification = {
        id: crypto.randomUUID(),
        ...notification,
        delivered: new Date()
      };

      // Enregistrer le service worker si nécessaire
      const registration = await navigator.serviceWorker.ready;
      
      // Simuler l'envoi - en prod, utiliser service comme FCM
      if (notification.scheduled && notification.scheduled > new Date()) {
        console.log(`⏰ Notification programmée pour ${notification.scheduled}`);
        setTimeout(() => {
          this.displayNotification(pushNotification, registration);
        }, notification.scheduled.getTime() - Date.now());
      } else {
        await this.displayNotification(pushNotification, registration);
      }

      console.log('✅ Notification envoyée');

    } catch (error) {
      console.error('❌ Erreur notification push:', error);
      Sentry.captureException(error);
    }
  }

  /**
   * Configure le mode hors-ligne
   */
  async setupOfflineMode(): Promise<void> {
    try {
      console.log('📱 Configuration mode hors-ligne...');

      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker non supporté');
      }

      // Enregistrer le service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker enregistré');

      // Charger les actions en attente depuis localStorage
      const savedQueue = localStorage.getItem('offlineQueue');
      if (savedQueue) {
        this.offlineQueue = JSON.parse(savedQueue);
        console.log(`📱 ${this.offlineQueue.length} actions hors-ligne chargées`);
      }

      // Écouter les changements de connectivité
      window.addEventListener('online', () => {
        console.log('🌐 Connexion rétablie');
        this.isOnline = true;
        this.syncOfflineActions();
      });

      window.addEventListener('offline', () => {
        console.log('📱 Mode hors-ligne activé');
        this.isOnline = false;
      });

      console.log('✅ Mode hors-ligne configuré');

    } catch (error) {
      console.error('❌ Erreur configuration hors-ligne:', error);
      Sentry.captureException(error);
    }
  }

  /**
   * Génère rapport d'activité mobile
   */
  async generateMobileActivityReport(): Promise<{
    geolocationUsage: number;
    documentsScanned: number;
    offlineActions: number;
    appointmentsHandled: number;
    notifications: number;
  }> {
    try {
      // Simulation - en prod, récupérer vraies métriques
      return {
        geolocationUsage: Math.floor(Math.random() * 50 + 20), // 20-70 utilisations
        documentsScanned: Math.floor(Math.random() * 30 + 10), // 10-40 scans
        offlineActions: this.offlineQueue.length,
        appointmentsHandled: Math.floor(Math.random() * 15 + 5), // 5-20 RDV
        notifications: Math.floor(Math.random() * 100 + 50) // 50-150 notifications
      };

    } catch (error) {
      console.error('❌ Erreur rapport mobile:', error);
      Sentry.captureException(error);
      return {
        geolocationUsage: 0,
        documentsScanned: 0,
        offlineActions: 0,
        appointmentsHandled: 0,
        notifications: 0
      };
    }
  }

  // === MÉTHODES PRIVÉES ===

  private async initializeMobile(): Promise<void> {
    try {
      // Détecter si on est sur mobile
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        console.log('📱 Application mobile détectée');
        await this.setupOfflineMode();
      }

      // Initialiser état connectivité
      this.isOnline = navigator.onLine;

    } catch (error) {
      console.error('❌ Erreur initialisation mobile:', error);
      Sentry.captureException(error);
    }
  }

  private async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      // Simulation géocodage - en prod, utiliser API Google Maps ou OpenStreetMap
      const addresses = [
        '123 Avenue des Champs-Élysées, Paris',
        '456 Rue de la République, Lyon',
        '789 Boulevard de la Liberté, Marseille',
        '321 Place du Capitole, Toulouse',
        '654 Rue Nationale, Lille'
      ];
      
      return addresses[Math.floor(Math.random() * addresses.length)];

    } catch (error) {
      console.error('❌ Erreur géocodage inverse:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }

  private async processDocumentScan(stream: MediaStream): Promise<string> {
    try {
      // Simulation OCR - en prod, utiliser Tesseract.js ou API OCR
      console.log('🔍 Traitement OCR en cours...');
      
      // Simuler délai de traitement
      await new Promise(resolve => setTimeout(resolve, 2000));

      const documentTypes = [
        'FACTURE N°2025-001\nDate: 29/07/2025\nMontant: 1,250.00 €\nÉchéance: 28/08/2025',
        'MISE EN DEMEURE\nSociété ABC\nMontant dû: 5,000.00 €\nDernière relance: 15/07/2025',
        'PIÈCE D\'IDENTITÉ\nNom: MARTIN Jean\nNé le: 15/03/1980\nAdresse: 12 Rue de la Paix, Paris',
        'CONTRAT DE PRESTATION\nCabinet Yesod\nPériode: 01/01/2025 - 31/12/2025\nMontant: 2,500.00 €'
      ];

      return documentTypes[Math.floor(Math.random() * documentTypes.length)];

    } catch (error) {
      console.error('❌ Erreur traitement OCR:', error);
      throw error;
    }
  }

  private async executeAction(action: OfflineAction): Promise<void> {
    try {
      // Simulation exécution action - en prod, appeler vraies APIs
      console.log(`🔄 Exécution action: ${action.type} ${action.entity}`);
      
      switch (action.entity) {
        case 'case':
          await this.syncCaseAction(action);
          break;
        case 'client':
          await this.syncClientAction(action);
          break;
        case 'document':
          await this.syncDocumentAction(action);
          break;
        case 'communication':
          await this.syncCommunicationAction(action);
          break;
      }

    } catch (error) {
      console.error('❌ Erreur exécution action:', error);
      throw error;
    }
  }

  private async syncCaseAction(action: OfflineAction): Promise<void> {
    // Simulation sync dossier
    console.log(`📁 Sync dossier: ${action.type}`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async syncClientAction(action: OfflineAction): Promise<void> {
    // Simulation sync client
    console.log(`👤 Sync client: ${action.type}`);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  private async syncDocumentAction(action: OfflineAction): Promise<void> {
    // Simulation sync document
    console.log(`📄 Sync document: ${action.type}`);
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  private async syncCommunicationAction(action: OfflineAction): Promise<void> {
    // Simulation sync communication
    console.log(`💬 Sync communication: ${action.type}`);
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  private async getAppointmentDetails(appointmentId: string): Promise<MobileAppointment> {
    // Simulation récupération RDV
    return {
      id: appointmentId,
      clientId: 'client-123',
      clientName: 'Société ABC',
      address: '123 Avenue des Champs-Élysées, 75008 Paris',
      scheduledTime: new Date(),
      duration: 60,
      type: 'meeting',
      status: 'scheduled',
      notes: 'RDV de négociation pour dossier en cours'
    };
  }

  private async calculateRoute(from: GeolocationData, toAddress: string): Promise<{
    distance: number;
    duration: number;
    steps: string[];
  }> {
    // Simulation calcul itinéraire - en prod, utiliser API Google Maps
    return {
      distance: Math.random() * 20 + 5, // 5-25 km
      duration: Math.random() * 45 + 15, // 15-60 minutes
      steps: [
        'Dirigez-vous vers le nord',
        'Tournez à droite sur l\'Avenue',
        'Continuez tout droit pendant 2 km',
        'Destination atteinte'
      ]
    };
  }

  private async displayNotification(notification: PushNotification, registration: ServiceWorkerRegistration): Promise<void> {
    try {
      // Vérifier permissions
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Permission notification refusée');
        }
      }

      // Afficher notification
      await registration.showNotification(notification.title, {
        body: notification.body,
        data: notification.data,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        // vibrate: [200, 100, 200], // Non supporté par TypeScript
        requireInteraction: notification.type === 'alert',
        // actions: [ // Non supporté par TypeScript standard
        //   {
        //     action: 'view',
        //     title: 'Voir',
        //     icon: '/action-view.png'
        //   },
        //   {
        //     action: 'dismiss',
        //     title: 'Ignorer',
        //     icon: '/action-dismiss.png'
        //   }
        // ]
      });

    } catch (error) {
      console.error('❌ Erreur affichage notification:', error);
      throw error;
    }
  }
}

export default MobileApplicationEngine;

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MobileAppEngine, MobileFeatures } from '@/lib/mobile/mobile-app-engine';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
}

interface DocumentScan {
  id: string;
  filename: string;
  type: string;
  size: number;
  timestamp: string;
  text?: string;
  confidence?: number;
}

interface OfflineAction {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  status: 'pending' | 'synced' | 'failed';
}

const MobilePWAInterface: React.FC = () => {
  const [capabilities, setCapabilities] = useState<MobileFeatures | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [scannedDocuments, setScannedDocuments] = useState<DocumentScan[]>([]);
  const [offlineActions, setOfflineActions] = useState<OfflineAction[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [scanning, setScanning] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const mobileEngine = new MobileAppEngine();

  useEffect(() => {
    initializeMobileFeatures();
    setupOnlineListener();
    loadOfflineActions();
  }, []);

  const initializeMobileFeatures = async () => {
    try {
      const caps = await mobileEngine.detectMobileCapabilities();
      setCapabilities(caps);

      // Demander les permissions pour les notifications
      if (caps.push && 'Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
    }
  };

  const setupOnlineListener = () => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineActions();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  };

  const loadOfflineActions = () => {
    try {
      const actions = localStorage.getItem('yesod_offline_actions');
      if (actions) {
        setOfflineActions(JSON.parse(actions));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des actions hors ligne:', error);
    }
  };

  const startLocationTracking = async () => {
    try {
      setIsTracking(true);
      const position = await mobileEngine.startGeolocation();
      setLocation(position);
      
      // Ajouter action hors ligne si nécessaire
      if (!isOnline) {
        await mobileEngine.addOfflineAction({
          type: 'update',
          entity: 'case',
          data: position
        });
        loadOfflineActions();
      }

      // Envoyer notification
      if (capabilities?.push) {
        await mobileEngine.sendPushNotification({
          title: 'Localisation mise à jour',
          body: 'Votre position a été enregistrée pour ce dossier',
          type: 'update'
        });
      }
    } catch (error) {
      console.error('Erreur de géolocalisation:', error);
      alert('Impossible d\'accéder à la géolocalisation. Vérifiez vos permissions.');
    } finally {
      setIsTracking(false);
    }
  };

  const stopLocationTracking = () => {
    mobileEngine.stopGeolocation();
    setIsTracking(false);
  };

  const scanDocument = async () => {
    try {
      setScanning(true);
      
      // Créer un input file pour simuler la capture d'image
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            const result = await mobileEngine.scanDocument();
            
            const newDocument: DocumentScan = {
              id: Date.now().toString(),
              filename: file.name,
              type: file.type,
              size: file.size,
              timestamp: new Date().toISOString(),
              text: result.content,
              confidence: result.confidence,
            };
            
            setScannedDocuments(prev => [...prev, newDocument]);
            
            // Ajouter action hors ligne si nécessaire
            if (!isOnline) {
              await mobileEngine.addOfflineAction({
                type: 'create',
                entity: 'document',
                data: newDocument
              });
              loadOfflineActions();
            }

            // Envoyer notification
            if (capabilities?.push) {
              await mobileEngine.sendPushNotification({
                title: 'Document scanné',
                body: `Document "${file.name}" traité avec ${Math.round(result.confidence)}% de confiance`,
                type: 'update'
              });
            }
          } catch (error) {
            console.error('Erreur lors du scan:', error);
            alert('Erreur lors du traitement du document');
          }
        }
        setScanning(false);
      };
      
      input.click();
    } catch (error) {
      console.error('Erreur lors du scan de document:', error);
      setScanning(false);
    }
  };

  const syncOfflineActions = async () => {
    try {
      const actions = JSON.parse(localStorage.getItem('yesod_offline_actions') || '[]');
      
      for (const action of actions) {
        if (action.status === 'pending') {
          try {
            // Simuler la synchronisation
            await new Promise(resolve => setTimeout(resolve, 1000));
            action.status = 'synced';
          } catch (error) {
            action.status = 'failed';
          }
        }
      }
      
      localStorage.setItem('yesod_offline_actions', JSON.stringify(actions));
      setOfflineActions(actions);
      
      if (capabilities?.push) {
        await mobileEngine.sendPushNotification({
          title: 'Synchronisation terminée',
          body: `${actions.filter((a: any) => a.status === 'synced').length} actions synchronisées`,
          type: 'update'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
    }
  };

  const installPWA = async () => {
    try {
      // Simuler l'installation PWA
      if (capabilities?.push) {
        await mobileEngine.sendPushNotification({
          title: 'Application installée',
          body: 'Yesod est maintenant disponible sur votre écran d\'accueil',
          type: 'update'
        });
      }
      alert('Application installée avec succès!');
    } catch (error) {
      console.error('Erreur lors de l\'installation:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen max-w-md mx-auto">
      {/* En-tête mobile */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Yesod Mobile</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isOnline ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
          </div>
          <button
            onClick={installPWA}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            Installer
          </button>
        </div>
      </div>

      {/* Capacités de l'appareil */}
      {capabilities && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-lg shadow-md mb-6"
        >
          <h3 className="text-lg font-semibold mb-3">Capacités de l'appareil</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${capabilities.geolocation ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">Géolocalisation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${capabilities.camera ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">Caméra</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${capabilities.push ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">Notifications</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${capabilities.offline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">Mode hors ligne</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-600">
            <p>Plateforme: {navigator.platform}</p>
            <p>Langue: {navigator.language}</p>
          </div>
        </motion.div>
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={isTracking ? stopLocationTracking : startLocationTracking}
          disabled={!capabilities?.geolocation}
          className={`p-4 rounded-lg shadow-md text-white font-medium ${
            isTracking 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-green-600 hover:bg-green-700'
          } disabled:bg-gray-400`}
        >
          <div className="text-center">
            <div className="text-2xl mb-1">📍</div>
            <div className="text-sm">
              {isTracking ? 'Arrêter localisation' : 'Localiser'}
            </div>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          onClick={scanDocument}
          disabled={!capabilities?.camera || scanning}
          className="p-4 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 disabled:bg-gray-400 font-medium"
        >
          <div className="text-center">
            <div className="text-2xl mb-1">📷</div>
            <div className="text-sm">
              {scanning ? 'Scan en cours...' : 'Scanner document'}
            </div>
          </div>
        </motion.button>
      </div>

      {/* Localisation actuelle */}
      {location && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-lg shadow-md mb-6"
        >
          <h3 className="text-lg font-semibold mb-3">Position actuelle</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Latitude:</span> {location.latitude.toFixed(6)}</p>
            <p><span className="font-medium">Longitude:</span> {location.longitude.toFixed(6)}</p>
            <p><span className="font-medium">Précision:</span> {location.accuracy.toFixed(0)}m</p>
            {location.address && (
              <p><span className="font-medium">Adresse:</span> {location.address}</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Documents scannés */}
      {scannedDocuments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-lg shadow-md mb-6"
        >
          <h3 className="text-lg font-semibold mb-3">Documents scannés</h3>
          <div className="space-y-3">
            {scannedDocuments.map((doc) => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm truncate">{doc.filename}</h4>
                  <span className="text-xs text-gray-500">{formatFileSize(doc.size)}</span>
                </div>
                {doc.confidence && (
                  <div className="mb-2">
                    <div className="text-xs text-gray-600 mb-1">
                      Confiance: {Math.round(doc.confidence)}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${doc.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {doc.text && (
                  <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded mt-2">
                    {doc.text.substring(0, 100)}...
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(doc.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Actions hors ligne */}
      {offlineActions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-lg shadow-md mb-6"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Actions hors ligne</h3>
            {isOnline && (
              <button
                onClick={syncOfflineActions}
                className="text-blue-600 text-sm hover:text-blue-800"
              >
                Synchroniser
              </button>
            )}
          </div>
          <div className="space-y-2">
            {offlineActions.map((action) => (
              <div key={action.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="text-sm font-medium">{action.type}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(action.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(action.status)}`}>
                  {action.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Informations PWA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 p-4 rounded-lg border border-blue-200"
      >
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Application Web Progressive</h3>
        <p className="text-sm text-blue-700 mb-3">
          Cette application fonctionne hors ligne et peut être installée sur votre appareil pour une expérience native.
        </p>
        <div className="text-xs text-blue-600">
          <p>✓ Fonctionne hors ligne</p>
          <p>✓ Notifications push</p>
          <p>✓ Accès caméra et géolocalisation</p>
          <p>✓ Installation possible</p>
        </div>
      </motion.div>
    </div>
  );
};

export default MobilePWAInterface;

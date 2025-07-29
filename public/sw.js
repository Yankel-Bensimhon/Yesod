const CACHE_NAME = 'yesod-v1';
const urlsToCache = [
  '/',
  '/mobile',
  '/dashboard',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retourner la réponse depuis le cache
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Vérifier si nous avons reçu une réponse valide
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Cloner la réponse car elle ne peut être consommée qu'une fois
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // En cas d'erreur réseau, retourner une page hors ligne
          if (event.request.destination === 'document') {
            return caches.match('/mobile');
          }
        });
      })
  );
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nouvelle notification Yesod',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Ouvrir l\'application',
        icon: '/icons/action-open.png'
      },
      {
        action: 'dismiss',
        title: 'Ignorer',
        icon: '/icons/action-dismiss.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Yesod', options)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/mobile')
    );
  } else if (event.action === 'dismiss') {
    // Ne rien faire, la notification est déjà fermée
  } else {
    // Clic sur la notification elle-même
    event.waitUntil(
      clients.openWindow('/mobile')
    );
  }
});

// Synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Récupérer les actions hors ligne depuis IndexedDB ou localStorage
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      if (action.status === 'pending') {
        try {
          // Tenter de synchroniser l'action
          await syncAction(action);
          action.status = 'synced';
        } catch (error) {
          console.error('Erreur lors de la synchronisation:', error);
          action.status = 'failed';
        }
      }
    }
    
    // Sauvegarder les actions mises à jour
    await saveOfflineActions(offlineActions);
    
    // Envoyer une notification de synchronisation terminée
    self.registration.showNotification('Synchronisation terminée', {
      body: 'Vos données ont été synchronisées avec succès',
      icon: '/icons/icon-192x192.png'
    });
    
  } catch (error) {
    console.error('Erreur lors de la synchronisation en arrière-plan:', error);
  }
}

// Fonctions utilitaires pour la gestion des données hors ligne
async function getOfflineActions() {
  // Simuler la récupération depuis IndexedDB
  // En production, utiliser IndexedDB ou une solution similaire
  return JSON.parse(localStorage.getItem('yesod_offline_actions') || '[]');
}

async function saveOfflineActions(actions) {
  localStorage.setItem('yesod_offline_actions', JSON.stringify(actions));
}

async function syncAction(action) {
  // Simuler l'API call
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(action)
  });
  
  if (!response.ok) {
    throw new Error('Erreur lors de la synchronisation');
  }
  
  return response.json();
}

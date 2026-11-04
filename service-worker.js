// Convenience Service Worker - Push ready
const CACHE = 'convenience-v0.5';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

// Notificaciones push (cuando llegue un push real del servidor)
self.addEventListener('push', (event) => {
  let data = { title: 'Convenience', body: 'Nueva oferta cerca de ti', icon: '/icon.png' };
  try {
    if (event.data) data = event.data.json();
  } catch (e) {}

  const options = {
    body: data.body || 'Tienes una oferta relámpago',
    icon: data.icon || 'https://cdn-icons-png.flaticon.com/512/3081/3081329.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/3081/3081329.png',
    vibrate: [100, 50, 100],
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Ver oferta' },
      { action: 'close', title: 'Cerrar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Convenience 🛒', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});

// Cache básico de assets
self.addEventListener('fetch', (event) => {
  // Solo cachear GETs estáticos si quieres offline
});

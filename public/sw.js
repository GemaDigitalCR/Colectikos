// Colectikos Web Push Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Colectikos 🇨🇷';
    const options = {
      body: data.body || '¡Tenés novedades en tu aventura de explorador!',
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/icon-192x192.png',
      data: {
        url: data.data?.url || data.url || '/',
        tag: data.data?.tag || data.tag || 'colectikos-alert',
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error('Error procesando evento push en service worker:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una pestaña abierta de Colectikos, la enfocamos y navegamos a la URL
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            if ('navigate' in client) {
              return client.navigate(targetUrl);
            }
            return client;
          }
        }
      }
      // Si no hay ninguna ventana abierta, abrimos una nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

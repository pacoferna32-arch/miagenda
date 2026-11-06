// Service Worker dedicado para Web Push y Recordatorios Diarios
// Responde a eventos push y notificationclick en segundo plano

self.addEventListener('install', (event) => {
  // Activa el worker inmediatamente sin esperar a que se cierren otras pestañas
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Receptor de eventos Push del navegador / Servidor Web Push
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'Recordatorio de Tareas';
  const body = data.body || 'Tienes tareas pendientes para hoy.';
  const icon = data.icon || '/favicon.ico';
  const badge = data.badge || '/favicon.ico';
  const tag = data.tag || 'task-reminder-' + Date.now();
  const url = data.url || '/';

  const options = {
    body,
    icon,
    badge,
    tag,
    data: {
      url,
      timestamp: Date.now(),
      ...data.data,
    },
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction !== false,
    actions: [
      { action: 'view', title: 'Ver tareas' },
      { action: 'dismiss', title: 'Descartar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Gestión de clics sobre la notificación Web Push
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una pestaña abierta de la aplicación, darle foco
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url && client.url.includes(self.location.origin)) {
            return client.focus();
          }
        }
      }
      // Si no hay pestaña abierta, abrir una nueva ventana
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  // Manejo de cierre voluntario si se requiere
});

self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Despacho Fiscal 2087';
  const options = {
    body: data.body || 'Nuevo lead recibido',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.id ? 'nuevo-lead-' + data.id : 'nuevo-lead',
    renotify: true,
    requireInteraction: true,
    data: { url: data.url || '/leads', id: data.id || null },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/leads';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

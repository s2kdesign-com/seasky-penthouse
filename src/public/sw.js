/* SeaSky Penthouse — Service Worker */
'use strict';

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data.json(); } catch (_) { data = { title: 'SeaSky Penthouse', body: event.data?.text() || '' }; }

  const title = data.title || 'SeaSky Penthouse';
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes(url) && 'focus' in c) return c.focus();
      }
      return clients.openWindow(url);
    }),
  );
});

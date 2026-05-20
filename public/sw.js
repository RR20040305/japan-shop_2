const CACHE_NAME = 'tokyo-drift-v6';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/manifest.json',
  '/icons/favicon.ico',
  '/icons/favicon-16x16.png',
  '/icons/favicon-32x32.png',
  '/icons/favicon-48x48.png',
  '/icons/favicon-128x128.png',
  '/icons/favicon-256x256.png',
  '/icons/favicon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API-запросы – Network First с fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          if (event.request.method === 'GET') {
            const cloned = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
          }
          return networkResponse;
        })
        .catch(() => {
          // Если сети нет – пытаемся отдать из кэша
          return caches.match(event.request).then(cached => {
            if (cached) return cached;
            // Возвращаем осмысленный ответ, чтобы приложение не падало
            return new Response(JSON.stringify({ error: 'Offline' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Статика – Cache First с fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).catch(() => {
        return new Response('Resource not available offline', { status: 408 });
      });
    })
  );
});

self.addEventListener('push', event => {
  let data = { title: 'Новое уведомление', body: '' };
  if (event.data) {
    try { data = event.data.json(); } catch (e) {}
  }

  const options = {
    body: data.body,
    icon: '/icons/favicon-128x128.png',
    badge: '/icons/favicon-48x48.png',
    data: data.data || {},
    actions: data.actions || []
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title, options),
      clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SYNC_REMINDERS' }));
      })
    ])
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const reminderId = event.notification.data?.reminderId;
  if (event.action === 'delay' && reminderId) {
    event.waitUntil(
      fetch(`/api/reminders/${reminderId}/delay`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: event.notification.body })
      }).catch(err => console.error('Delay error:', err))
    );
  } else {
    event.waitUntil(clients.openWindow('/'));
  }
});

self.addEventListener('notificationclose', event => {
  const tag = event.notification.tag;
  if (tag && tag.startsWith('reminder-')) {
    const id = tag.replace('reminder-', '');
    fetch(`/api/reminders/${id}/close`, { method: 'DELETE' })
      .then(() => clients.matchAll({ type: 'window' }))
      .then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SYNC_REMINDERS' }));
      })
      .catch(err => console.error('Close delete failed:', err));
  }
});
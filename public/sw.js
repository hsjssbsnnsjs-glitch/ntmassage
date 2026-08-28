// NT MASSAGE - Service Worker for Background Notifications & Web Push
const CACHE_NAME = 'nt-massage-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for push events (Web Push API)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'NT MASSAGE', body: event.data.text() };
    }
  }

  const title = data.title || 'رسالة جديدة من NT MASSAGE';
  const options = {
    body: data.body || 'لديك إشعار جديد في تطبيق NT',
    icon: data.icon || data.avatarUrl || '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'nt-msg-' + Date.now(),
    renotify: true,
    requireInteraction: false,
    data: {
      url: data.url || '/',
      senderId: data.senderId,
    },
    actions: [
      { action: 'open', title: 'فتح التطبيق' },
      { action: 'dismiss', title: 'إغلاق' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Handler: Focus existing tab or open app window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') {
    return;
  }
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Receive direct messages from front-end to trigger background/phone notification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const resolvedOptions = {
      body: options?.body || '',
      icon: options?.icon || options?.avatarUrl || '/icon.png',
      badge: '/icon.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: options?.tag || 'nt-notif-' + Date.now(),
      renotify: true,
      requireInteraction: false,
      data: options?.data || { url: '/' },
      actions: [
        { action: 'open', title: 'فتح' },
        { action: 'dismiss', title: 'تجاهل' },
      ],
    };
    self.registration.showNotification(title, resolvedOptions);
  }
});

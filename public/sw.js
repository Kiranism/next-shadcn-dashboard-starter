self.addEventListener('push', (event) => {
  let title = 'WattDash';
  let body = '';
  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title ?? 'WattDash';
      body = data.body ?? '';
    } catch {
      title = event.data.text() || 'WattDash';
    }
  }
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/favicon/web-app-manifest-192x192.png'
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const newSub = await self.registration.pushManager.subscribe(event.oldSubscription.options);
      const clientList = await self.clients.matchAll({ type: 'window' });
      if (!clientList.length) return;
      const config = await new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (e) => resolve(e.data ?? {});
        clientList[0].postMessage({ type: 'GET_PUSH_CONFIG' }, [channel.port2]);
      });
      const { token, apiUrl } = config;
      if (!token || !apiUrl) return;
      const sub = newSub.toJSON();
      await fetch(`${apiUrl}/push-subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: sub.keys?.p256dh,
          auth: sub.keys?.auth
        })
      });
    })()
  );
});

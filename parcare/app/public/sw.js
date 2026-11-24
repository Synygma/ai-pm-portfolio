// ParCare service worker (hand-written, no library). Only handles Web Push: it shows the alarm
// notification and opens the right page when it is tapped. It does not cache pages.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "ParCare", {
      body: data.body || "",
      tag: data.tag || "parcare",
      icon: "/icons/icon-192.png",
      badge: "/icons/favicon-32.png",
      requireInteraction: true,
      renotify: true,
      // The alarm-like second reminder vibrates much longer (a web app cannot loop a sound while closed).
      vibrate: data.alarm ? [1000, 300, 1000, 300, 1000, 300, 1000, 300, 1000, 300, 1000] : [400, 200, 400, 200, 400],
      silent: false,
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

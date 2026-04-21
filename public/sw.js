self.addEventListener("push", function (event) {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [100, 50, 100],
    data: { url: data.url || "/dashboard" },
    actions: [
      { action: "open", title: "Voir mes tâches" },
      { action: "close", title: "Fermer" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (event.action === "close") return;

  const url = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
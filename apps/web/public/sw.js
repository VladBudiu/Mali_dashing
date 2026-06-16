// Placeholder service worker for Mali Dash.
// Offline caching and push handling are added in a later roadmap phase.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

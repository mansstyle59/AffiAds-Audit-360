/* AffiAds Audit 360° — fonctionnement hors ligne de l'interface.
   Les pages de l'appli sont servies depuis le réseau en priorité (pour recevoir les mises à jour),
   puis depuis le cache si le réseau est absent. Les appels aux services d'analyse ne sont jamais mis en cache. */
const CACHE = "affiads-audit-2026-135";
const SHELL = ["./", "index.html", "assets/app.css", "assets/nav-theme-fix.css", "assets/marker-fix.css", "assets/header-actions.css", "assets/readability-fix.css", "assets/app.js", "manifest.webmanifest",
  "assets/app-icon.svg", "assets/assistant-icon.svg", "assets/logo-64.png", "assets/logo-192.png", "assets/logo-512.png", "assets/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !isFont) return;
  if (isFont) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  e.respondWith(fetch(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return r;
  }).catch(() => caches.match(req).then(hit => hit || caches.match("index.html"))));
});

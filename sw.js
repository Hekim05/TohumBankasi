const VERSION = '2026.11.24-3';
const CACHE = 'app-' + VERSION;
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const CDN = ['www.gstatic.com', 'cdn.jsdelivr.net'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('app-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // HTML: önce ağ, çevrimdışıyken önbellek
  if (req.mode === 'navigate' || (url.origin === location.origin && url.pathname.endsWith('.html'))) {
    e.respondWith(fetch(req).then(r => { const k = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', k)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // İkonlar ve CDN kütüphaneleri: önce önbellek
  if (url.origin === location.origin || CDN.includes(url.hostname)) {
    e.respondWith(caches.match(req).then(h => h || fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') { const k = r.clone(); caches.open(CACHE).then(c => c.put(req, k)); }
      return r;
    })));
  }
});

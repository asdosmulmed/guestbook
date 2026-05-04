// Service Worker — Buku Tamu Digital
// Caches app shell so the UI loads even when offline

const CACHE_NAME = 'buku-tamu-v1';
const APP_SHELL = [
  '/',
  '/index.html',
];

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - API calls: network-first, no cache (let offline queue handle it)
// - Assets (JS/CSS/fonts): cache-first
// - Navigation (HTML): network-first, fallback to /index.html
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and API calls entirely — offline queue handles API
  if (request.method !== 'GET') return;
  if (url.port === '8000' || url.pathname.startsWith('/api/')) return;

  // Navigation requests → serve index.html from cache as fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html')
      )
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts) → cache-first
  if (
    url.pathname.match(/\.(js|css|woff2?|png|svg|ico|webp)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
  }
});

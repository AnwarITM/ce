const CACHE_VERSION = '20260110';
const CACHE_NAME = `eps-work-planner-v${CACHE_VERSION}`;

const v = (url) => `${url}?v=${CACHE_VERSION}`;

const urlsToCache = [
  './',
  v('./index.html'),
  v('./work_planner.html'),
  v('./notes_viewer.html'),
  v('./cek_lembur/index.html'),
  v('./styles.css'),
  v('./design-tokens.css'),
  v('./theme-light.css'),
  v('./theme-dark.css'),
  './manifest.json',
  './icon-16x16.png',
  './icon-32x32.png',
  './icon-192x192.png',
  './icon-512x512.png',
  v('./work_planner.js'),
  v('./theme_manager.js'),
  './cek_lembur/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
    })
  );
  self.skipWaiting(); // Activate new SW immediately
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const isHTML =
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html');

  // For HTML, force a fresh fetch when online to avoid stale pages
  const networkFirst = fetch(request, { cache: 'no-store' })
    .then((response) => response)
    .catch(() => caches.match(request));

  // For other assets, keep the network-first approach with cache fallback
  const generic = fetch(request, { cache: 'no-store' })
    .then((response) => {
      const respClone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone));
      return response;
    })
    .catch(() => caches.match(request));

  event.respondWith(isHTML ? networkFirst : generic);
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control without requiring reload
});

const CACHE_NAME = 'eps-work-planner-v2';
const urlsToCache = [
  './',
  './index.html',
  './work_planner.html',
  './notes_viewer.html',
  './styles.css',
  './design-tokens.css',
  './theme-light.css',
  './theme-dark.css',
  './manifest.json',
  './icon-16x16.png',
  './icon-32x32.png',
  './icon-192x192.png',
  './icon-512x512.png',
  './work_planner.js',
  './theme_manager.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
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
});

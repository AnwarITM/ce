const CACHE_NAME = "panduan-cache-v1";

const urlsToCache = [
  "index.html",
  "admin.html",
  "styles.css",
  "script.js",
  "manifest.json",
  "icon.png",
  "icon-512.png"
];

// Saat service worker di-install
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Saat service worker diaktifkan (biasanya setelah update)
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});

// Saat aplikasi melakukan fetch (permintaan file)
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Beri cache jika ada, kalau tidak fetch dari jaringan
      return response || fetch(event.request);
    })
  );
});


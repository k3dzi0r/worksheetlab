const CACHE_NAME = 'worksheetlab-v4';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/worksheetlab/',
        '/worksheetlab/index.html',
        '/worksheetlab/favicon.svg',
        '/worksheetlab/icons.svg',
        '/worksheetlab/manifest.json',
        '/worksheetlab/fonts/Andika-Regular.woff2',
        '/worksheetlab/fonts/ABeeZee-Regular.woff2',
        '/worksheetlab/fonts/PlaywritePL-Regular.woff2',
        '/worksheetlab/fonts/Elementarz.ttf',
        '/worksheetlab/illustrations/books.webp'
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Stale-while-revalidate strategy
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchedResponse = fetch(event.request).then((networkResponse) => {
          if (event.request.method === 'GET' && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // If network fails and no cache, let it fail or return offline fallback
        });
        
        return cachedResponse || fetchedResponse;
      });
    })
  );
});

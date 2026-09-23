// Zmiana numeru wymusza wyczyszczenie starej pamięci podręcznej po wdrożeniu.
const CACHE_NAME = 'kartolab-v6';

// Tylko pliki, które na pewno istnieją - jeden brakujący wywraca całą instalację
// (wcześniej przez nieistniejący /fonts/Elementarz.ttf service worker nigdy się nie instalował).
const PRECACHE = [
  '/',
  '/favicon.svg',
  '/manifest.json',
  '/fonts/Andika-Regular.woff2',
  '/fonts/ABeeZee-Regular.woff2',
  '/fonts/PlaywritePL-Regular.woff2',
  '/fonts/Elementarz2.ttf',
  '/illustrations/books.webp',
];

self.addEventListener('install', (event) => {
  // Bez skipWaiting: nowa wersja czeka, aż użytkownik kliknie „Odśwież" w aplikacji.
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

function putInCache(request, response) {
  if (request.method === 'GET' && response.ok) {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  // Strona: najpierw sieć, żeby po wdrożeniu od razu ładowała się nowa wersja; pamięć tylko offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => putInCache(request, response))
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/'))),
    );
    return;
  }

  // Pliki z hashem w nazwie (/assets/) nigdy się nie zmieniają - z pamięci, jeśli są.
  if (new URL(request.url).pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => putInCache(request, response))),
    );
    return;
  }

  // Reszta (czcionki, ilustracje): z pamięci od razu, w tle odświeżenie.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => putInCache(request, response))
        .catch(() => cached);
      return cached || network;
    }),
  );
});

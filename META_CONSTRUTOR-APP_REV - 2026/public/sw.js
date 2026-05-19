const CACHE_NAME = 'metaconstrutor-v3';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

// Cache de recursos estáticos
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache).catch(() => undefined);
      })
  );
});

// Ativar novo service worker imediatamente
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
    }).then(() => self.clients.claim())
  );
});

// Network-first strategy with dev exclusions
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome-extension and non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Always network-first for navigations (HTML) to avoid stale index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request)).then((response) => {
        // Optionally cache HTML for offline fallback
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
    );
    return;
  }

  // Bypass caching for Vite/dev modules and any '/src' TS/TSX files
  const isDevModule =
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/@vite') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx') ||
    url.search.includes('refresh-') ||
    url.search.includes('vite') ||
    url.searchParams.has('v');

  if (isDevModule) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // NUNCA cachear requisições de autenticação, realtime ou métodos não-GET
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase') ||
    url.pathname.includes('/auth/') ||
    url.pathname.includes('/realtime/')
  ) {
    // Return sem chamar respondWith deixa o browser tratar naturalmente
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) return response;
        return fetch(request).then(response => {
          if (!response || response.status !== 200) return response;
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
          return response;
        });
      })
      .catch(() => caches.match('/'))
  );
});

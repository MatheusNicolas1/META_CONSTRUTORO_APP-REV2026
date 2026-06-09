const CACHE_NAME = 'metaconstrutor-v3';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

// ─── Safe Cache Operations ──────────────────────────────────
// Evita "Lock was stolen by another request" no Safari/iOS
// usando um mecanismo de retry com backoff

async function safeCacheOpen(name) {
  let attempts = 0;
  const maxAttempts = 3;
  while (attempts < maxAttempts) {
    try {
      return await caches.open(name);
    } catch (err) {
      if (err.name === 'AbortError' && attempts < maxAttempts - 1) {
        attempts++;
        await new Promise(r => setTimeout(r, 100 * Math.pow(2, attempts)));
        continue;
      }
      throw err;
    }
  }
}

async function safeCachePut(cache, request, response) {
  let attempts = 0;
  const maxAttempts = 3;
  while (attempts < maxAttempts) {
    try {
      await cache.put(request, response);
      return;
    } catch (err) {
      if (err.name === 'AbortError' && attempts < maxAttempts - 1) {
        attempts++;
        await new Promise(r => setTimeout(r, 100 * Math.pow(2, attempts)));
        continue;
      }
      // Silently fail on non-critical cache operations
      console.warn('[SW] Cache put failed:', err.message);
      return;
    }
  }
}

async function safeCacheMatch(cache, request) {
  let attempts = 0;
  const maxAttempts = 3;
  while (attempts < maxAttempts) {
    try {
      return await cache.match(request);
    } catch (err) {
      if (err.name === 'AbortError' && attempts < maxAttempts - 1) {
        attempts++;
        await new Promise(r => setTimeout(r, 100 * Math.pow(2, attempts)));
        continue;
      }
      throw err;
    }
  }
}

// ─── Install ────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      try {
        const cache = await safeCacheOpen(CACHE_NAME);
        await cache.addAll(urlsToCache).catch(() => undefined);
      } catch (err) {
        console.warn('[SW] Install cache failed:', err.message);
      }
    })()
  );
});

// ─── Activate ───────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName).catch(() => undefined);
            }
          })
        );
      } catch (err) {
        console.warn('[SW] Activation cleanup failed:', err.message);
      }
      await self.clients.claim();
    })()
  );
});

// ─── Fetch (Network-first, safe) ───────────────────────────

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
      (async () => {
        try {
          const response = await fetch(request);
          if (response && response.ok) {
            const clone = response.clone();
            const cache = await safeCacheOpen(CACHE_NAME);
            safeCachePut(cache, request, clone);
          }
          return response;
        } catch (err) {
          // Network failed — try cache
          try {
            const cached = await caches.match(request);
            return cached || new Response('Offline', { status: 503 });
          } catch {
            return new Response('Offline', { status: 503 });
          }
        }
      })()
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
      (async () => {
        try {
          return await fetch(request);
        } catch {
          try {
            return await caches.match(request);
          } catch {
            return new Response('Offline', { status: 503 });
          }
        }
      })()
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
    return;
  }

  // Cache-first for static assets (with safe operations)
  event.respondWith(
    (async () => {
      try {
        const cache = await safeCacheOpen(CACHE_NAME);
        const cachedResponse = await safeCacheMatch(cache, request);
        if (cachedResponse) return cachedResponse;

        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
          const clone = networkResponse.clone();
          safeCachePut(cache, request, clone);
        }
        return networkResponse;
      } catch (err) {
        // Ultimate fallback — serve homepage
        try {
          return await caches.match('/');
        } catch {
          return new Response('Offline', { status: 503 });
        }
      }
    })()
  );
});

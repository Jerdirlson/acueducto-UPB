/**
 * Service Worker para Acueducto Rural PWA
 * Estrategia: Stale-While-Revalidate para assets, Network First para API
 */

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `acueducto-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `acueducto-dynamic-${CACHE_VERSION}`;

// Assets estáticos que siempre se cachean
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Extensiones de archivos que se deben cachear
const CACHEABLE_EXTENSIONS = ['.js', '.css', '.html', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.woff', '.woff2'];

/**
 * Install - Cachear assets estáticos
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * Activate - Limpiar caches antiguos
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

/**
 * Determinar si una URL es cacheable
 */
function isCacheable(url) {
  const urlObj = new URL(url);

  // No cachear llamadas API
  if (urlObj.pathname.startsWith('/api/')) {
    return false;
  }

  // No cachear CouchDB
  if (urlObj.pathname.includes('_couchdb') || urlObj.port === '5984') {
    return false;
  }

  // Cachear archivos con extensiones conocidas
  return CACHEABLE_EXTENSIONS.some(ext => urlObj.pathname.endsWith(ext)) ||
         urlObj.pathname === '/' ||
         urlObj.pathname.endsWith('/');
}

/**
 * Estrategia Stale-While-Revalidate
 * Devuelve cache inmediatamente y actualiza en segundo plano
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

/**
 * Estrategia Cache First con fallback a Network
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Fetch failed, no cache available:', request.url);
    return new Response('Offline - Contenido no disponible', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Fetch handler
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar requests del mismo origen
  if (url.origin !== location.origin) {
    return;
  }

  // Ignorar requests que no son GET
  if (request.method !== 'GET') {
    return;
  }

  // No cachear API calls - dejar pasar directamente
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Usar estrategia apropiada según el tipo de recurso
  if (isCacheable(request.url)) {
    // Para archivos JS/CSS de Vite, usar Stale-While-Revalidate
    if (url.pathname.includes('/assets/')) {
      event.respondWith(staleWhileRevalidate(request));
    } else {
      // Para HTML y otros, usar Cache First
      event.respondWith(cacheFirst(request));
    }
  }
});

/**
 * Message handler para actualizaciones
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded');


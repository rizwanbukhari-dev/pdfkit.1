/**
 * PDFKit PWA Service Worker
 * Ensures reliable offline shell capabilities while strictly preserving user document privacy.
 * IMPORTANT: User files, uploaded documents, generated PDFs, and blobs are NEVER cached.
 */

const CACHE_VERSION = 'v3.1.0';
const STATIC_CACHE = `pdfkit-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `pdfkit-runtime-${CACHE_VERSION}`;

// Core assets required for instantaneous startup
const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/favicon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/maskable-icon-192x192.png',
  '/maskable-icon-512x512.png',
  '/apple-touch-icon.png',
  '/pdf.worker.min.js',
];

// Install: Cache essential application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[PDFKit SW] Pre-caching note:', err);
      })
  );
});

// Activate: Clean up legacy caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== STATIC_CACHE && key !== RUNTIME_CACHE) {
              console.log('[PDFKit SW] Purging old cache:', key);
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Skip waiting message handler
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event handler with strict safety rules
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // 1. Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 2. Ignore non-http/https protocols (e.g. chrome-extension:, blob:, data:)
  if (!url.protocol.startsWith('http')) return;

  // 3. STRICT PRIVACY & API GUARD: Never intercept or cache API requests, PDFs, blobs, or downloads
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.endsWith('.pdf') ||
    url.pathname.includes('/download') ||
    url.searchParams.has('download')
  ) {
    return;
  }

  // 4. HTML Navigation: Network-First with cached fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put('/', clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = (await caches.match('/index.html')) || (await caches.match('/'));
          if (cached) return cached;
          return new Response('You are offline. Please reconnect to load new pages.', {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
    );
    return;
  }

  // 5. Static bundled assets & icons: Cache-First with Network Fallback
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/icons/') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.webmanifest') ||
      url.pathname.endsWith('.json') ||
      url.pathname.endsWith('.js') ||
      APP_SHELL_ASSETS.includes(url.pathname))
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 6. Google Fonts: Stale-While-Revalidate
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 7. Default network request
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

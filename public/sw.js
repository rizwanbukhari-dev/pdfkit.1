/**
 * PDFKit PWA Service Worker
 * Ensures reliable offline shell capabilities while strictly preserving user document privacy.
 * IMPORTANT: User files, uploaded documents, generated PDFs, and blobs are NEVER cached.
 */

const CACHE_NAME = 'pdfkit-v3';

// Core static assets required for the application shell
const APP_SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/pdf.worker.min.js',
];

// Install: Cache essential application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS).catch((err) => {
        console.warn('[PDFKit SW] Pre-caching partial failure:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up legacy caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[PDFKit SW] Removing outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Skip waiting when instructed by the client app
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

  // 3. STRICT PRIVACY & API GUARD: Never intercept or cache API requests, PDFs, blobs, or sensitive files
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.endsWith('.pdf') ||
    url.pathname.includes('/download') ||
    url.searchParams.has('download')
  ) {
    return;
  }

  // 4. HTML Navigation: Network-First with cached fallback
  // This ensures users always get the latest deployment from Vercel without stale code
  const isNavigation =
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    (request.headers.get('accept') && request.headers.get('accept').includes('text/html'));

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return (await caches.match('/')) || (await caches.match('/index.html'));
        })
    );
    return;
  }

  // 5. Static Assets (scripts, styles, fonts, icons): Stale-While-Revalidate / Cache-First
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/icons/') ||
      APP_SHELL_ASSETS.includes(url.pathname))
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // In background, revalidate to stay up to date
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, networkResponse);
                });
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 6. Default fetch for all other requests
  return;
});

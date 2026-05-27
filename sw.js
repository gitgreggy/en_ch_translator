const CACHE = 'yi-translate-v1';

// Files to cache for offline use
const PRECACHE = [
  './index.html',
  './manifest.json'
];

// Install — cache core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache
// API calls always go to network; app shell served from cache when offline
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always fetch API calls live — never cache them
  if (
    url.hostname.includes('openrouter.ai') ||
    url.hostname.includes('mymemory') ||
    url.hostname.includes('fonts.googleapis') ||
    url.hostname.includes('fonts.gstatic')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For app files: network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache a fresh copy
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

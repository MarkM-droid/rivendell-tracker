const CACHE_NAME = 'rivendell-tracker-v9';
const ASSETS = [
  '/rivendell-tracker/',
  '/rivendell-tracker/index.html',
  '/rivendell-tracker/manifest.json',
  '/rivendell-tracker/data/invoices.json',
  '/rivendell-tracker/data/submissions.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.warn('Cache addAll partial fail:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Network-first for API calls, invoices, and JSON data
  if (event.request.url.includes('api.github.com') ||
      event.request.url.includes('.html') ||
      event.request.url.includes('invoices.json') ||
      event.request.url.includes('submissions.json')) {
    event.respondWith(fetch(event.request, {cache: 'no-store'}).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});

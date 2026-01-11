
// Service Worker Pass-through Version 1.0.2
const BYPASS_DOMAINS = ['supabase.co', 'google-analytics.com'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('[SW] Installed and skipping waiting');
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // Xóa tất cả cache cũ khi activate bản mới
      caches.keys().then(names => Promise.all(names.map(name => caches.delete(name))))
    ])
  );
  console.log('[SW] Activated and caches cleared');
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // BYPASS SUPABASE: Không intercept, cho phép đi thẳng ra network
  if (BYPASS_DOMAINS.some(domain => url.includes(domain))) {
    console.log('[SW] Bypassing Supabase request:', url);
    event.respondWith(fetch(event.request));
    return;
  }

  // Luồng xử lý cho các request khác (ưu tiên Network)
  event.respondWith(
    fetch(event.request)
      .catch((err) => {
        console.warn('[SW] Fetch failed, checking cache:', url);
        return caches.match(event.request).then(response => {
          return response || fetch(event.request);
        });
      })
  );
});

// Service Worker v2.0 - No Cache Strategy
const CACHE_VERSION = 'v2.0.0';

self.addEventListener('install', (event) => {
  console.log('[SW] Installing v2.0...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // Xóa TẤT CẢ cache cũ
      caches.keys().then(names => 
        Promise.all(names.map(name => {
          console.log('[SW] Deleting cache:', name);
          return caches.delete(name);
        }))
      )
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // KHÔNG cache gì cả - luôn fetch từ network
  // Điều này đảm bảo app luôn load code mới nhất
  event.respondWith(
    fetch(event.request).catch(() => {
      // Nếu offline, trả về response lỗi thân thiện
      if (event.request.mode === 'navigate') {
        return new Response(
          '<html><body><h1>Offline</h1><p>Vui lòng kiểm tra kết nối mạng.</p></body></html>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      }
      return new Response('Offline', { status: 503 });
    })
  );
});

// Lắng nghe message để force update
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
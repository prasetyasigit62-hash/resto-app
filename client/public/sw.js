// Service Worker Dasar untuk PWA (Bypass Cache untuk data dinamis)
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
  // Biarkan fetch berjalan normal tanpa cache agar data real-time tetap jalan
  e.respondWith(fetch(e.request).catch(() => {
    return new Response('Anda sedang Offline. Harap periksa koneksi internet.');
  }));
});
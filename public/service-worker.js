/* ============================================================
   Sparks Líder – Service Worker
   Estratégia: Cache-First / Offline-First
   ============================================================ */

// Mudamos para v2 para forçar a atualização no navegador
const CACHE_NAME = 'sparks-lider-v2';

/* Arquivos corrigidos para a nova estrutura da pasta /public/ */
const STATIC_ASSETS = [
  '/',
  'index.html',
  'style.css',
  'app.js',
  'frases.json',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'spks-welcome.png'
];

/* ── Instalação: pré-cache dos arquivos estáticos ── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // O cache.addAll agora vai encontrar todos os arquivos na raiz
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

/* ── Ativação: remove caches antigos ── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

/* ── Fetch: Cache-First, fallback para rede ── */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          if (event.request.destination === 'document') {
            return caches.match('index.html');
          }
        });
    })
  );
});

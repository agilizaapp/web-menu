// Service Worker mínimo - apenas para permitir instalação PWA
// SEM cache offline - sempre busca da rede

self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalado');
  // Ativa imediatamente sem esperar
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativado');
  // Toma controle imediatamente
  event.waitUntil(clients.claim());
});

// Estratégia: Network Only (sempre busca da rede, sem fallback)
self.addEventListener('fetch', (event) => {
  // Simplesmente deixa a requisição passar normalmente
  // Não faz cache, não interfere - apenas permite a instalação PWA
  event.respondWith(fetch(event.request));
});

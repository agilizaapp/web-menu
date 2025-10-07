// Service Worker mínimo - apenas para permitir instalação PWA
// SEM cache offline - sempre busca da rede

self.addEventListener('install', (event) => {
  // Ativa imediatamente sem esperar
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Toma controle imediatamente
  event.waitUntil(clients.claim());
});

// Estratégia: Network Only (sempre busca da rede, sem fallback)
self.addEventListener('fetch', (event) => {
  // NÃO intercepta requisições de API para evitar duplicação
  // Apenas permite navegação para que o PWA funcione
  const url = new URL(event.request.url);
  
  // Se for requisição de API (localhost:3001 ou outras APIs), ignora completamente
  if (url.hostname === 'localhost' && url.port === '3001') {
    return; // Deixa o browser fazer a requisição normalmente
  }
  
  // Para outras requisições, simplesmente passa adiante sem cache
  event.respondWith(fetch(event.request));
});

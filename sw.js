const CACHE = 'lapidados-v1';

// Recursos que ficam em cache para funcionar offline
const STATIC = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js'
];

// Instala e faz cache dos recursos estáticos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Ativa e limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estratégia: Network first → cache fallback
// Supabase (API) sempre vai à rede — nunca cacheia dados do banco
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Requisições ao Supabase sempre vão para a rede (dados em tempo real)
  if (url.includes('supabase.co')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Para o resto: tenta rede primeiro, cai no cache se offline
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Guarda cópia no cache se for GET bem-sucedido
        if (e.request.method === 'GET' && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

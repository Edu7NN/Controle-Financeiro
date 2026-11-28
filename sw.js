/* Service worker: cache e notificações */
importScripts('js/version.js');
const V='controle-financeiro-'+APP_VERSION;

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>c.addAll(APP_FILES.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))
});

self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  const same=u.origin===location.origin,font=/(^|\.)(googleapis|gstatic)\.com$/.test(u.hostname);
  if(!same&&!font)return; 
  
  e.respondWith(caches.match(r,{ignoreSearch:same}).then(hit=>{
    const net=fetch(r).then(res=>{
      if(res && res.ok && res.status === 200 && res.type !== 'opaque'){
        try {
          const resClone = res.clone();
          caches.open(V).then(c=>c.put(r, resClone)).catch(()=>{});
        } catch(e) { }
      }
      return res;
    }).catch(()=>hit||(r.mode==='navigate'?caches.match('index.html'):Response.error()));
    return hit||net;
  }));
});

// === NOVO: RECEBER NOTIFICAÇÕES PUSH ===
self.addEventListener('push', function(event) {
  let data = { title: 'Controle Financeiro', body: 'Você tem um novo alerta.' };
  if (event.data) {
    try { data = event.data.json(); } catch (e) { data.body = event.data.text(); }
  }

  const options = {
    body: data.body,
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// === NOVO: CLIQUE NA NOTIFICAÇÃO (Abrir o app) ===
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (let i = 0; i < windowClients.length; i++) {
        let client = windowClients[i];
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(event.notification.data.url);
    })
  );
});

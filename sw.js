importScripts('js/version.js');
const V='controle-financeiro-'+APP_VERSION;
self.addEventListener('install',e=>{e.waitUntil(self.skipWaiting())});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return;
  
  // Tenta sempre buscar na rede primeiro para não travar código velho
  e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));
});

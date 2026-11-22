/* Service worker: deixa o app funcionar offline. A versão vem de js/version.js. */
importScripts('js/version.js');
const V='controle-financeiro-'+APP_VERSION;
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(APP_FILES.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  const same=u.origin===location.origin,font=/(^|\.)(googleapis|gstatic)\.com$/.test(u.hostname);
  if(!same&&!font)return; /* GitHub, Supabase e outros: direto na rede */
  e.respondWith(caches.match(r,{ignoreSearch:same}).then(hit=>{
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))caches.open(V).then(c=>c.put(r,res.clone()));return res})
      .catch(()=>hit||(r.mode==='navigate'?caches.match('index.html'):Response.error()));
    return hit||net;
  }));
});

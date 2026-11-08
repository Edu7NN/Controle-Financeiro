/* Service worker: deixa o app funcionar offline. Ao publicar mudanças, aumente o número da versão. */
const V='controle-financeiro-v1';
const SHELL=['./','index.html','manifest.webmanifest','css/styles.css','vendor/chart.umd.js','icons/icon-192.png','icons/icon-512.png',
  'js/utils.js','js/state.js','js/calc.js','js/charts.js','js/ui.js','js/expenses.js','js/simulator.js','js/backup.js','js/settings.js','js/app.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  const same=u.origin===location.origin,font=/(^|\.)(googleapis|gstatic)\.com$/.test(u.hostname);
  if(!same&&!font)return; /* GitHub API e outros: direto na rede */
  e.respondWith(caches.match(r,{ignoreSearch:same}).then(hit=>{
    const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))caches.open(V).then(c=>c.put(r,res.clone()));return res})
      .catch(()=>hit||(r.mode==='navigate'?caches.match('index.html'):Response.error()));
    return hit||net;
  }));
});

/* Inicialização */
Lock.init();
fillCats();
$('st').value=cur;$('ss').value=cur;
$('pv').onclick=()=>{cur=add(cur,-1);$('st').value=cur;$('ss').value=cur;render()};
$('nx').onclick=()=>{cur=add(cur,1);$('st').value=cur;$('ss').value=cur;render()};
$('bst').onclick=()=>showTab('op');
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',render);
Backup.init();Cloud.init();
showTab('in');paintEye();
$('ver').textContent=APP_VERSION;
$('upd').onclick=async()=>{
  const b=$('upd');b.disabled=true;b.textContent='Atualizando...';
  try{
    await Promise.all(APP_FILES.map(u=>fetch(u,{cache:'reload'}).catch(()=>{})));
    if(navigator.serviceWorker)await Promise.all((await navigator.serviceWorker.getRegistrations()).map(r=>r.unregister()));
    if(window.caches)await Promise.all((await caches.keys()).map(k=>caches.delete(k)));
    sessionStorage.setItem('fin_upd','1');
  }catch(e){}
  location.reload();
};
if(sessionStorage.getItem('fin_upd')){sessionStorage.removeItem('fin_upd');toast('Versão atualizada: v'+APP_VERSION)}
if('serviceWorker' in navigator&&location.protocol.indexOf('http')===0)navigator.serviceWorker.register('sw.js').catch(()=>{});
$('fab').onclick=()=>openQ();

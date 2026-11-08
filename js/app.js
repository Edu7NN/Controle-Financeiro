/* Inicialização */
fillCats();
$('st').value=cur;$('ss').value=cur;
$('pv').onclick=()=>{cur=add(cur,-1);$('st').value=cur;$('ss').value=cur;render()};
$('nx').onclick=()=>{cur=add(cur,1);$('st').value=cur;$('ss').value=cur;render()};
$('cfgb').onclick=openCfg;$('bst').onclick=openCfg;$('cfgx').onclick=()=>$('cfg').close();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',render);
Backup.init();
render();
if('serviceWorker' in navigator&&location.protocol.indexOf('http')===0)navigator.serviceWorker.register('sw.js').catch(()=>{});

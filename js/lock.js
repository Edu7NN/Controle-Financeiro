/* Privacidade: bloqueio por PIN (só neste aparelho). O PIN guarda apenas um hash, não criptografa os dados. */
var Lock=(()=>{
  const KL='fin_lock';
  let cfg=null,hiddenAt=0,fails=0,until=0;
  try{cfg=JSON.parse(localStorage.getItem(KL)||'null')}catch(e){}
  const can=()=>!!(window.crypto&&crypto.subtle);
  async function hash(pin,salt){
    const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+':'+pin));
    return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
  }
  function show(){
    if(!cfg)return;
    $('lkp').value='';$('lke').textContent='';
    if(!$('lk').open)$('lk').showModal();
    setTimeout(()=>$('lkp').focus(),50);
  }
  async function tryPin(){
    if(Date.now()<until){$('lke').textContent='Aguarde alguns segundos.';return}
    if(await hash($('lkp').value,cfg.salt)===cfg.hash){fails=0;$('lkp').value='';$('lk').close();return}
    fails++;$('lkp').value='';$('lke').textContent='PIN incorreto.';
    if(fails>=5){until=Date.now()+30000;fails=0;$('lke').textContent='Muitas tentativas. Aguarde 30 segundos.'}
  }
  async function set(pin){
    const salt=Array.from(crypto.getRandomValues(new Uint8Array(8))).map(x=>x.toString(16)).join('');
    cfg={salt,hash:await hash(pin,salt)};
    try{localStorage.setItem(KL,JSON.stringify(cfg))}catch(e){}
  }
  function section(){
    const eye='<p class="empty" style="margin:0 0 8px">O ícone de olho no topo oculta todos os valores. O estado fica salvo neste aparelho.</p>';
    if(!can())return eye+'<p class="empty">O bloqueio por PIN precisa de HTTPS (funciona no GitHub Pages).</p>';
    return eye+'<p class="empty" style="margin:0 0 8px">'+(cfg?'Bloqueio por PIN <b>ativo</b>: o app pede o PIN ao abrir e depois de 1 minuto em segundo plano.':'Defina um PIN de 4 a 6 números para proteger a abertura do app.')+'</p>'+
    '<div class="cr" style="grid-template-columns:1fr 1fr"><input id="lp1" type="password" inputmode="numeric" maxlength="6" placeholder="'+(cfg?'Novo PIN':'PIN')+'" autocomplete="off" aria-label="PIN"><input id="lp2" type="password" inputmode="numeric" maxlength="6" placeholder="Repita o PIN" autocomplete="off" aria-label="Repita o PIN"></div>'+
    '<div class="cr" style="grid-template-columns:'+(cfg?'1fr 1fr':'1fr')+'"><button id="lpa">'+(cfg?'Alterar PIN':'Ativar bloqueio')+'</button>'+(cfg?'<button class="s" id="lpr">Remover bloqueio</button>':'')+'</div><div id="lpm" role="status" style="color:var(--bd)"></div>';
  }
  function bind(root){
    const g=id=>root.querySelector('#'+id),m=t=>{g('lpm').textContent=t};
    if(!g('lpa'))return;
    g('lpa').onclick=async()=>{
      const a=g('lp1').value,b=g('lp2').value;
      if(!/^\d{4,6}$/.test(a))return m('Use de 4 a 6 números.');
      if(a!==b)return m('Os PINs não são iguais.');
      await set(a);toast('Bloqueio por PIN ativado');openCfg();
    };
    if(g('lpr'))g('lpr').onclick=()=>{cfg=null;try{localStorage.removeItem(KL)}catch(e){}toast('Bloqueio removido');openCfg()};
  }
  function init(){
    $('lk').addEventListener('cancel',e=>e.preventDefault());
    $('lkb').onclick=tryPin;
    $('lkp').addEventListener('keydown',e=>{if(e.key==='Enter')tryPin()});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)hiddenAt=Date.now();else if(cfg&&hiddenAt&&Date.now()-hiddenAt>60000)show()});
    show();
  }
  return{init,section,bind,show};
})();

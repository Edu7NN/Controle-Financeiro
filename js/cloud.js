/* Banco online (Supabase): login por e-mail e senha, sincronização do documento e aviso de conflito */
var Cloud=(()=>{
  const KS='fin_sb',KM='fin_sb_meta',TB='/rest/v1/financeiro';
  let ses=null,timer=null,busy=false;
  const meta={rev:null,dirty:false,err:'',last:null,email:''};
  try{ses=JSON.parse(localStorage.getItem(KS)||'null');Object.assign(meta,JSON.parse(localStorage.getItem(KM)||'{}'))}catch(e){}
  const on=()=>!!(SUPABASE_URL&&SUPABASE_KEY);
  const keep=()=>{try{localStorage.setItem(KS,JSON.stringify(ses));localStorage.setItem(KM,JSON.stringify(meta))}catch(e){}};
  const H=t=>({apikey:SUPABASE_KEY,Authorization:'Bearer '+(t||SUPABASE_KEY),'Content-Type':'application/json'});
  const empty=()=>!S.items.length&&!Object.keys(S.salary).length;
  async function auth(grant,body){
    const r=await fetch(SUPABASE_URL+'/auth/v1/token?grant_type='+grant,{method:'POST',headers:H(),body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.error_description||j.msg||'Falha no login ('+r.status+').');
    ses={at:j.access_token,rt:j.refresh_token,exp:Date.now()+(j.expires_in-60)*1000,email:(j.user&&j.user.email)||meta.email};keep();
  }
  async function token(){
    if(!ses)throw new Error('Entre com seu e-mail e senha.');
    if(Date.now()>ses.exp)await auth('refresh_token',{refresh_token:ses.rt});
    return ses.at;
  }
  async function get(){
    const r=await fetch(SUPABASE_URL+TB+'?select=data,updated_at',{headers:H(await token())});
    if(!r.ok)throw new Error('O banco respondeu '+r.status+'. Confira se o schema.sql foi executado.');
    return (await r.json())[0]||null;
  }
  const done=row=>{meta.rev=row.updated_at;meta.dirty=false;meta.last=new Date().toISOString()};
  async function insert(){
    const r=await fetch(SUPABASE_URL+TB,{method:'POST',headers:{...H(await token()),Prefer:'return=representation'},body:JSON.stringify({data:S})});
    if(!r.ok)throw new Error('O banco respondeu '+r.status+' ao criar o registro.');
    done((await r.json())[0]);
  }
  async function update(){
    const r=await fetch(SUPABASE_URL+TB+'?updated_at=eq.'+encodeURIComponent(meta.rev),{method:'PATCH',headers:{...H(await token()),Prefer:'return=representation'},body:JSON.stringify({data:S})});
    if(!r.ok)throw new Error('O banco respondeu '+r.status+' ao salvar.');
    const a=await r.json();if(!a.length)return false;done(a[0]);return true;
  }
  function applyRemote(rm){
    const old=JSON.stringify(S);
    applyState(JSON.parse(JSON.stringify(rm.data)));
    try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}
    meta.rev=rm.updated_at;meta.dirty=false;meta.last=new Date().toISOString();keep();
    if(window.Backup)Backup.touch();
    render();toast('Dados do banco carregados',()=>{applyState(JSON.parse(old));save();render()});
  }
  function choose(rm){
    const box=$('cldc');
    box.innerHTML='<h2>Dados diferentes</h2><p>O banco tem dados de <b>'+new Date(rm.updated_at).toLocaleString('pt-BR')+'</b> ('+((rm.data&&rm.data.items)||[]).length+' gastos). Este aparelho tem '+S.items.length+' gastos. Qual versão manter?</p><div class="cr" style="grid-template-columns:1fr"><button id="cu1">Usar os dados do banco</button><button class="s" id="cu2">Manter os deste aparelho e substituir o banco</button></div><p class="empty" style="font-size:13px">O banco guarda versões anteriores, e usar os dados do banco permite desfazer.</p>';
    box.querySelector('#cu1').onclick=()=>{$('cld').close();applyRemote(rm);paint()};
    box.querySelector('#cu2').onclick=async()=>{$('cld').close();meta.rev=rm.updated_at;meta.dirty=true;busy=false;await sync()};
    if(!$('cld').open)$('cld').showModal();
  }
  async function sync(){
    if(!on()||!ses||busy||!navigator.onLine)return;
    busy=true;
    try{
      if(meta.rev&&meta.dirty){if(!(await update()))choose(await get())}
      else{
        const rm=await get();
        if(!rm){if(!empty())await insert()}
        else if(rm.updated_at===meta.rev){}
        else if((!meta.dirty&&meta.rev)||empty())applyRemote(rm);
        else choose(rm);
      }
      meta.err='';
    }catch(e){meta.err=e.message}
    busy=false;keep();paint();
  }
  function paint(){
    const e=$('cst');if(!e)return;
    if(!on()){e.textContent='';return}
    e.textContent=!ses?'☁ Nuvem: entre para sincronizar':meta.err?'☁ Falha ao sincronizar':!navigator.onLine?'☁ Offline'+(meta.dirty?' · alterações pendentes':''):meta.dirty?'☁ Sincronizando…':'☁ Sincronizado';
    e.style.color=meta.err?'var(--bd)':'';
  }
  function touch(){
    meta.dirty=true;keep();paint();clearTimeout(timer);
    if(on()&&ses)timer=setTimeout(sync,2500);
  }
  function section(){
    if(!on())return '<p class="empty">O banco online ainda não está configurado. Preencha a URL e a chave em js/config.js (veja o README) e publique de novo.</p>';
    if(!ses)return '<p class="empty" style="margin:0 0 8px">Entre com o usuário criado no Supabase. Os dados passam a ser salvos no banco e abrem em qualquer aparelho.</p><div class="cr" style="grid-template-columns:1fr 1fr"><input id="ce" type="email" placeholder="E-mail" value="'+esc(meta.email)+'" autocomplete="username" aria-label="E-mail"><input id="cp" type="password" placeholder="Senha" autocomplete="current-password" aria-label="Senha"></div><div class="cr" style="grid-template-columns:1fr"><button id="cl">Entrar e sincronizar</button></div><div role="status" style="color:var(--bd)">'+esc(meta.err)+'</div>';
    return '<p class="empty" style="margin:0 0 8px">Conectado como <b>'+esc(ses.email||meta.email)+'</b>.<br>Última sincronização: <b>'+(meta.last?new Date(meta.last).toLocaleString('pt-BR'):'nunca')+'</b>'+(meta.err?'<br><span style="color:var(--bd)">'+esc(meta.err)+'</span>':'')+'</p><div class="cr" style="grid-template-columns:1fr 1fr"><button id="cs">Sincronizar agora</button><button class="s" id="co">Sair</button></div>';
  }
  function bind(root){
    const g=id=>root.querySelector('#'+id);
    if(g('cl'))g('cl').onclick=async()=>{
      const em=g('ce').value.trim();g('cl').disabled=true;
      try{await auth('password',{email:em,password:g('cp').value});if(meta.email&&meta.email!==em)meta.rev=null;meta.email=em;ses.email=em;meta.err='';keep();await sync()}
      catch(e){meta.err=e.message}
      keep();paint();openCfg();
    };
    if(g('cs'))g('cs').onclick=async()=>{await sync();openCfg()};
    if(g('co'))g('co').onclick=()=>{ses=null;keep();paint();openCfg()};
  }
  function init(){
    paint();
    window.addEventListener('online',()=>{paint();sync()});window.addEventListener('offline',paint);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
    sync();
  }
  return{init,touch,section,bind,sync};
})();

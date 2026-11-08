/* Backup: exportar arquivo, restaurar, e cópia automática em repositório privado do GitHub */
var Backup=(()=>{
  const KB='fin_backup_meta',KG='fin_gh';
  const meta={last:null,dirty:false,err:''},gh={owner:'',repo:'',token:''};
  let timer=null;
  try{Object.assign(meta,JSON.parse(localStorage.getItem(KB)||'{}'));Object.assign(gh,JSON.parse(localStorage.getItem(KG)||'{}'))}catch(e){}
  const store=()=>{try{localStorage.setItem(KB,JSON.stringify(meta));localStorage.setItem(KG,JSON.stringify(gh))}catch(e){}};
  const payload=()=>JSON.stringify({app:'controle-financeiro',version:1,exportedAt:new Date().toISOString(),data:S},null,2);
  const api=p=>'https://api.github.com/repos/'+gh.owner+'/'+gh.repo+'/contents/'+p;
  const hd=()=>({Authorization:'Bearer '+gh.token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'});
  const b64=s=>btoa(unescape(encodeURIComponent(s)));
  const stamp=()=>{meta.last=new Date().toISOString();meta.dirty=false;meta.err='';store();paint()};

  function validate(o){
    const d=o&&o.app==='controle-financeiro'?o.data:o;
    if(!d||typeof d!=='object'||!Array.isArray(d.items)||!d.salary||typeof d.salary!=='object')throw new Error('Arquivo inválido: não parece um backup do Controle financeiro.');
    return d;
  }
  function paint(){
    const e=$('bst');if(!e)return;let t,c;
    if(meta.err){t='Falha no backup automático';c='bd'}
    else if(!meta.last){t='Sem backup ainda';c='bd'}
    else{const d=Math.floor((Date.now()-new Date(meta.last))/864e5);
      t='Backup '+(d<1?'hoje':d===1?'ontem':'há '+d+' dias')+(meta.dirty?' (há alterações novas)':'');
      c=(d>=7||(meta.dirty&&d>=3))?'wn':'ok'}
    e.textContent=t;e.style.color='var(--'+c+')';e.style.borderColor='var(--'+c+')';
  }
  function touch(){
    meta.dirty=true;store();paint();clearTimeout(timer);
    if(gh.token&&gh.owner&&gh.repo)timer=setTimeout(push,4000);
  }
  async function put(path,content,msg){
    let sha;const g=await fetch(api(path),{headers:hd()});
    if(g.ok)sha=(await g.json()).sha;else if(g.status!==404)throw new Error('GitHub respondeu '+g.status+'. Confira usuário, repositório e token.');
    const r=await fetch(api(path),{method:'PUT',headers:hd(),body:JSON.stringify({message:msg,content:b64(content),sha})});
    if(!r.ok)throw new Error('GitHub respondeu '+r.status+' ao salvar o backup.');
  }
  async function push(){
    if(!gh.token||!gh.owner||!gh.repo)return;
    if(!navigator.onLine)return;
    if(!S.items.length&&!Object.keys(S.salary).length){meta.err='Sem dados para enviar. Se você limpou o navegador, restaure o backup antes de lançar gastos.';store();paint();return}
    try{
      const c=payload(),day=new Date().toISOString().slice(0,10);
      await put('financeiro-latest.json',c,'backup automático');
      await put('historico/financeiro-'+day+'.json',c,'backup do dia '+day);
      stamp();
    }catch(e){meta.err=e.message;store();paint()}
  }
  async function exportFile(){
    const name='controle-financeiro-backup-'+new Date().toISOString().slice(0,10)+'.json',f=new File([payload()],name,{type:'application/json'});
    try{
      if(navigator.canShare&&navigator.canShare({files:[f]}))await navigator.share({files:[f],title:name});else throw 0;
    }catch(e){
      if(e&&e.name==='AbortError')return;
      const a=document.createElement('a');a.href=URL.createObjectURL(f);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
    }
    stamp();
  }
  function confirmRestore(o,from,box){
    const d=validate(o),n=d.items.length,s=Object.keys(d.salary).length;
    box.innerHTML='<p>Backup de <b>'+esc(from)+'</b>'+(o.exportedAt?' ('+new Date(o.exportedAt).toLocaleString('pt-BR')+')':'')+': '+n+' gastos e '+s+' salários. Restaurar substitui os dados atuais, e dá para desfazer logo depois.</p><button id="rok">Restaurar agora</button> <button class="s" id="rno">Cancelar</button>';
    box.querySelector('#rok').onclick=()=>{withUndo('Backup restaurado',()=>applyState(JSON.parse(JSON.stringify(d))));$('cfg').close()};
    box.querySelector('#rno').onclick=()=>{box.innerHTML=''};
  }
  function section(){
    const last=meta.last?new Date(meta.last).toLocaleString('pt-BR'):'nunca';
    return '<p class="empty" style="margin:0 0 8px">Último backup: <b>'+last+'</b>'+(meta.err?'<br><span style="color:var(--bd)">'+esc(meta.err)+'</span>':'')+'</p>'+
    '<div class="cr" style="grid-template-columns:1fr 1fr"><button id="bx">Exportar backup (.json)</button><label class="btn" for="bf">Restaurar de arquivo<input id="bf" type="file" accept=".json,application/json" hidden></label></div>'+
    '<p class="empty" style="margin:10px 0 6px"><b>Backup automático em repositório privado do GitHub.</b> A cada alteração o sistema envia financeiro-latest.json e um arquivo por dia em historico/. Use um token com permissão Contents (leitura e escrita) só nesse repositório. Depois de limpar o navegador: cole o token, restaure o backup e só então lance gastos.</p>'+
    '<div class="cr" style="grid-template-columns:1fr 1fr"><input id="go" placeholder="Usuário (ex.: Edu7NN)" value="'+esc(gh.owner)+'" aria-label="Usuário do GitHub"><input id="gr" placeholder="Repositório privado" value="'+esc(gh.repo)+'" aria-label="Repositório de backup"></div>'+
    '<div class="cr"><input id="gt" type="password" placeholder="Token do GitHub" value="'+esc(gh.token)+'" autocomplete="off" aria-label="Token do GitHub"><button id="gs">Salvar e testar</button></div>'+
    '<div class="cr" style="grid-template-columns:1fr"><button class="s" id="gp">Restaurar o último backup do GitHub</button></div><div id="rst" role="status"></div>';
  }
  function bind(root){
    const g=id=>root.querySelector('#'+id),show=m=>{g('rst').innerHTML='<p style="color:var(--bd)">'+esc(m)+'</p>'};
    const keep=()=>{gh.owner=g('go').value.trim();gh.repo=g('gr').value.trim();gh.token=g('gt').value.trim();store()};
    g('bx').onclick=()=>{exportFile().then(()=>openCfg())};
    g('bf').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{confirmRestore(JSON.parse(await f.text()),'arquivo '+f.name,g('rst'))}catch(er){show(er.message)}};
    ['go','gr','gt'].forEach(id=>g(id).onchange=keep);
    g('gs').onclick=async()=>{keep();g('rst').textContent='Enviando backup de teste...';await push();openCfg()};
    g('gp').onclick=async()=>{
      keep();
      try{
        const r=await fetch(api('financeiro-latest.json'),{headers:{...hd(),Accept:'application/vnd.github.raw+json'}});
        if(!r.ok)throw new Error('GitHub respondeu '+r.status+'. Confira usuário, repositório e token.');
        confirmRestore(JSON.parse(await r.text()),'GitHub',g('rst'));
      }catch(er){show(er.message)}
    };
  }
  function init(){paint();window.addEventListener('online',()=>{if(meta.dirty)push()});try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}}
  return{init,touch,section,bind};
})();

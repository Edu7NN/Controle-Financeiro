/* Perfil financeiro: como você vive (renda e foco), o peso de cada categoria, regras pessoais, reserva e metas */
const LEVELS={E:'Essencial',F:'Flexível',D:'Desejo'};
const FOCUS={equilibrar:'Equilibrar tudo',reserva:'Montar a reserva',parcelas:'Reduzir parcelas',metas:'Juntar para as metas'};
const DEFAULT_LEVEL={Moradia:'E','Alimentação':'E','Saúde':'E',Transporte:'E','Educação':'E','Dívidas':'E',Lazer:'D',Compras:'D',Assinaturas:'D'};
const DEFAULT_RULES={parc:30,trav:50,reserve:6};

/** Peso de uma categoria. Aceita também o formato da versão 2.6 (lista "essential"). */
function levelOf(c,p){
  if(p.levels&&p.levels[c])return p.levels[c];
  if(Array.isArray(p.essential)&&p.essential.includes(c))return 'E';
  const d=DEFAULT_LEVEL[c]||'F';
  return Array.isArray(p.essential)&&d==='E'?'F':d;
}
/** Perfil efetivo: o que o usuário definiu, com padrões sensatos para o que faltar. */
function prof(){
  const p=S.profile||{},levels={};
  CATS.forEach(c=>levels[c]=levelOf(c,p));
  const income=p.income==='variavel'?'variavel':'fixa';
  return{
    levels,essential:CATS.filter(c=>levels[c]==='E'),income,focus:FOCUS[p.focus]?p.focus:'equilibrar',
    rules:{...DEFAULT_RULES,reserve:income==='variavel'?9:6,...(p.rules||{})},
    reserve:+p.reserve||0,mute:p.mute||{},onboarded:!!p.onboarded,obSkip:p.obSkip||''
  };
}
function editProfile(fn){S.profile=S.profile||{};fn(S.profile);save();render();if(TAB==='op')openCfg()}
/* mantém os pesos coerentes quando uma categoria é renomeada ou excluída */
function essRename(a,b){
  const p=S.profile;if(!p)return;
  if(p.levels&&p.levels[a]){p.levels[b]=p.levels[a];delete p.levels[a]}
  if(Array.isArray(p.essential))p.essential=p.essential.map(c=>c===a?b:c);
}
function essRemove(c){
  const p=S.profile;if(!p)return;
  if(p.levels)delete p.levels[c];
  if(Array.isArray(p.essential))p.essential=p.essential.filter(x=>x!==c);
}
const optHtml=(o,v)=>Object.entries(o).map(([k,n])=>'<option value="'+k+'"'+(k===v?' selected':'')+'>'+n+'</option>').join('');

function profileHtml(){
  const p=prof();
  return '<p class="empty" style="margin:0 0 8px">Diga ao sistema como você vive. Alertas, metas e sugestões de corte usam isso.</p>'+
    '<div class="f"><div><label for="pf1">Sua renda é</label><select id="pf1">'+optHtml({fixa:'Fixa',variavel:'Variável'},p.income)+'</select></div>'+
    '<div><label for="pf2">Seu foco agora</label><select id="pf2">'+optHtml(FOCUS,p.focus)+'</select></div></div>'+
    '<label style="margin-top:12px">Peso de cada categoria na sua vida</label><div class="lv">'+
    CATS.map(c=>'<span>'+esc(c)+'</span><select data-lvl="'+esc(c)+'" aria-label="Peso de '+esc(c)+'">'+optHtml(LEVELS,p.levels[c])+'</select>').join('')+'</div>'+
    '<p class="empty" style="margin:6px 0 0;font-size:13px">Essencial: não dá para cortar. Flexível: dá para reduzir. Desejo: o primeiro a cortar.</p>'+
    '<div class="f" style="margin-top:12px">'+
    '<div><label for="rp1">Parcelas até (%)</label><input id="rp1" type="number" min="5" max="80" value="'+p.rules.parc+'"></div>'+
    '<div><label for="rp2">Fixos + parcelas até (%)</label><input id="rp2" type="number" min="10" max="95" value="'+p.rules.trav+'"></div>'+
    '<div><label for="rp3">Reserva alvo (meses)</label><input id="rp3" type="number" min="1" max="24" value="'+p.rules.reserve+'"></div>'+
    '<div><label for="rp4">Reserva atual (R$)</label><input id="rp4" type="'+(PRIV?'password':'text')+'" inputmode="decimal" value="'+(p.reserve?String(p.reserve).replace('.',','):'')+'" placeholder="0,00"></div></div>'+
    '<p class="empty" style="margin:8px 0 0;font-size:13px">Os percentuais são sobre a receita do mês. Reserva alvo = meses do seu custo essencial que você quer ter guardados (sugestão: 6 com renda fixa, 9 com renda variável).</p>';
}
function profileBind(){
  const q=s=>$('cfgc').querySelectorAll(s);
  q('[data-lvl]').forEach(sl=>sl.onchange=()=>editProfile(pf=>{pf.levels={...prof().levels,[sl.dataset.lvl]:sl.value};delete pf.essential}));
  $('pf1').onchange=()=>editProfile(pf=>{pf.income=$('pf1').value});
  $('pf2').onchange=()=>editProfile(pf=>{pf.focus=$('pf2').value});
  [['rp1','parc',5,80],['rp2','trav',10,95],['rp3','reserve',1,24]].forEach(([id,k,lo,hi])=>$(id).onchange=()=>{
    const v=Math.round(pnum($(id).value));
    if(isNaN(v)||v<lo||v>hi)return openCfg();
    editProfile(pf=>{pf.rules={...DEFAULT_RULES,...(pf.rules||{}),[k]:v}});
  });
  $('rp4').onchange=()=>{
    const v=$('rp4').value.trim()===''?0:pnum($('rp4').value);
    if(isNaN(v)||v<0)return openCfg();
    editProfile(pf=>{pf.reserve=v});
  };
}

/* ---------- "Conhecendo você": três respostas que deixam os alertas mais certeiros ---------- */
function openOnb(){
  const p=prof();
  $('oi').innerHTML=optHtml({fixa:'Fixa',variavel:'Variável'},p.income);
  $('of').innerHTML=optHtml(FOCUS,p.focus);
  $('orv').value=p.reserve?String(p.reserve).replace('.',','):'';
  $('ob').showModal();
}
$('osv').onclick=()=>{
  const v=$('orv').value.trim()===''?0:pnum($('orv').value);
  if(isNaN(v)||v<0){$('orv').focus();return}
  editProfile(pf=>{pf.income=$('oi').value;pf.focus=$('of').value;pf.reserve=v;pf.onboarded=true});
  $('ob').close();toast('Perfil salvo');
};
$('odp').onclick=()=>{editProfile(pf=>{pf.obSkip=todayKey()});$('ob').close()};

/* ---------- metas ---------- */
let goalEdId=null;
function openGoal(id){
  const g=id?S.goals.find(x=>x.id===id):null;
  goalEdId=g?g.id:null;
  $('gdt').textContent=g?'Editar meta':'Nova meta';
  $('gnm').value=g?g.name:'';$('gtg').value=g?String(g.target).replace('.',','):'';
  $('gsv').value=g&&g.saved?String(g.saved).replace('.',','):'';$('gdl').value=g&&g.deadline?g.deadline:'';
  $('gdel').hidden=!g;$('gmsg').textContent='';
  $('gdg').showModal();$('gnm').focus();
}
function saveGoal(){
  const name=$('gnm').value.trim(),target=pnum($('gtg').value),saved=$('gsv').value.trim()===''?0:pnum($('gsv').value),deadline=$('gdl').value;
  if(!name||isNaN(target)||target<=0){$('gmsg').textContent='Informe o nome e o valor da meta.';return}
  if(isNaN(saved)||saved<0){$('gmsg').textContent='O valor já guardado não pode ser negativo.';return}
  const data={name,target,saved,...(deadline?{deadline}:{})},id=goalEdId;
  withUndo(id?'Meta atualizada':'Meta criada',()=>{
    if(id){const g=S.goals.find(x=>x.id===id);delete g.deadline;Object.assign(g,data)}
    else S.goals.push({id:uid(),...data});
  });
  $('gdg').close();if(TAB==='op')openCfg();
}
function deleteGoal(id){
  if(!S.goals.some(g=>g.id===id))return;
  withUndo('Meta excluída',()=>{S.goals=S.goals.filter(g=>g.id!==id)});
  if(TAB==='op')openCfg();
}
$('gsave').onclick=saveGoal;
$('gcancel').onclick=()=>$('gdg').close();
$('gdel').onclick=()=>{const id=goalEdId;$('gdg').close();deleteGoal(id)};
['gnm','gtg','gsv'].forEach(id=>$(id).addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();saveGoal()}}));

const pbar=(pct,n)=>'<div class="tlb" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct+'" aria-label="Progresso de '+esc(n)+'"><i class="'+(pct>=100?'near':'')+'" style="width:'+Math.min(100,pct)+'%"></i></div>';
/** Texto curto do estado de uma meta, a partir do plano calculado em diagnostico.js. */
function goalText(g,p){
  if(p.st==='done')return 'Meta atingida.';
  if(p.st==='late')return 'Prazo vencido. Faltam '+R(p.left)+'.';
  if(p.st==='open')return 'Sem prazo. Com a sua sobra média, chega em '+(p.eta?sh(p.eta):'—')+'.';
  const base='Precisa de '+R(p.need)+' por mês · sobra média '+R(p.avg)+' · ';
  return base+(p.st==='ok'?'viável.':p.st==='tight'?'apertada.':'não cabe no prazo'+(p.eta?'; no ritmo atual chega em '+sh(p.eta)+'.':'.'));
}
function goalsHtml(){
  const ri=reserveInfo(),P=prof();
  const resv=ri.cost>0?'<div class="gl"><div class="glh"><b>Reserva de emergência</b><span>'+(P.reserve?R(P.reserve):'—')+' de '+R(ri.target)+'</span></div>'+pbar(ri.target?Math.round(P.reserve/ri.target*100):0,'Reserva de emergência')+'<small>Alvo: '+P.rules.reserve+' meses de custo essencial ('+R(ri.cost)+' por mês).</small></div>':'';
  const list=S.goals.map(g=>{
    const pl=goalPlan(g),pct=Math.round((g.saved||0)/g.target*100);
    return '<div class="gl"><div class="glh"><b>'+esc(g.name)+'</b><span>'+R(g.saved||0)+' de '+R(g.target)+(g.deadline?' · até '+sh(g.deadline):'')+'</span></div>'+pbar(pct,g.name)+
      '<small>'+goalText(g,pl)+'</small><div class="icb" style="margin-top:6px"><button class="s" data-ge="'+g.id+'" aria-label="Editar '+esc(g.name)+'">✎</button><button class="s" data-gdl="'+g.id+'" aria-label="Excluir '+esc(g.name)+'">✕</button></div></div>';
  }).join('');
  return '<p class="empty" style="margin:0 0 8px">Metas com valor e prazo. O sistema compara com a sua sobra projetada e diz se cabe.</p>'+resv+list+
    (!resv&&!list?'<p class="empty">Nenhuma meta ainda.</p>':'')+'<div class="cr" style="grid-template-columns:1fr"><button id="gadd">+ Adicionar meta</button></div>';
}
function goalsBind(){
  const q=s=>$('cfgc').querySelectorAll(s);
  q('[data-ge]').forEach(b=>b.onclick=()=>openGoal(b.dataset.ge));
  q('[data-gdl]').forEach(b=>b.onclick=()=>deleteGoal(b.dataset.gdl));
  $('gadd').onclick=()=>openGoal();
}

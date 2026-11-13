/* Lista de gastos: busca, filtros, seleção em lote, menu ⋯ e gestos de deslizar */
const F={q:'',cat:'',who:'',st:''};
let SELM=false,VIEW='l',LASTALL=[],LASTVIS=[];
const SEL=new Set();
const isPaid=r=>!!S.paid[r.id+'|'+cur];
function matchF(r){
  const q=norm(F.q);
  if(q&&!(norm(r.name).includes(q)||norm(r.cat).includes(q)||norm(r.who||'').includes(q)||norm(cardName(r.card)).includes(q)))return false;
  if(F.cat&&r.cat!==F.cat)return false;
  if(F.who==='__me'&&r.who)return false;
  if(F.who&&F.who!=='__me'&&r.who!==F.who)return false;
  if(F.st==='p'&&isPaid(r))return false;
  if(F.st==='g'&&!isPaid(r))return false;
  return true;
}
function fillFilters(all){
  const people=[...new Set(all.filter(r=>r.who).map(r=>r.who))];
  const set=(id,html,val)=>{const e=$(id);e.innerHTML=html;e.value=val;if(val&&e.value!==val){e.value='';return ''}return val};
  F.cat=set('fc','<option value="">Todas as categorias</option>'+CATS.map(c=>'<option>'+esc(c)+'</option>').join(''),F.cat);
  F.who=set('fw','<option value="">Todas as pessoas</option><option value="__me">Só meus</option>'+people.map(n=>'<option>'+esc(n)+'</option>').join(''),F.who);
  $('fs').value=F.st;
  const nf=(F.cat?1:0)+(F.who?1:0)+(F.st?1:0);
  $('fsm').textContent='Filtros'+(nf?' ('+nf+')':'');
  $('fclr').hidden=!(F.q||nf);
}
function rowHtml(r){
  const p=isPaid(r),on=SELM&&SEL.has(r.id);
  return '<div class="row'+(p?' pd':'')+(on?' sel':'')+'" data-id="'+r.id+'">'+
  '<input type="checkbox" class="ck" aria-label="'+(SELM?'Selecionar: ':r.who?'Reembolsado: ':'Pago: ')+esc(r.name)+'" title="'+(SELM?'Selecionar':r.who?'Marcar como reembolsado':'Marcar como pago')+'" data-p="'+r.id+'"'+((SELM?on:p)?' checked':'')+'>'+
  '<div class="nm"><b>'+esc(r.name)+'</b><small>'+esc(r.cat)+(r.day?' · dia '+r.day:'')+(r.card&&cardById(r.card)?' <span class="pill">'+esc(cardName(r.card))+'</span>':'')+(r.who?' <span class="pill who">de '+esc(r.who)+'</span>':'')+(r.rec?' <span class="pill">↻ mensal</span>':r.n>1?' <span class="pill">parcela '+r.k+'/'+r.n+'</span>':'')+'</small></div>'+
  '<strong>'+R(r.val)+'</strong><div class="ac"><button class="mn" data-m="'+r.id+'" aria-label="Mais ações de '+esc(r.name)+'" aria-haspopup="dialog">⋯</button></div></div>';
}
function togglePaid(id){const k=id+'|'+cur;if(S.paid[k])delete S.paid[k];else S.paid[k]=true;save();render()}
function renderList(all){
  LASTALL=all;fillFilters(all);
  $('v-l').hidden=VIEW!=='l';$('v-f').hidden=VIEW!=='f';
  document.querySelectorAll('.seg [data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v===VIEW));
  const vis=all.filter(matchF).sort((a,b)=>(a.who?1:0)-(b.who?1:0)||b.val-a.val);LASTVIS=vis;
  const mine=vis.filter(r=>!r.who);
  $('lsum').textContent=all.length?(vis.length===all.length?all.length+(all.length===1?' gasto':' gastos'):vis.length+' de '+all.length+' gastos')+(mine.length?' · seus: '+R(sumV(mine)):''):'';
  $('list').innerHTML=!all.length?'<p class="empty">Nenhum gasto em '+lab(cur)+'. Toque no + para lançar o primeiro.</p>':!vis.length?'<p class="empty">Nenhum gasto com esses filtros.</p>':vis.map(rowHtml).join('');
  $('list').querySelectorAll('[data-p]').forEach(b=>b.onchange=()=>{
    if(SELM){b.checked?SEL.add(b.dataset.p):SEL.delete(b.dataset.p);paintSel();return}
    togglePaid(b.dataset.p);
  });
  $('list').querySelectorAll('[data-m]').forEach(b=>b.onclick=e=>{e.stopPropagation();openMenu(b.dataset.m)});
  if(SELM)$('list').querySelectorAll('.row').forEach(r=>r.onclick=e=>{
    if(e.target.closest('button,input'))return;
    const cb=r.querySelector('[data-p]');cb.checked=!cb.checked;cb.dispatchEvent(new Event('change'));
  });
  if(VIEW==='f')renderFaturas(all);
  paintSel();
}
function paintSel(){
  $('selbar').hidden=!(SELM&&TAB==='gs'&&VIEW==='l');
  $('selb').textContent=SELM?'Cancelar':'Selecionar';
  $('selc').textContent=SEL.size+(SEL.size===1?' selecionado':' selecionados');
  $('list').querySelectorAll('.row').forEach(r=>r.classList.toggle('sel',SELM&&SEL.has(r.dataset.id)));
}
function setSel(on){SELM=on;SEL.clear();renderList(LASTALL)}
function batch(paid){
  if(!SEL.size)return;
  const ids=[...SEL];setSel(false);
  withUndo(ids.length+(paid?(ids.length===1?' gasto marcado como pago':' gastos marcados como pagos'):(ids.length===1?' gasto marcado como pendente':' gastos marcados como pendentes')),()=>{
    ids.forEach(id=>{const k=id+'|'+cur;if(paid)S.paid[k]=true;else delete S.paid[k]});
  });
}
/* menu ⋯ */
function openMenu(id){
  const r=LASTALL.find(x=>x.id===id);if(!r)return;
  $('rmt').textContent=r.name+' · '+R(r.val);
  $('rm-pay').textContent=isPaid(r)?(r.who?'Marcar como não reembolsado':'Marcar como pendente'):(r.who?'Marcar como reembolsado':'Marcar como pago');
  $('rm-del').textContent=(r.rec||r.n>1)?'Excluir a compra inteira':'Excluir';
  $('rm').dataset.id=id;$('rm').showModal();
}
const rmId=()=>{const id=$('rm').dataset.id;$('rm').close();return id};
$('rm-edit').onclick=()=>openEd(rmId());
$('rm-pay').onclick=()=>togglePaid(rmId());
$('rm-dup').onclick=()=>{const id=rmId();addCopy(LASTALL.find(x=>x.id===id),cur)};
$('rm-del').onclick=()=>removeItem(rmId());
$('rm-x').onclick=()=>$('rm').close();
/* seleção em lote */
$('selb').onclick=()=>setSel(!SELM);
$('selx').onclick=()=>setSel(false);
$('sela').onclick=()=>{LASTVIS.forEach(r=>SEL.add(r.id));renderList(LASTALL)};
$('selp').onclick=()=>batch(true);
$('selu').onclick=()=>batch(false);
$('seld').onclick=()=>{
  if(!SEL.size)return;
  const ids=new Set(SEL);setSel(false);
  withUndo(ids.size+(ids.size===1?' gasto excluído':' gastos excluídos'),()=>{S.items=S.items.filter(i=>!ids.has(i.id))});
};
/* busca, filtros e visões */
$('q').addEventListener('input',()=>{F.q=$('q').value;renderList(LASTALL)});
$('fc').onchange=()=>{F.cat=$('fc').value;renderList(LASTALL)};
$('fw').onchange=()=>{F.who=$('fw').value;renderList(LASTALL)};
$('fs').onchange=()=>{F.st=$('fs').value;renderList(LASTALL)};
$('fclr').onclick=()=>{F.q=F.cat=F.who=F.st='';$('q').value='';renderList(LASTALL)};
document.querySelectorAll('.seg [data-v]').forEach(b=>b.onclick=()=>{VIEW=b.dataset.v;if(VIEW==='f')SELM=false;renderList(LASTALL)});
/* deslizar: direita = pago/pendente, esquerda = excluir (com Desfazer) */
let sw=null;
const L=$('list');
L.addEventListener('touchstart',e=>{
  const r=e.target.closest('.row');
  if(!r||SELM||e.target.closest('button,input'))return;
  const t=e.touches[0];sw={r,x:t.clientX,y:t.clientY,dx:0,on:false};
},{passive:true});
L.addEventListener('touchmove',e=>{
  if(!sw)return;
  const t=e.touches[0],dx=t.clientX-sw.x,dy=t.clientY-sw.y;
  if(!sw.on){
    if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){sw=null;return}
    if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy))sw.on=true;
  }
  if(sw.on){sw.dx=dx;sw.r.style.transform='translateX('+Math.max(-140,Math.min(140,dx))+'px)';sw.r.classList.toggle('sw-r',dx>0);sw.r.classList.toggle('sw-l',dx<0)}
},{passive:true});
L.addEventListener('touchend',()=>{
  if(!sw)return;
  const {r,dx,on}=sw;sw=null;
  r.style.transform='';r.classList.remove('sw-r','sw-l');
  if(!on)return;
  if(dx>90)togglePaid(r.dataset.id);else if(dx<-90)removeItem(r.dataset.id);
});

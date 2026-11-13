/* Receitas além do salário: 13º salário, renda extra, bônus e outras, cada uma com o seu nome */
const INC_TYPES=['13º salário','Renda extra','Bônus','Outros'];
let incEdId=null;

function fillIncTypes(){$('ity').innerHTML=INC_TYPES.map(t=>'<option>'+esc(t)+'</option>').join('')}

/** Abre o formulário para criar (sem id) ou editar uma receita. */
function openInc(id){
  const i=id?S.incomes.find(x=>x.id===id):null;
  incEdId=i?i.id:null;
  $('idt').textContent=i?'Editar receita':'Nova receita';
  $('inm').value=i?i.name:'';
  $('ity').value=i?i.type:INC_TYPES[0];
  $('ival').value=i?String(i.val).replace('.',','):'';
  $('ist').value=i?i.start:cur;
  $('irc').value=i&&i.rec?'r':'u';
  $('ien').value=i&&i.end?i.end:'';
  $('iew').hidden=!(i&&i.rec);
  $('idel').hidden=!i;
  $('imsg').textContent='';
  $('idg').showModal();
  $('inm').focus();
}
const afterIncChange=()=>{if(TAB==='op')openCfg()};
function saveInc(){
  const name=$('inm').value.trim(),v=pnum($('ival').value),start=$('ist').value||cur,rec=$('irc').value==='r',end=rec?$('ien').value:'';
  if(!name||isNaN(v)||v<=0){$('imsg').textContent='Informe o nome e um valor maior que zero.';return}
  if(end&&num(end)<num(start)){$('imsg').textContent='O fim não pode ser antes do início.';return}
  const data={name,type:$('ity').value,val:v,start,...(rec?{rec:true}:{}),...(end?{end}:{})},id=incEdId;
  withUndo(id?'Receita atualizada':'Receita adicionada',()=>{
    if(id){const i=S.incomes.find(x=>x.id===id);delete i.rec;delete i.end;Object.assign(i,data)}
    else S.incomes.push({id:uid(),...data});
  });
  $('idg').close();afterIncChange();
}
function deleteInc(id){
  if(!S.incomes.some(i=>i.id===id))return;
  withUndo('Receita excluída',()=>{S.incomes=S.incomes.filter(i=>i.id!==id)});
  afterIncChange();
}
$('isv').onclick=saveInc;
$('ixx').onclick=()=>$('idg').close();
$('idel').onclick=()=>{const id=incEdId;$('idg').close();deleteInc(id)};
$('irc').onchange=()=>{$('iew').hidden=$('irc').value!=='r'};
$('qinc').onclick=()=>{$('qd').close();openInc()};
['inm','ival'].forEach(id=>$(id).addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();saveInc()}}));
fillIncTypes();

/** Receitas do mês exibido, dentro de "Detalhes e receitas" na tela Início. */
function renderInc(){
  const rs=incRows(cur),box=$('incbox');
  box.innerHTML='<b>Outras receitas de '+lab(cur)+'</b>'+
    (rs.length?rs.map(i=>'<button class="inc" data-inc="'+i.id+'"><span><b>'+esc(i.name)+'</b><small><span class="pill">'+esc(i.type)+'</span>'+(i.rec?' <span class="pill">↻ mensal</span>':'')+'</small></span><strong>'+R(i.val)+'</strong></button>').join('')+
      '<p class="empty" style="margin:8px 0 0;font-size:13px">Salário '+R(baseSal(cur))+' + outras '+R(extraInc(cur))+' = receita '+R(sal(cur))+'</p>'
      :'<p class="empty" style="margin:6px 0 8px;font-size:13px">Nenhuma receita extra neste mês.</p>')+
    '<button class="s sm" id="incadd" style="margin-top:8px">+ Adicionar receita</button>';
  box.querySelectorAll('[data-inc]').forEach(b=>b.onclick=()=>openInc(b.dataset.inc));
  $('incadd').onclick=()=>openInc();
}

/** Seção "Outras receitas" da aba Opções (todas as receitas, de todos os meses). */
function incomesHtml(){
  const L=[...S.incomes].sort((a,b)=>num(b.start)-num(a.start));
  return '<p class="empty" style="margin:0 0 8px">13º salário, renda extra, bônus e outras entradas, cada uma com o seu nome. Contam na receita do mês.</p>'+
    (L.length?L.map(i=>'<div class="cr ic"><span>'+esc(i.name)+'<small class="blk">'+esc(i.type)+' · '+(i.rec?'todo mês desde '+sh(i.start)+(i.end?' até '+sh(i.end):''):sh(i.start))+'</small></span><strong>'+R(i.val)+'</strong><span class="icb"><button class="s" data-ie="'+i.id+'" aria-label="Editar '+esc(i.name)+'">✎</button><button class="s" data-idl="'+i.id+'" aria-label="Excluir '+esc(i.name)+'">✕</button></span></div>').join(''):'<p class="empty">Nenhuma receita extra cadastrada.</p>')+
    '<div class="cr" style="grid-template-columns:1fr"><button id="inca">+ Adicionar receita</button></div>';
}
function incomesBind(){
  const q=s=>$('cfgc').querySelectorAll(s);
  q('[data-ie]').forEach(b=>b.onclick=()=>openInc(b.dataset.ie));
  q('[data-idl]').forEach(b=>b.onclick=()=>deleteInc(b.dataset.idl));
  $('inca').onclick=()=>openInc();
}

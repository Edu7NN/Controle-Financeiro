/* Cartões de crédito: cadastro, escolha nos lançamentos e visão de faturas */
function cardById(id){return (S.cards||[]).find(c=>c.id===id)}
function cardName(id){const c=cardById(id);return c?c.name:''}
function fillCards(){
  const o='<option value="">Sem cartão</option>'+(S.cards||[]).map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join('');
  const a=$('cd').value,b=$('ecd').value;
  $('cd').innerHTML=o+'<option value="__new__">➕ Novo cartão…</option>';$('ecd').innerHTML=o;
  if(cardById(a))$('cd').value=a;if(cardById(b))$('ecd').value=b;
}
$('cd').addEventListener('change',()=>{$('ncw').hidden=$('cd').value!=='__new__';if(!$('ncw').hidden)$('ncn').focus()});
$('ncs').onclick=()=>{
  const n=$('ncn').value.trim(),d=parseInt($('ncd').value);
  if(!n)return $('ncn').focus();
  if(S.cards.some(c=>norm(c.name)===norm(n))){$('msg').textContent='Já existe um cartão com esse nome.';return}
  const c={id:uid(),name:n,due:d>=1&&d<=31?d:null};
  S.cards.push(c);save();fillCards();$('cd').value=c.id;$('ncw').hidden=true;$('ncn').value='';$('ncd').value='';$('msg').textContent='';
};
const sumV=a=>a.reduce((s,r)=>s+r.val,0);
function dueInfo(due,done){
  if(done)return '';
  const [y,mo]=cur.split('-').map(Number),dim=new Date(y,mo,0).getDate(),d=new Date(y,mo-1,Math.min(due,dim)),t=new Date();
  t.setHours(0,0,0,0);
  const n=Math.round((d-t)/864e5);
  if(n<0)return '<p class="warn">Fatura vencida há '+(-n)+(n===-1?' dia':' dias')+'</p>';
  if(n===0)return '<p class="warn">Vence hoje</p>';
  if(n<=7)return '<p class="warn soft">Vence em '+n+(n===1?' dia':' dias')+'</p>';
  return '';
}
function payInvoice(id){
  const rs=rows(cur).filter(r=>r.card===id&&!r.who);if(!rs.length)return;
  const done=rs.every(r=>S.paid[r.id+'|'+cur]);
  withUndo(done?'Fatura desmarcada':'Fatura de '+cardName(id)+' marcada como paga',()=>{
    rs.forEach(r=>{const k=r.id+'|'+cur;if(done)delete S.paid[k];else S.paid[k]=true});
  });
}
function renderFaturas(all){
  const box=$('fat');
  if(!(S.cards||[]).length){box.innerHTML='<p class="empty">Nenhum cartão cadastrado. Ao lançar um gasto, abra “Mais opções” e escolha “➕ Novo cartão…”, ou cadastre em Opções > Cartões.</p>';return}
  const sem=all.filter(r=>!r.card||!cardById(r.card)).length;
  box.innerHTML=S.cards.map(c=>{
    const rs=all.filter(r=>r.card===c.id),mine=rs.filter(r=>!r.who),oth=rs.filter(r=>r.who);
    const tm=sumV(mine),to=sumV(oth),done=mine.length>0&&mine.every(r=>S.paid[r.id+'|'+cur]);
    return '<div class="inv"><div class="ih"><b>'+esc(c.name)+'</b>'+(c.due?'<span class="pill">vence dia '+c.due+'</span>':'')+(done?'<span class="pill ok">paga</span>':'')+'</div>'+
    (rs.length?'<div class="it">'+R(tm+to)+'</div><div class="is">Sua parte '+R(tm)+(to?' · De outras pessoas '+R(to):'')+'</div>'+(c.due?dueInfo(c.due,done):'')+
      (mine.length?'<button data-pay="'+esc(c.id)+'" class="'+(done?'s':'')+'">'+(done?'Desmarcar fatura paga':'Marcar minha parte como paga')+'</button>':'')+
      '<details><summary>'+rs.length+(rs.length===1?' lançamento':' lançamentos')+'</summary>'+
      rs.sort((a,b)=>(a.who?1:0)-(b.who?1:0)||b.val-a.val).map(r=>'<div class="il"><span>'+esc(r.name)+' <small>'+(r.rec?'mensal':r.n>1?'parcela '+r.k+'/'+r.n:'')+(r.who?' · de '+esc(r.who):'')+'</small></span><strong>'+R(r.val)+'</strong></div>').join('')+'</details>'
     :'<p class="empty">Sem lançamentos neste mês.</p>')+'</div>';
  }).join('')+(sem?'<p class="empty" style="margin:12px 0 0;font-size:13px">'+sem+(sem===1?' gasto sem cartão não aparece':' gastos sem cartão não aparecem')+' aqui.</p>':'');
  box.querySelectorAll('[data-pay]').forEach(b=>b.onclick=()=>payInvoice(b.dataset.pay));
}
function cardsHtml(){
  return '<p class="empty" style="margin:0 0 8px">Cadastre seus cartões e o dia do vencimento. Ao lançar um gasto, escolha o cartão em “Mais opções”.</p>'+
  S.cards.map((c,i)=>'<div class="cr cc"><input value="'+esc(c.name)+'" data-cn="'+i+'" aria-label="Nome do cartão"><input type="number" min="1" max="31" value="'+(c.due||'')+'" placeholder="Venc." data-cdue="'+i+'" aria-label="Dia do vencimento"><button class="s" data-cdel="'+i+'" aria-label="Excluir cartão '+esc(c.name)+'">✕</button></div>').join('')+
  '<div class="cr cc"><input id="ncn2" placeholder="Novo cartão" aria-label="Nome do novo cartão"><input id="ncd2" type="number" min="1" max="31" placeholder="Venc." aria-label="Dia do vencimento"><button id="nca">Adicionar</button></div>';
}
function cardsBind(){
  const q=s=>$('cfgc').querySelectorAll(s);
  q('[data-cn]').forEach(el=>el.onchange=()=>{
    const c=S.cards[+el.dataset.cn],v=el.value.trim();
    if(!v||S.cards.some(x=>x!==c&&norm(x.name)===norm(v)))return openCfg();
    withUndo('Cartão renomeado',()=>{c.name=v});fillCards();openCfg();
  });
  q('[data-cdue]').forEach(el=>el.onchange=()=>{
    const c=S.cards[+el.dataset.cdue],d=parseInt(el.value);
    withUndo('Vencimento alterado',()=>{c.due=d>=1&&d<=31?d:null});openCfg();
  });
  q('[data-cdel]').forEach(b=>b.onclick=()=>{
    const c=S.cards[+b.dataset.cdel];
    withUndo('Cartão excluído',()=>{
      S.items.forEach(i=>{if(i.card===c.id)delete i.card;if(i.ov)Object.values(i.ov).forEach(o=>{if(o.card===c.id)o.card=''})});
      S.cards=S.cards.filter(x=>x!==c);
    });fillCards();openCfg();
  });
  $('nca').onclick=()=>{
    const n=$('ncn2').value.trim(),d=parseInt($('ncd2').value);
    if(!n||S.cards.some(x=>norm(x.name)===norm(n)))return openCfg();
    withUndo('Cartão adicionado',()=>{S.cards.push({id:uid(),name:n,due:d>=1&&d<=31?d:null})});fillCards();openCfg();
  };
}

/* Gastos: cadastro, parcelas, recorrência, edição e exclusão */
$('ad').onclick=()=>{
  const name=$('nm').value.trim(),v=parseFloat($('vl').value.replace(/\./g,'').replace(',','.')),n=Math.max(1,Math.min(72,parseInt($('np').value)||1)),st=$('st').value||cur,m=$('msg');
  if(!name||isNaN(v)||v<=0){m.textContent='Preencha o nome e um valor maior que zero.';return}
  const rec=$('rc').value==='r',nn=rec?1:n,who=$('wh').value.trim(),card=$('cd').value==='__new__'?'':$('cd').value;
  const val=!rec&&$('tp').value==='t'?Math.round(v/nn*100)/100:v;
  const snap=JSON.stringify(S);S.items.push({id:uid(),name,cat:$('ct').value,val,n:nn,start:st,...(rec?{rec:true}:{}),...(who?{who}:{}),...(card?{card}:{})});save();
  m.textContent=rec?'Recorrente adicionado: '+R(val)+' por mês, a partir de '+lab(st)+'.':nn>1?'Adicionado: '+nn+' parcelas de '+R(val)+', de '+sh(st)+' até '+sh(add(st,nn-1))+'.':'Gasto adicionado em '+lab(st)+'.';
  if(who)m.textContent+=' Gasto de '+who+': não soma nos seus totais.';
  $('nm').value='';$('vl').value='';$('np').value=1;$('wh').value='';$('cd').value='';$('ncw').hidden=true;
  cur=st;render();
  $('qd').close();
  toast(m.textContent,()=>{applyState(JSON.parse(snap));save();render()});
};
const rcSync=()=>{const r=$('rc').value==='r';$('np').disabled=r;$('tp').disabled=r;$('stl').textContent=r?'Começa em':'Primeira parcela em'};
$('rc').onchange=rcSync;
let ed=null;
function openEd(id){
  const it=S.items.find(i=>i.id===id),r=rows(cur).find(x=>x.id===id);if(!it||!r)return;
  ed={id,m:cur,snap:JSON.stringify(S)};
  $('en').value=r.name;$('ec').value=r.cat;$('ev').value=String(r.val).replace('.',',');$('em').textContent='';
  const multi=it.rec||it.n>1;
  $('sc').style.display=multi?'':'none';$('ee').style.display=it.rec?'':'none';
  $('dt').textContent=it.rec?'Editar gasto recorrente':it.n>1?'Editar parcela '+r.k+'/'+it.n:'Editar gasto';
  $('evl').textContent=it.rec?'Valor mensal (R$)':it.n>1?'Valor da parcela (R$)':'Valor (R$)';
  $('s1').textContent=lab(cur);
  document.querySelector('input[name=scp][value=this]').checked=true;
  $('ew').value=r.who||'';$('ecd').value=r.card||'';$('enp').value=it.n;$('npw').style.display=it.rec?'none':'';$('npk').style.display='none';
  document.querySelector('input[name=npm][value=p]').checked=true;
  $('dg').showModal();
}
$('enp').oninput=()=>{
  const it=S.items.find(i=>i.id===ed.id);if(!it)return;
  const ch=!it.rec&&(parseInt($('enp').value)||it.n)!==it.n;
  $('npk').style.display=ch?'':'none';$('sc').style.display=ch?'none':(it.rec||it.n>1)?'':'none';
};
$('ex').onclick=()=>$('dg').close();
$('ee').onclick=()=>{
  const it=S.items.find(i=>i.id===ed.id);if(!it)return;
  const e=add(ed.m,-1);
  if(num(e)<num(it.start))S.items=S.items.filter(i=>i!==it);else it.end=e;
  afterEdit();
};
$('es').onclick=()=>{
  const it=S.items.find(i=>i.id===ed.id);if(!it)return;
  const name=$('en').value.trim(),val=parseFloat($('ev').value.replace(/\./g,'').replace(',','.')),cat=$('ec').value,m=ed.m,who=$('ew').value.trim(),card=$('ecd').value,nn=it.rec?it.n:Math.max(1,Math.min(72,parseInt($('enp').value)||it.n));
  if(!name||isNaN(val)||val<=0){$('em').textContent='Preencha o nome e um valor maior que zero.';return}
  if(!it.rec&&nn!==it.n){
    const keepTotal=document.querySelector('input[name=npm]:checked').value==='t',total=val*it.n;
    Object.assign(it,{name,cat,who,card,val:keepTotal?Math.round(total/nn*100)/100:val,n:nn});
    if(keepTotal)delete it.ov;
    return afterEdit('Parcelas alteradas para '+nn+'×');
  }
  const sc=(it.rec||it.n>1)?document.querySelector('input[name=scp]:checked').value:'all',k=num(m)-num(it.start);
  if(sc==='this'){it.ov=it.ov||{};it.ov[m]={name,cat,val,who,card}}
  else if(sc==='next'&&k>0){
    const ni={...it,id:uid(),name,cat,val,who,card,start:m};delete ni.ov;
    if(it.rec)it.end=add(m,-1);else{ni.n=it.n-k;it.n=k}
    if(it.ov)Object.keys(it.ov).forEach(x=>{if(x>=m)delete it.ov[x]});
    Object.keys(S.paid).forEach(x=>{const[i0,mm]=x.split('|');if(i0===it.id&&mm>=m){S.paid[ni.id+'|'+mm]=S.paid[x];delete S.paid[x]}});
    S.items.push(ni);
  }else{Object.assign(it,{name,cat,val,who,card});delete it.ov}
  afterEdit();
};
function afterEdit(msg){
  const snap=ed.snap;save();$('dg').close();render();
  toast(msg||'Gasto atualizado',()=>{applyState(JSON.parse(snap));save();render()});
}
function removeItem(id){
  if(!S.items.some(i=>i.id===id))return;
  withUndo('Gasto excluído',()=>{S.items=S.items.filter(i=>i.id!==id)});
}

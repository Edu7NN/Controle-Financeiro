/* Tela principal: indicador de saúde, indicadores, lista do mês e análise */
function gaugeBg(){
  const t=Math.round(TETO*100),lo=t-20,hi=Math.min(t+15,95);
  return 'linear-gradient(90deg,var(--ok) 0 '+lo+'%,color-mix(in srgb,var(--ok) 55%,var(--wn)) '+lo+'% '+t+'%,var(--wn) '+t+'% '+hi+'%,var(--bd) '+hi+'% 100%)';
}
function render(){
  $('ml').textContent=lab(cur);$('tt').textContent=Math.round(TETO*100);
  const h=health(cur),c='var(--'+(h.lv==='none'?'mu':h.lv)+')',rs=rows(cur);
  const salVal=S.salary[cur]!==undefined?S.salary[cur]:sal(cur);
  $('hero').style.setProperty('--c',c);
  $('hero').innerHTML='<div class="top"><div><p class="verdict">'+h.t+'</p><p>'+h.d+'</p>'+
   '<div class="gauge" style="background:'+gaugeBg()+'"><i style="left:'+Math.min(h.p*100,100)+'%"></i></div><div class="scale" style="position:relative"><span>0%</span><span style="position:absolute;left:'+Math.round(TETO*100)+'%;transform:translateX(-50%)">teto '+Math.round(TETO*100)+'%</span><span>100%</span></div></div>'+
   '<div><label for="sl">Salário em '+lab(cur)+'</label><input id="sl" inputmode="decimal" value="'+(salVal?String(salVal).replace('.',','):'')+'" placeholder="0,00"><p class="empty" style="margin:6px 0 0;font-size:13px">Vale para os meses seguintes até você alterar. Apague o campo para remover este valor.</p></div></div>';
  $('sl').onchange=e=>{const v=parseFloat(e.target.value.replace(/\./g,'').replace(',','.'));if(e.target.value.trim()===''){withUndo('Salário removido',()=>{delete S.salary[cur]});return}if(isNaN(v)||v<0)return;S.salary[cur]=v;save();render()};
  const saldo=h.s-h.g;
  const pg=rs.filter(r=>S.paid[r.id+'|'+cur]).reduce((a,r)=>a+r.val,0),real=h.s-pg;
  const kp=[['Salário',R(h.s)],['Gastos do mês',R(h.g)],['Saldo previsto',R(saldo),h.s?(saldo<0?'bd':'ok'):''],['Já pago',R(pg)],['Falta pagar',R(h.g-pg)],['Saldo real na conta',R(real),h.s?(real<0?'bd':'ok'):'']];
  $('kpis').innerHTML=kp.map(k=>'<div class="card"><small>'+k[0]+'</small><strong'+(k[2]?' style="color:var(--'+k[2]+')"':'')+'>'+k[1]+'</strong></div>').join('');
  $('list').innerHTML=rs.length?rs.sort((a,b)=>b.val-a.val).map(r=>'<div class="row'+(S.paid[r.id+'|'+cur]?' pd':'')+'"><input type="checkbox" class="ck" aria-label="Pago: '+esc(r.name)+'" title="Marcar como pago" data-p="'+r.id+'"'+(S.paid[r.id+'|'+cur]?' checked':'')+'><div>'+esc(r.name)+'<small>'+esc(r.cat)+'</small></div>'+(r.rec?'<span class="pill">↻ mensal</span>':r.n>1?'<span class="pill">'+r.k+'/'+r.n+'</span>':'<span></span>')+'<strong>'+R(r.val)+'</strong><button title="Editar" aria-label="Editar '+esc(r.name)+'" data-e="'+r.id+'">✎</button><button title="'+(r.rec?'Excluir tudo, inclusive o histórico (para manter o histórico, use Editar e Encerrar recorrência)':r.n>1?'Excluir a compra inteira (todas as parcelas)':'Excluir')+'" aria-label="Excluir '+esc(r.name)+'" data-id="'+r.id+'">✕</button></div>').join(''):'<p class="empty">Nenhum gasto em '+lab(cur)+'. Adicione o primeiro ao lado.</p>';
  document.querySelectorAll('#list [data-id]').forEach(b=>b.onclick=()=>{removeItem(b.dataset.id)});
  document.querySelectorAll('#list [data-e]').forEach(b=>b.onclick=()=>openEd(b.dataset.e));
  document.querySelectorAll('#list [data-p]').forEach(b=>b.onchange=()=>{const k=b.dataset.p+'|'+cur;if(b.checked)S.paid[k]=true;else delete S.paid[k];save();render()});
  insights(h,rs);charts(h,rs);sim();
}

function insights(h,rs){
  const L=[];
  if(!rs.length){$('ins').innerHTML='<li class="empty" style="list-style:none">Adicione gastos para ver a análise.</li>';return}
  const by={};rs.forEach(r=>by[r.cat]=(by[r.cat]||0)+r.val);
  const top=Object.entries(by).sort((a,b)=>b[1]-a[1])[0];
  L.push('Maior peso: <b>'+esc(top[0])+'</b>, com '+R(top[1])+' ('+Math.round(top[1]/h.g*100)+'% dos gastos).');
  const pr=parc(cur);
  if(pr>0)L.push('Parcelas somam '+R(pr)+'; são '+Math.round(pr/h.g*100)+'% dos gastos'+(h.s?' e '+Math.round(pr/h.s*100)+'% do salário.':'.'));
  const fx=rs.filter(r=>r.rec).reduce((a,r)=>a+r.val,0);
  if(fx>0)L.push('Gastos fixos recorrentes: '+R(fx)+(h.s?' ('+Math.round(fx/h.s*100)+'% do salário), valor que se repete todo mês.':', valor que se repete todo mês.'));
  const pm=tot(add(cur,-1));
  if(pm>0){const d=h.g-pm;L.push('Frente a '+lab(add(cur,-1))+': '+(d>=0?'alta':'queda')+' de '+R(Math.abs(d))+' ('+Math.round(Math.abs(d)/pm*100)+'%).')}
  if(h.s){
    const fut=[1,2,3].map(k=>parc(add(cur,k)));const mx=Math.max(...fut);
    const worst=[1,2,3].find(k=>parc(add(cur,k))===mx);
    if(mx>0)L.push('Compromisso futuro: nos próximos 3 meses as parcelas chegam a '+R(mx)+' ('+Math.round(mx/h.s*100)+'% do salário em '+lab(add(cur,worst))+').'+(mx/h.s>.4?' <b style="color:var(--bd)">Acima de 40%: evite novas parcelas.</b>':''));
    if(h.g/h.s<=TETO)L.push('Se guardar a margem de '+R(h.marg)+', o mês fecha com folga para a reserva de emergência.');
  }
  const end=rs.filter(r=>r.n>1&&r.k===r.n);
  if(end.length)L.push('Última parcela neste mês: '+end.map(r=>esc(r.name)).join(', ')+'. Libera '+R(end.reduce((a,r)=>a+r.val,0))+' por mês depois.');
  $('ins').innerHTML=L.map(x=>'<li>'+x+'</li>').join('');
}

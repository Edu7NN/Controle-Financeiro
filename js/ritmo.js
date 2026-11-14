/* Ritmo do mês: gastos acumulados por dia contra o ritmo ideal, com pago x pendente */

/**
 * Calcula as séries do ritmo para um mês. Só entram nas linhas os gastos meus com dia informado;
 * os sem dia contam no total gasto, mas não aparecem na linha.
 * @param {string} m mês "AAAA-MM"
 */
function paceData(m){
  const dim=daysIn(m),tk=todayKey(),s=sal(m),budget=s*TETO,rs=myRows(m);
  const state=num(m)<num(tk)?'past':m===tk?'now':'future';
  const day=state==='past'?dim:state==='now'?new Date().getDate():0;
  const dd=r=>Math.min(r.day,dim),isDated=r=>r.day>=1,paid=r=>!!S.paid[r.id+'|'+m];
  const dated=rs.filter(isDated),undated=rs.filter(r=>!isDated(r));
  const cum=(list)=>Array.from({length:dim},(_,i)=>sumV(list.filter(r=>dd(r)<=i+1)));
  return{m,dim,state,day,s,budget,total:sumV(rs),paid:sumV(rs.filter(paid)),
    spent:state==='future'?0:sumV(undated)+sumV(dated.filter(r=>dd(r)<=day)),
    undated:sumV(undated),undatedN:undated.length,
    all:cum(dated),paidSeries:cum(dated.filter(paid)),
    ideal:budget>0?Array.from({length:dim},(_,i)=>budget*(i+1)/dim):[]};
}

function renderRitmo(){
  const d=paceData(cur),box=$('pace'),pct=v=>Math.round(v*100)+'%';
  if(ch.p){ch.p.destroy();delete ch.p}
  $('pacecv').hidden=!d.total;
  if(!d.total){box.innerHTML='<p class="empty">Sem gastos em '+lab(cur)+' para mostrar o ritmo.</p>';$('pacenote').textContent='';return}
  let head;
  if(!d.budget)head='Cadastre a receita para comparar com o ritmo ideal. Gastos lançados: <b>'+R(d.total)+'</b>.';
  else if(d.state==='future')head='O mês ainda não começou: <b>'+R(d.total)+'</b> já lançados ('+pct(d.total/d.budget)+' do orçamento de '+R(d.budget)+').';
  else{
    const used=d.spent/d.budget,ideal=d.day/d.dim,st=used>ideal+.1?['up','Acima do ritmo']:used<ideal-.1?['dn','Abaixo do ritmo']:['ok','Dentro do ritmo'];
    head='Você já gastou <b>'+pct(used)+'</b> do orçamento ('+R(d.spent)+' de '+R(d.budget)+') '+(d.state==='now'?'e estamos no dia <b>'+d.day+'</b> de '+d.dim:'e o mês terminou')+
      '. O ritmo ideal seria '+pct(ideal)+'. <span class="pace-st '+st[0]+'">'+st[1]+'</span>.';
  }
  box.innerHTML='<p class="pace-sum">'+head+'</p><p class="pace-sum">Pago <b>'+R(d.paid)+'</b> · Pendente <b>'+R(d.total-d.paid)+'</b></p>';
  $('pacenote').textContent=(d.budget?'Orçamento = teto de '+Math.round(TETO*100)+'% da receita. ':'')+
    (d.undatedN?d.undatedN+(d.undatedN===1?' gasto sem dia ':' gastos sem dia ')+'('+R(d.undated)+') não aparece na linha: informe o dia em ✎.':'');
  if(!window.Chart||!$('mg').open)return;
  const ink=cssv('--ink'),mu=cssv('--mu'),ln=cssv('--ln'),wn=cssv('--wn');
  Chart.defaults.color=mu;Chart.defaults.font.family='Manrope,system-ui,sans-serif';
  ch.p=new Chart($('c4'),{type:'line',data:{labels:Array.from({length:d.dim},(_,i)=>i+1),datasets:[
    {label:'Gastos acumulados',data:d.all,borderColor:cssv('--ac'),backgroundColor:cssv('--ac'),stepped:true,pointRadius:0,borderWidth:2.5},
    {label:'Pagos acumulados',data:d.paidSeries,borderColor:'#3B7DD8',backgroundColor:'#3B7DD8',stepped:true,pointRadius:0,borderWidth:2},
    ...(d.ideal.length?[{label:'Ritmo ideal',data:d.ideal,borderColor:wn,borderDash:[6,5],pointRadius:0,borderWidth:2}]:[])]},
    options:{maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
      scales:{x:{grid:{display:false},ticks:{maxTicksLimit:8}},y:{beginAtZero:true,grid:{color:ln},ticks:{callback:v=>PRIV?'':R(v).replace(',00','')}}},
      plugins:{legend:{labels:{color:ink,boxWidth:12}},tooltip:{callbacks:{title:it=>'Dia '+it[0].label,label:c=>' '+c.dataset.label+': '+R(c.raw)}}}},
    plugins:[{id:'today',afterDatasetsDraw(chart){
      if(d.state!=='now')return;
      const {ctx,chartArea:a,scales:{x}}=chart,px=x.getPixelForValue(d.day-1);
      ctx.save();ctx.strokeStyle=mu;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(px,a.top);ctx.lineTo(px,a.bottom);ctx.stroke();ctx.restore();
    }}]});
}

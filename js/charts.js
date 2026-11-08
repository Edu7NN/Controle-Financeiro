/* Gráficos por categoria e mês a mês (Chart.js) */
function charts(h,rs){
  if(!window.Chart)return;
  const ink=cssv('--ink'),mu=cssv('--mu'),ln=cssv('--ln');
  Chart.defaults.color=mu;Chart.defaults.font.family='Manrope,system-ui,sans-serif';
  Object.values(ch).forEach(c=>c.destroy());
  const by={};rs.forEach(r=>by[r.cat]=(by[r.cat]||0)+r.val);
  const ks=CATS.filter(c=>by[c]);
  ch.a=new Chart($('c1'),{type:'doughnut',data:{labels:ks,datasets:[{data:ks.map(k=>by[k]),backgroundColor:ks.map(k=>COL[CATS.indexOf(k)%COL.length]),borderColor:cssv('--sf'),borderWidth:2}]},
   options:{maintainAspectRatio:false,cutout:'58%',plugins:{legend:{position:'right',labels:{color:ink,boxWidth:12}},tooltip:{callbacks:{label:c=>' '+c.label+': '+R(c.raw)+' ('+Math.round(c.raw/h.g*100)+'%)'}}}}});
  const ms=Array.from({length:12},(_,i)=>add(cur,i-1));
  const cl={ok:cssv('--ok'),wn:cssv('--wn'),bd:cssv('--bd')};
  ch.b=new Chart($('c2'),{data:{labels:ms.map(sh),datasets:[
   {type:'bar',label:'Gastos',data:ms.map(tot),backgroundColor:ms.map(m=>{const s=sal(m);return s?cl[level(tot(m)/s)]:mu}),borderRadius:4,order:2},
   {type:'line',label:'Salário',data:ms.map(sal),borderColor:ink,backgroundColor:ink,pointRadius:2,tension:0,order:1},
   {type:'line',label:'Teto saudável ('+Math.round(TETO*100)+'%)',data:ms.map(m=>sal(m)*TETO),borderColor:cl.wn,borderDash:[6,5],pointRadius:0,order:1}]},
   options:{maintainAspectRatio:false,scales:{x:{grid:{display:false}},y:{beginAtZero:true,grid:{color:ln},ticks:{callback:v=>R(v).replace(',00','')}}},
   plugins:{legend:{labels:{color:ink,boxWidth:12}},tooltip:{callbacks:{label:c=>' '+c.dataset.label+': '+R(c.raw)}}}}});
}

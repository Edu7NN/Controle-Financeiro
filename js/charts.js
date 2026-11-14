/* Projeção dos próximos 12 meses (Chart.js): fixos, parcelas e avulsos já lançados, com meses acima do teto em destaque */
function charts(h,rs){
  const ms=forwardWin();
  $('projt').textContent=PERIOD==='1'?'Projeção dos próximos 12 meses':PERIOD==='ano'?'Ano '+cur.slice(0,4)+', mês a mês':'Próximos '+PERIOD+' meses';
  const crit=ms.map(m=>sal(m)>0&&tot(m)>TETO*sal(m));
  const bad=ms.map((m,i)=>crit[i]?sh(m)+' ('+Math.round(tot(m)/sal(m)*100)+'%)':null).filter(Boolean);
  $('projmsg').innerHTML=!ms.some(m=>sal(m)>0)?'Cadastre o salário ou uma receita para ver os meses críticos.':
    bad.length?'<span style="color:var(--bd)">⚠ Meses acima do teto: <b>'+bad.join(', ')+'</b></span>':
    '<span style="color:var(--ok)">Nenhum dos meses exibidos passa do teto com o que já está lançado.</span>';
  if(!window.Chart||!$('mg').open)return;
  const ink=cssv('--ink'),mu=cssv('--mu'),ln=cssv('--ln'),bd=cssv('--bd'),wn=cssv('--wn');
  Chart.defaults.color=mu;Chart.defaults.font.family='Manrope,system-ui,sans-serif';
  Object.keys(ch).forEach(k=>{ch[k].destroy();delete ch[k]});
  const part=(m,f)=>sumV(myRows(m).filter(f));
  ch.b=new Chart($('c2'),{data:{labels:ms.map((m,i)=>{const n=MN[+m.slice(5)-1].slice(0,3).toLowerCase();return (i===0||m.slice(5)==='01')?[n,m.slice(2,4)]:n}),datasets:[
    {type:'bar',label:'Fixos',data:ms.map(m=>part(m,r=>r.rec)),backgroundColor:cssv('--ac'),stack:'g'},
    {type:'bar',label:'Parcelas',data:ms.map(m=>part(m,r=>!r.rec&&r.n>1)),backgroundColor:'#3B7DD8',stack:'g'},
    {type:'bar',label:'Avulsos já lançados',data:ms.map(m=>part(m,r=>!r.rec&&r.n===1)),backgroundColor:'#E0A526',stack:'g'},
    {type:'line',label:'Receita',data:ms.map(sal),borderColor:ink,pointRadius:0,stack:'s'},
    {type:'line',label:'Teto ('+Math.round(TETO*100)+'%)',data:ms.map(m=>sal(m)*TETO),borderColor:wn,borderDash:[6,5],pointRadius:0,stack:'t'}]},
    options:{maintainAspectRatio:false,
      scales:{x:{stacked:true,grid:{display:false},ticks:{autoSkip:false,maxRotation:0,color:c=>crit[c.index]?bd:mu,font:c=>({size:11,weight:crit[c.index]?'700':'400'})}},
              y:{stacked:true,beginAtZero:true,grid:{color:ln},ticks:{callback:v=>PRIV?'':R(v).replace(',00','')}}},
      plugins:{legend:{labels:{color:ink,boxWidth:12}},
        tooltip:{callbacks:{label:c=>' '+c.dataset.label+': '+R(c.raw),footer:it=>{const m=ms[it[0].dataIndex],s=sal(m);return 'Total '+R(tot(m))+(s?' · '+Math.round(tot(m)/s*100)+'% da receita':'')}}}}},
    plugins:[{id:'crit',beforeDatasetsDraw(chart){
      const {ctx,chartArea:a,scales:{x}}=chart,w=x.getPixelForValue(1)-x.getPixelForValue(0);
      ctx.save();ctx.fillStyle='rgba(214,72,59,.16)';
      crit.forEach((c,i)=>{if(c)ctx.fillRect(x.getPixelForValue(i)-w/2,a.top,w,a.bottom-a.top)});
      ctx.restore();
    }}]});
}

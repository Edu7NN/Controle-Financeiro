/* Simulador "E se eu comprar?" */
let simCh=null;
function sim(){
  const o=$('sr'),tv=parseFloat(($('sv').value||'').replace(/\./g,'').replace(',','.')),n=Math.max(1,Math.min(72,parseInt($('sn').value)||1)),st=$('ss').value||cur;
  if(simCh){simCh.destroy();simCh=null}
  if(isNaN(tv)||tv<=0){o.innerHTML='<p class="empty" style="margin:0">Digite o valor da compra para ver o impacto nos próximos 12 meses.</p>';return}
  if(!sal(st)){o.innerHTML='<p class="empty" style="margin:0">Cadastre seu salário (ou uma receita) para avaliar se a compra cabe no orçamento.</p>';return}
  const total=$('sk').value==='t'?tv:tv*n,val=Math.round(total/n*100)/100;
  const cost=m=>{const d=num(m)-num(st);return d>=0&&d<n?val:0};
  const fits=(s0,k)=>{const v=total/k;for(let i=0;i<k;i++){const m=add(s0,i),s=sal(m);if(!s||tot(m)+v>TETO*s)return false}return true};
  const aff=Array.from({length:n},(_,i)=>add(st,i)).filter(m=>sal(m)>0);
  const ratio=m=>(tot(m)+cost(m))/sal(m);
  const over=aff.filter(m=>ratio(m)>TETO),peak=aff.reduce((a,m)=>ratio(m)>ratio(a)?m:a,aff[0]);
  const ok=!over.length,pk=Math.round(ratio(peak)*100),lv=ok?(pk>TETO*100-10?'wn':'ok'):'bd';
  const title=ok?(pk>TETO*100-10?'Pode comprar, mas apertado':'Pode comprar'):'Melhor não parcelar assim';
  const detail=ok?'Nenhum mês passa do teto de '+Math.round(TETO*100)+'%. O pior mês, '+lab(peak)+', fica em '+pk+'% da receita.':over.length+(over.length>1?' meses passam':' mês passa')+' do teto de '+Math.round(TETO*100)+'%, com pico de '+pk+'% em '+lab(peak)+'.';
  const L=[];
  if(!ok){
    let n2=0;for(let k=1;k<=24;k++)if(fits(st,k)){n2=k;break}
    let w=-1;for(let s=0;s<=12;s++)if(fits(add(st,s),n)){w=s;break}
    L.push(n2?'Parcelando em <b>'+n2+'×</b> de '+R(total/n2)+', nenhum mês passa do teto.':'Nem em 24× a compra cabe no teto. Reduza o valor ou junte parte do dinheiro antes.');
    L.push(w>0?'Esperando até <b>'+lab(add(st,w))+'</b>, a compra em '+n+'× cabe no teto, porque parcelas atuais terminam e liberam renda.':'Esperar não resolve nos próximos 12 meses com os compromissos atuais.');
  }
  if(n>1){const av=(tot(st)+total)/sal(st);L.push('À vista em '+lab(st)+': o mês iria a '+Math.round(av*100)+'% da receita'+(av<=TETO?', ainda dentro do teto.':', acima do teto.'));L.push('Se houver juros, o total pago passa do preço à vista: compare antes de parcelar.')}
  o.innerHTML='<p class="verdict" style="--c:var(--'+lv+');font-size:22px">'+title+'</p><p style="margin:0 0 4px">'+detail+'</p><p class="empty" style="padding:0 0 8px">Impacto: +'+R(val)+' por mês durante '+n+(n>1?' meses':' mês')+' (total '+R(total)+').</p><ul>'+L.map(x=>'<li>'+x+'</li>').join('')+'</ul><button class="s" id="sg" style="margin-top:8px">Levar para novo gasto</button>';
  $('sg').onclick=()=>{openQ({vl:String(val).replace('.',','),np:n,tp:'p',st:st})};
  if(!window.Chart||!$('mt').open)return;
  const ms=Array.from({length:12},(_,i)=>add(cur,i)),mu=cssv('--mu'),ink=cssv('--ink'),ln=cssv('--ln');
  Chart.defaults.color=mu;Chart.defaults.font.family='Manrope,system-ui,sans-serif';
  simCh=new Chart($('c3'),{data:{labels:ms.map(sh),datasets:[
   {type:'bar',label:'Gastos já registrados',data:ms.map(tot),backgroundColor:mu,stack:'g'},
   {type:'bar',label:'Nova compra',data:ms.map(cost),backgroundColor:cssv('--ac'),stack:'g'},
   {type:'line',label:'Teto saudável ('+Math.round(TETO*100)+'%)',data:ms.map(m=>sal(m)*TETO),borderColor:cssv('--wn'),borderDash:[6,5],pointRadius:0,stack:'t'},
   {type:'line',label:'Receita',data:ms.map(sal),borderColor:ink,pointRadius:0,stack:'s'}]},
   options:{maintainAspectRatio:false,scales:{x:{stacked:true,grid:{display:false}},y:{stacked:true,beginAtZero:true,grid:{color:ln},ticks:{callback:v=>PRIV?'':R(v).replace(',00','')}}},
   plugins:{legend:{labels:{color:ink,boxWidth:12}},tooltip:{callbacks:{label:c=>' '+c.dataset.label+': '+R(c.raw)}}}}});
}
['sv','sk','sn','ss'].forEach(id=>{$(id).oninput=sim;$(id).onchange=sim});
$('ss').value=cur;

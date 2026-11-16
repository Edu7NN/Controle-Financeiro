/* Diagnóstico: métricas, projeção realista, metas e alertas calculados no aparelho (sem IA).
   Todos os números saem daqui; qualquer texto de IA futuro deve apenas explicar estes fatos. */
let ALERTS=[];
const LV_W={bad:0,warn:1,info:2};
const monthsIn=(a,b)=>num(b)-num(a)+1;

/** Meus gastos do mês divididos em fixos (recorrentes), parcelas e avulsos, e o que é essencial. */
function monthMetrics(m){
  const rs=myRows(m),ess=new Set(prof().essential);
  const fx=sumV(rs.filter(r=>r.rec)),pc=sumV(rs.filter(r=>!r.rec&&r.n>1)),av=sumV(rs.filter(r=>!r.rec&&r.n===1));
  return{m,s:sal(m),fx,pc,av,trav:fx+pc,g:fx+pc+av,ess:sumV(rs.filter(r=>ess.has(r.cat)))};
}
/** Os 3 últimos meses (até o mês de hoje) que têm gastos lançados. */
const recentMonths=()=>[0,1,2].map(i=>add(todayKey(),-i)).filter(m=>tot(m)>0);
const mean=l=>l.length?l.reduce((a,b)=>a+b,0)/l.length:0;
const avgAvulso=()=>mean(recentMonths().map(m=>monthMetrics(m).av));
/** Gasto esperado: o realizado até o mês de hoje; depois fixos + parcelas + avulsos típicos. */
function projSpend(m){
  if(num(m)<=num(todayKey()))return tot(m);
  const x=monthMetrics(m);return x.trav+Math.max(x.av,avgAvulso());
}
const capacity=m=>Math.max(0,sal(m)-projSpend(m));
const avgCapacity=n=>mean(Array.from({length:n},(_,i)=>capacity(add(todayKey(),i))));
/** Custo essencial mensal: média dos meses recentes (todas as linhas de categorias essenciais). */
function essCost(){
  const ms=recentMonths();
  return ms.length?mean(ms.map(m=>monthMetrics(m).ess)):monthMetrics(cur).ess;
}
function reserveInfo(){
  const P=prof(),cost=essCost(),target=cost*P.rules.reserve;
  return{reserve:P.reserve,cost,target,cover:cost>0?P.reserve/cost:0,gap:Math.max(0,target-P.reserve)};
}
/** Plano de uma meta: quanto precisa por mês, quanto sobra em média e se cabe no prazo. */
function goalPlan(g){
  const t=todayKey(),left=Math.max(0,g.target-(g.saved||0));
  if(left<=0)return{st:'done',left:0};
  const n=g.deadline?monthsIn(t,g.deadline):0;
  if(g.deadline&&n<=0)return{st:'late',left};
  const avg=g.deadline?avgCapacity(n):avgCapacity(6),eta=avg>0?add(t,Math.ceil(left/avg)-1):null;
  if(!g.deadline)return{st:'open',left,avg,eta};
  const need=left/n,ratio=avg>0?need/avg:Infinity;
  return{st:ratio<=.6?'ok':ratio<=1?'tight':'no',left,n,need,avg,ratio,eta};
}
const dueDays=(due,m)=>{
  const [y,mo]=m.split('-').map(Number),d=new Date(y,mo-1,Math.min(due,new Date(y,mo,0).getDate())),t=new Date();
  t.setHours(0,0,0,0);return Math.round((d-t)/864e5);
};

/** Painel de saúde: cinco indicadores com semáforo, contra as regras do perfil. */
function panel(){
  const x=monthMetrics(cur),P=prof(),r=P.rules,s=x.s,ri=reserveInfo();
  const lv=(v,okMax,warnMax)=>v<=okMax?'ok':v<=warnMax?'warn':'bad';
  const pct=v=>Math.round(v)+'%';
  if(!s)return[{k:'receita',label:'Receita do mês',val:'—',rule:'cadastre o salário',lv:'none'}];
  const g=x.g/s*100,pc=x.pc/s*100,tv=x.trav/s*100,po=(s-x.g)/s*100,minPo=(1-TETO)*100;
  return[
    {k:'gastos',label:'Gastos / receita',val:pct(g),rule:'teto '+Math.round(TETO*100)+'%',lv:lv(g,TETO*100,TETO*100+15)},
    {k:'parc',label:'Parcelas / receita',val:pct(pc),rule:'sua regra: até '+r.parc+'%',lv:lv(pc,r.parc,r.parc*1.25)},
    {k:'trav',label:'Fixos + parcelas',val:pct(tv),rule:'sua regra: até '+r.trav+'%',lv:lv(tv,r.trav,r.trav*1.2)},
    {k:'poup',label:'Poupança do mês',val:pct(po),rule:'mínimo '+Math.round(minPo)+'%',lv:po>=minPo?'ok':po>=minPo/2?'warn':'bad'},
    P.reserve&&ri.cost>0?{k:'res',label:'Reserva',val:ri.cover.toFixed(1).replace('.',',')+' meses',rule:'alvo '+r.reserve+' meses',lv:ri.cover>=r.reserve?'ok':ri.cover>=3?'warn':'bad'}
      :{k:'res',label:'Reserva',val:'—',rule:'informe em Opções > Perfil',lv:'none'}
  ];
}

/** Lista de alertas ordenada por gravidade e impacto. Só fatos calculados; nada de opinião genérica. */
function diagnose(){
  const out=[],P=prof(),r=P.rules,tk=todayKey(),s=sal(cur),x=monthMetrics(cur);
  const push=(lv,k,t,xx,imp,act)=>out.push({lv,k,t,x:xx,imp:imp||0,act});
  if(!s&&!S.items.length)return[{lv:'info',k:'vazio',t:'Comece pela receita e pelos primeiros gastos',x:'Com os dados lançados, o sistema calcula alertas, metas e projeções.',imp:0}];
  if(!s)push('bad','sem-receita','Receita não cadastrada','Sem a receita não dá para medir nada. Informe o salário em Início > Detalhes e receitas.',1e9);

  if(s>0){
    const pp=x.pc/s*100,tv=x.trav/s*100;
    if(pp>r.parc)push(pp>r.parc*1.25?'bad':'warn','parc','Parcelas pesam '+Math.round(pp)+'% da receita','Sua regra é até '+r.parc+'%: estão '+R(x.pc-s*r.parc/100)+' acima. Evite novas parcelas até as atuais terminarem.',x.pc-s*r.parc/100);
    if(tv>r.trav)push(tv>r.trav*1.2?'bad':'warn','trav','Fixos e parcelas travam '+Math.round(tv)+'% da receita','Sua regra é até '+r.trav+'%. Sobra pouca margem para imprevistos.',x.trav-s*r.trav/100);
  }
  /* meses críticos, com a projeção realista (avulsos típicos) */
  const crit=Array.from({length:12},(_,i)=>add(tk,i)).filter(m=>sal(m)>0&&projSpend(m)>TETO*sal(m));
  if(crit.length){
    const m0=crit[0],xm=monthMetrics(m0),soon=num(m0)-num(tk)<=2;
    push(soon?'bad':'warn','criticos',crit.length===1?'1 mês projetado acima do teto':crit.length+' meses projetados acima do teto','O primeiro é '+sh(m0)+' ('+Math.round(projSpend(m0)/sal(m0)*100)+'% da receita, com seus avulsos típicos). Fixos e parcelas já somam '+R(xm.trav)+' nesse mês.',projSpend(m0)-TETO*sal(m0));
  }
  /* dinheiro que será liberado quando parcelas terminam */
  for(let i=0;i<12;i++){
    const m=add(tk,i),fin=myRows(m).filter(q=>!q.rec&&q.n>1&&q.k===q.n);
    if(fin.length){
      const names=fin.slice(0,2).map(q=>esc(q.name)).join(' e ')+(fin.length>2?' e mais '+(fin.length-2):'');
      push('info','libera','Em '+sh(m)+' você libera '+R(sumV(fin))+' por mês','Terminam: '+names+'. Defina agora o destino desse valor (reserva ou meta) para ele não ser absorvido pelo gasto do dia a dia.',sumV(fin),{label:'Ver metas',go:'op'});
      break;
    }
  }
  /* reserva de emergência */
  const ri=reserveInfo();
  if(ri.cost>0){
    const cv=ri.cover;
    if(!P.reserve)push('warn','reserva','Reserva de emergência não informada','Seu custo essencial é cerca de '+R(ri.cost)+' por mês; o alvo de '+r.reserve+' meses é '+R(ri.target)+'. Informe quanto você já tem.',ri.target,{label:'Informar reserva',go:'op'});
    else if(cv<r.reserve){
      const av6=avgCapacity(6);
      push(cv<1?'bad':cv<3?'warn':'info','reserva','Reserva cobre '+cv.toFixed(1).replace('.',',')+' meses do custo essencial','Alvo: '+r.reserve+' meses ('+R(ri.target)+'). Faltam '+R(ri.gap)+(av6>0?'; com a sua sobra média levaria cerca de '+Math.ceil(ri.gap/av6)+' meses.':'.')+(cv<3&&S.goals.length?' Antes das metas, complete 3 meses de reserva.':''),ri.gap,{label:'Ver perfil',go:'op'});
    }
  }
  /* metas */
  let sumNeed=0,withDl=0;
  S.goals.forEach(g=>{
    const p=goalPlan(g),nm='“'+esc(g.name)+'”';
    if(p.st==='late')push('bad','meta-'+g.id,'Meta '+nm+' passou do prazo','Faltam '+R(p.left)+'. Ajuste o prazo ou o valor.',p.left,{label:'Ver metas',go:'op'});
    else if(p.st==='no'||p.st==='tight'){
      push(p.st==='no'?'warn':'info','meta-'+g.id,'Meta '+nm+(p.st==='no'?' não cabe no prazo':' está apertada'),'Precisa de '+R(p.need)+' por mês e a sua sobra média projetada é '+R(p.avg)+'.'+(p.st==='no'&&p.eta?' No ritmo atual você chega em '+sh(p.eta)+'.':''),p.need,{label:'Ver metas',go:'op'});
    }
    if(p.need){sumNeed+=p.need;withDl++}
  });
  if(withDl>1){const a=avgCapacity(6);if(sumNeed>a)push('warn','metas','As metas somam '+R(sumNeed)+' por mês','A sua sobra média projetada é '+R(a)+'. Priorize: reserva primeiro, depois a meta de menor prazo.',sumNeed-a,{label:'Ver metas',go:'op'})}
  /* dinheiro de outras pessoas que passa pelo seu caixa */
  const per={};
  monthsRange().forEach(m=>rows(m).filter(q=>q.who).forEach(q=>{
    const o=per[q.who]||(per[q.who]={open:0,late:0,fut:0,last:m,n:0});
    if(num(m)<=num(tk)){if(!S.paid[q.id+'|'+m]){o.open+=q.val;o.n++;if(num(m)<num(tk))o.late+=q.val}}
    else{o.fut+=q.val;if(num(m)>num(o.last))o.last=m}
  }));
  Object.entries(per).filter(([,o])=>o.open+o.fut>0).sort((a,b)=>b[1].open+b[1].fut-a[1].open-a[1].fut).slice(0,2).forEach(([n,o])=>{
    push(o.late>0?'warn':'info','terc-'+n,o.open>0?'Você adianta '+R(o.open)+' para '+esc(n):'Você ainda vai pagar '+R(o.fut)+' por '+esc(n),
      (o.open>0?o.n+(o.n===1?' lançamento sem reembolso':' lançamentos sem reembolso')+(o.late>0?', parte de meses anteriores':'')+'. ':'')+(o.fut>0?'Ainda vai pagar '+R(o.fut)+' por '+esc(n)+' até '+sh(o.last)+'. ':'')+'Cobre antes do vencimento da fatura para não faltar caixa.',o.open+o.fut,{label:'Ver lançamentos',run:()=>{F.q='';F.cat='';F.who=n;F.st='';VIEW='l';showTab('gs')}});
  });
  /* categoria fora do seu padrão (só gastos avulsos) */
  const prevM=[1,2,3].map(i=>add(cur,-i)).filter(m=>tot(m)>0);
  if(prevM.length&&s>0){
    const catAv=m=>{const o={};myRows(m).filter(q=>!q.rec&&q.n===1).forEach(q=>o[q.cat]=(o[q.cat]||0)+q.val);return o},now=catAv(cur),prev=prevM.map(catAv);
    Object.keys(now).map(c=>({c,v:now[c],b:mean(prev.map(p=>p[c]||0))})).filter(z=>z.b>0&&z.v>=z.b*1.3&&z.v-z.b>=Math.max(50,s*.02)).sort((a,b)=>(b.v-b.b)-(a.v-a.b)).slice(0,2).forEach(z=>{
      push('warn','cat-'+z.c,esc(z.c)+' acima do seu padrão',R(z.v)+' neste mês contra média de '+R(z.b)+' nos meses anteriores (+'+Math.round((z.v/z.b-1)*100)+'%), só em gastos avulsos.',z.v-z.b,{label:'Ver gastos',run:()=>{F.q='';F.who='';F.st='';F.cat=z.c;VIEW='l';showTab('gs')}});
    });
  }
  /* faturas do mês de hoje */
  (S.cards||[]).filter(c=>c.due).forEach(c=>{
    const mine=myRows(tk).filter(q=>q.card===c.id&&!S.paid[q.id+'|'+tk]);if(!mine.length)return;
    const n=dueDays(c.due,tk),v=sumV(mine);
    if(n<0)push('bad','fat-'+c.id,'Fatura '+esc(c.name)+' vencida há '+(-n)+(n===-1?' dia':' dias'),'Sua parte pendente é '+R(v)+'. Pague e marque como paga em Gastos > Faturas.',v,{label:'Ver faturas',run:()=>{VIEW='f';showTab('gs')}});
    else if(n<=5)push('warn','fat-'+c.id,'Fatura '+esc(c.name)+(n===0?' vence hoje':' vence em '+n+(n===1?' dia':' dias')),'Sua parte pendente é '+R(v)+'.',v,{label:'Ver faturas',run:()=>{VIEW='f';showTab('gs')}});
  });
  /* ritmo do mês corrente */
  if(cur===tk&&s>0){
    const d=paceData(cur);
    if(d.budget>0&&d.spent/d.budget>d.day/d.dim+.1){
      const left=d.dim-d.day,rest=d.budget-d.spent;
      push('warn','ritmo','No dia '+d.day+' você já usou '+Math.round(d.spent/d.budget*100)+'% do orçamento','O ritmo ideal seria '+Math.round(d.day/d.dim*100)+'%. '+(rest<=0?'O orçamento do mês já acabou.':left>0?'Para fechar dentro do teto, o resto do mês comporta '+R(rest/left)+' por dia.':'Resta '+R(rest)+'.'),d.spent-d.budget*d.day/d.dim);
    }
  }
  /* receita extra não recorrente */
  const ex=incRows(cur).filter(i=>!i.rec).reduce((a,i)=>a+i.val,0);
  if(s>0&&ex/s>=.2)push('info','extra','Parte da receita deste mês é extra ('+Math.round(ex/s*100)+'%)','Valores como 13º e bônus não se repetem. Não os trate como renda fixa nos gastos recorrentes e parcelas.',ex);
  /* muitos parcelamentos pequenos */
  const act=myRows(cur).filter(q=>!q.rec&&q.n>1);
  if(s>0&&act.length>=5&&act.filter(q=>q.val<s*.02).length>=3)push('info','frag','Você tem '+act.length+' parcelamentos ativos','Pelo menos 3 são pequenos (abaixo de 2% da receita). Dão trabalho de controle; vale quitar os que tiverem desconto de antecipação (nos sem juros, não há ganho).',0);
  /* higiene: lançamentos antigos sem marcação de pago (só para quem usa o recurso) */
  if(Object.keys(S.paid).length){
    const old=monthsRange().filter(m=>num(m)<num(tk)&&num(m)>=num(add(tk,-6)));
    let n=0,v=0,first=null;
    old.forEach(m=>myRows(m).forEach(q=>{if(!S.paid[q.id+'|'+m]){n++;v+=q.val;if(!first)first=m}}));
    if(n>0)push('info','pend','Há '+n+' lançamentos antigos sem marcação de pago','Marque os que você já pagou (somam '+R(v)+') para o saldo real ficar fiel.',v,{label:'Ver pendentes',run:()=>{cur=first;F.q='';F.cat='';F.who='';F.st='p';VIEW='l';showTab('gs')}});
  }
  return out.sort((a,b)=>LV_W[a.lv]-LV_W[b.lv]||b.imp-a.imp);
}

const muted=a=>(prof().mute[a.k]||'')===todayKey();
function alertHtml(a,i){
  return '<div class="al lv-'+a.lv+'"><div class="alh"><span class="alb"></span><b>'+a.t+'</b></div><p>'+a.x+'</p><div class="ala">'+
    (a.act?'<button class="s sm" data-act="'+i+'">'+a.act.label+'</button>':'')+'<button class="s sm" data-mute="'+esc(a.k)+'">Ocultar neste mês</button></div></div>';
}
function goAlert(a){
  if(a.act.run)return a.act.run();
  showTab(a.act.go);
}
function renderDiag(){
  ALERTS=diagnose().filter(a=>!muted(a));
  const top=ALERTS.filter(a=>a.lv==='bad'||a.lv==='warn').slice(0,2);
  $('attn').hidden=!top.length;
  $('attn').innerHTML=top.map(a=>'<button class="at '+a.lv+'" data-at="1"><span>'+a.t+'</span><i>›</i></button>').join('');
  $('attn').querySelectorAll('[data-at]').forEach(b=>b.onclick=()=>{showTab('an');const e=$('alr-card');if(e&&e.scrollIntoView)try{e.scrollIntoView()}catch(x){}});
  $('pnl').innerHTML=panel().map(p=>'<div class="pr"><span class="dot lv-'+p.lv+'"></span><span>'+p.label+'</span><b>'+p.val+'</b><small>'+p.rule+'</small></div>').join('');
  const L=ALERTS,first=L.slice(0,4),rest=L.slice(4);
  $('alr').innerHTML=L.length?first.map((a,i)=>alertHtml(a,i)).join('')+(rest.length?'<details class="alr-more"><summary>Ver mais '+rest.length+(rest.length===1?' alerta':' alertas')+'</summary>'+rest.map((a,i)=>alertHtml(a,i+4)).join('')+'</details>':''):'<p class="empty">Nenhum alerta: você está dentro das suas regras.</p>';
  $('alr').querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>goAlert(ALERTS[+b.dataset.act]));
  $('alr').querySelectorAll('[data-mute]').forEach(b=>b.onclick=()=>editProfile(pf=>{pf.mute={...(pf.mute||{}),[b.dataset.mute]:todayKey()}}));
}

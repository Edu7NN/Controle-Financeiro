/* Memória de decisões: o que você marcou como feito, adiou ou descartou nos alertas.
   O sistema deixa de repetir o que você descartou; decisionSummary() é o contrato para uma IA futura. */
const DECISION_KIND={done:'Já fiz',snooze:'Adiado',never:'Não serve para mim'};
const DECISION_DAYS={snooze:14,done:45};
const dayStr=d=>d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());
const dayKey=()=>dayStr(new Date());
const addDays=n=>{const d=new Date();return dayStr(new Date(d.getFullYear(),d.getMonth(),d.getDate()+n))};

/** Última decisão registrada para a chave de um alerta (ou null). */
const decisionOf=k=>[...S.decisions].reverse().find(d=>d.k===k)||null;
/** O alerta está oculto por decisão do usuário? ("done" e "snooze" expiram; "never" não.) */
function hiddenByDecision(k){
  if((prof().mute[k]||'')===todayKey())return true; /* ocultar do mês */
  const d=decisionOf(k);
  if(!d||d.kind==='reset')return false;
  if(d.kind==='never')return true;
  return dayKey()<d.until;
}
function decide(a,kind){
  const rec={id:uid(),k:a.k,t:plain(a.t),kind,at:dayKey(),...(DECISION_DAYS[kind]?{until:addDays(DECISION_DAYS[kind])}:{})};
  withUndo(kind==='done'?'Anotado: já fiz':kind==='snooze'?'Adiado por '+DECISION_DAYS.snooze+' dias':'Não vou mostrar de novo',()=>{S.decisions.push(rec)});
}
function decisionSummary(){
  const latest={};S.decisions.forEach(d=>{latest[d.k]=d});
  const L=Object.values(latest),P=prof(),by=k=>L.filter(d=>d.kind===k).map(d=>({k:d.k,t:d.t,at:d.at}));
  return{focus:P.focus,income:P.income,levels:P.levels,rules:P.rules,never:by('never'),done:by('done'),
    snoozed:L.filter(d=>d.kind==='snooze'&&dayKey()<d.until).map(d=>({k:d.k,t:d.t,until:d.until}))};
}
function decisionsHtml(){
  const latest={};S.decisions.forEach(d=>{latest[d.k]=d});
  const L=Object.values(latest).filter(d=>d.kind!=='reset').sort((a,b)=>a.at<b.at?1:-1);
  return '<p class="empty" style="margin:0 0 8px">O que você marcou nos alertas. O sistema deixa de repetir o que você descartou.</p>'+
    (L.length?L.map(d=>'<div class="cr ic"><span>'+esc(d.t)+'<small class="blk">'+DECISION_KIND[d.kind]+' em '+brDate(d.at)+(d.until?' · até '+brDate(d.until):'')+'</small></span><span></span><button class="s" data-dre="'+esc(d.k)+'">Reativar</button></div>').join(''):'<p class="empty">Nenhuma decisão ainda.</p>');
}
function decisionsBind(){
  $('cfgc').querySelectorAll('[data-dre]').forEach(b=>b.onclick=()=>{
    S.decisions.push({id:uid(),k:b.dataset.dre,t:'',kind:'reset',at:dayKey()});save();render();openCfg();
  });
}

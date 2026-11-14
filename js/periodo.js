/* Período das análises (mês, 3, 6, 12 meses ou ano), janelas de meses e destaques em frases curtas */
const PERIOD_LABEL={1:'Mês',3:'3 meses',6:'6 meses',12:'12 meses',ano:'Ano'};
let PERIOD='1';
try{const p=localStorage.getItem('fin_period');if(p&&PERIOD_LABEL[p])PERIOD=p}catch(e){}

/** Meses do período, a partir do mês exibido ("Ano" = janeiro a dezembro do ano do mês exibido). */
function periodWin(p){
  p=p||PERIOD;
  if(p==='ano'){const y=cur.slice(0,4);return Array.from({length:12},(_,i)=>y+'-'+pad2(i+1))}
  return Array.from({length:+p},(_,i)=>add(cur,i));
}
/** Janela dos gráficos "para frente" (projeção e parcelas): em "Mês" mostra 12 meses. */
const forwardWin=()=>PERIOD==='1'?periodWin('12'):periodWin();
/** Mesma quantidade de meses imediatamente antes da janela (base das comparações). */
const prevWin=win=>win.map((_,i)=>add(win[0],i-win.length));
const periodLabelOf=win=>win.length===1?lab(win[0]):(win.length===12&&win[0].slice(5)==='01'?'Ano '+win[0].slice(0,4):sh(win[0])+' a '+sh(win[win.length-1]));

function paintPeriod(){
  document.querySelectorAll('#pseg [data-p]').forEach(b=>{const on=b.dataset.p===PERIOD;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false')});
  const w=periodWin();
  $('pdesc').textContent=PERIOD==='1'?lab(cur)+' · projeção e parcelas mostram 12 meses.':'Período: '+periodLabelOf(w)+' · o ritmo continua sendo do mês exibido.';
  $('xp').hidden=PERIOD==='1';
}
document.querySelectorAll('#pseg [data-p]').forEach(b=>b.onclick=()=>{
  PERIOD=b.dataset.p;try{localStorage.setItem('fin_period',PERIOD)}catch(e){}
  render();
});
/* gráficos só são desenhados com a seção aberta; ao abrir, redesenha */
['mg','mt'].forEach(id=>$(id).addEventListener('toggle',()=>{if(TAB==='an')render()}));

/** Totais por categoria (todos os meus gastos) e por nome (só gastos avulsos) dentro de uma lista de meses. */
function aggWin(win){
  const by={},nm={};
  win.forEach(m=>myRows(m).forEach(r=>{
    by[r.cat]=(by[r.cat]||0)+r.val;
    if(r.rec||r.n>1)return; /* fixos e parcelas não entram nas variações por nome */
    const k=norm(r.name),o=nm[k]||(nm[k]={name:r.name,val:0});o.val+=r.val;o.name=r.name;
  }));
  return{by,nm};
}

/**
 * Frases curtas sobre o período (HTML com <b>). Ordem de prioridade: maior gasto, o que subiu e o que caiu,
 * total contra o período anterior, uso da receita com nota, categoria dominante e mês mais pesado.
 */
function highlights(win){
  const single=win.length===1,pw=prevWin(win),cu=aggWin(win),pv=aggWin(pw),unit=single?'mês':'período';
  const all=win.flatMap(myRows),g=win.reduce((a,m)=>a+tot(m),0),gp=pw.reduce((a,m)=>a+tot(m),0),s=win.reduce((a,m)=>a+sal(m),0),out=[];
  if(!all.length)return['Sem gastos '+(single?'neste mês':'neste período')+'.'];
  const byId={};all.forEach(r=>{const k=single?r.id:norm(r.name),o=byId[k]||(byId[k]={name:r.name,val:0});o.val+=r.val});
  const top=Object.values(byId).sort((a,b)=>b.val-a.val)[0];
  out.push('Seu maior gasto'+(single?'':' no período')+' foi <b>'+esc(top.name)+'</b> ('+R(top.val)+').');
  const mv=Object.entries(cu.nm).map(([k,o])=>{const p=pv.nm[k];return p&&p.val>=30&&o.val>=30?{name:o.name,d:(o.val-p.val)/p.val*100,diff:o.val-p.val}:null})
    .filter(x=>x&&Math.abs(x.d)>=10&&Math.abs(x.diff)>=20);
  const up=mv.filter(x=>x.d>0).sort((a,b)=>b.d-a.d)[0],dn=mv.filter(x=>x.d<0).sort((a,b)=>a.d-b.d)[0];
  if(up)out.push('<b>'+esc(up.name)+'</b> subiu '+Math.round(up.d)+'%.');
  if(dn)out.push('<b>'+esc(dn.name)+'</b> caiu '+Math.round(-dn.d)+'%.');
  if(gp>0){const d=(g-gp)/gp*100;out.push(Math.abs(d)<1?'Seus gastos ficaram iguais aos do '+unit+' anterior.':'Você gastou <b>'+R(Math.abs(g-gp))+' '+(g>gp?'a mais':'a menos')+'</b> que no '+unit+' anterior ('+(g>gp?'▲ ':'▼ ')+Math.round(Math.abs(d))+'%).')}
  if(s>0){const p=g/s;out.push('Você usou <b>'+Math.round(p*100)+'%</b> da receita'+(single?'':' no período')+' · nota <b>'+Math.max(0,Math.min(10,score(p))).toFixed(1).replace('.',',')+'</b>.')}
  const cats=Object.entries(cu.by).sort((a,b)=>b[1]-a[1]);
  if(cats.length&&g>0)out.push('<b>'+esc(cats[0][0])+'</b> pesa '+Math.round(cats[0][1]/g*100)+'% dos seus gastos.');
  const hv=win.filter(m=>sal(m)>0).map(m=>({m,p:tot(m)/sal(m)})).sort((a,b)=>b.p-a.p)[0];
  if(!single&&hv)out.push('Mês mais pesado: <b>'+sh(hv.m)+'</b> ('+Math.round(hv.p*100)+'% da receita).');
  return out;
}
function renderHL(win){$('hl').innerHTML=highlights(win).slice(0,5).map(x=>'<li>'+x+'</li>').join('')}

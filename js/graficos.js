/* Análises: categorias em barras, composição do mês e linha do tempo das parcelas */
const myRows=m=>rows(m).filter(r=>!r.who);
function renderAn(h,rs){renderCats(rs);renderComp(h);renderTimeline()}

function renderCats(rs){
  const by={},pv={},prev=myRows(add(cur,-1));
  rs.forEach(r=>by[r.cat]=(by[r.cat]||0)+r.val);
  prev.forEach(r=>pv[r.cat]=(pv[r.cat]||0)+r.val);
  const es=Object.entries(by).sort((a,b)=>b[1]-a[1]),mx=es.length?es[0][1]:1;
  $('catbars').innerHTML=!es.length?'<p class="empty">Nenhum gasto seu em '+lab(cur)+'.</p>':es.map(([n,v])=>{
    const p=pv[n]||0;let vr='';
    if(prev.length){
      if(!p)vr='<em class="vr new">novo</em>';
      else{const d=(v-p)/p*100;vr=Math.abs(d)<1?'<em class="vr new">igual</em>':'<em class="vr '+(d>0?'up':'dn')+'">'+(d>0?'▲ ':'▼ ')+Math.round(Math.abs(d))+'%</em>'}
    }
    return '<button class="cb" data-cat="'+esc(n)+'" aria-label="Ver os gastos de '+esc(n)+'"><span class="cn">'+esc(n)+'</span>'+vr+'<span class="cv2">'+R(v)+'</span><span class="cbar"><i style="width:'+Math.max(3,v/mx*100)+'%;background:'+(COL[CATS.indexOf(n)%COL.length]||'#5B7370')+'"></i></span></button>';
  }).join('')+(es.length?'<p class="empty" style="margin:10px 0 0;font-size:13px">Toque numa categoria para ver os gastos dela'+(prev.length?'. ▲▼ comparam com '+lab(add(cur,-1)):'')+'.</p>':'');
  $('catbars').querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{
    F.cat=b.dataset.cat;F.q='';F.who='';F.st='';$('q').value='';VIEW='l';showTab('gs');
  });
}

function renderComp(h){
  const rs=myRows(cur),fx=sumV(rs.filter(r=>r.rec)),pc=sumV(rs.filter(r=>!r.rec&&r.n>1)),av=sumV(rs.filter(r=>!r.rec&&r.n===1));
  const g=fx+pc+av,s=h.s,op={};
  rows(cur).filter(r=>r.who).forEach(r=>op[r.who]=(op[r.who]||0)+r.val);
  if(!g&&!s&&!Object.keys(op).length){$('comp').innerHTML='<p class="empty">Sem gastos neste mês.</p>';return}
  const base=Math.max(s,g)||1,den=s||g||1,pct=v=>Math.round(v/den*100)+'%',free=Math.max(0,s-g);
  const seg=(v,c)=>v>0?'<i class="'+c+'" style="width:'+v/base*100+'%"></i>':'';
  const lg=(c,n,v)=>'<div class="lg"><span class="dot '+c+'"></span><span>'+n+'</span><b>'+R(v)+'</b><small>'+pct(v)+'</small></div>';
  $('comp').innerHTML='<div class="stk" role="img" aria-label="Composição do mês">'+seg(fx,'c-fx')+seg(pc,'c-pc')+seg(av,'c-av')+(s?seg(free,'c-fr'):'')+(s?'<b class="tetom" style="left:calc('+(TETO*s/base*100)+'% - 1px)" title="Teto"></b>':'')+'</div>'+
    lg('c-fx','Fixos (recorrentes)',fx)+lg('c-pc','Parcelas',pc)+lg('c-av','Avulsos',av)+
    (s?(g>s?lg('c-bd','Acima do salário',g-s):lg('c-fr','Livre',free)):'')+
    (g?'<p class="comp-note">Já travado em fixos e parcelas: <b>'+pct(fx+pc)+'</b>'+(s?' do salário':' dos gastos')+'.'+(s?(g>TETO*s?' O mês passa do teto de '+Math.round(TETO*100)+'%.':' Cabem mais '+R(TETO*s-g)+' até o teto de '+Math.round(TETO*100)+'%.'):'')+'</p>':'')+
    (Object.keys(op).length?'<p class="comp-note">Fora do total (outras pessoas): '+Object.entries(op).map(([n,v])=>esc(n)+' '+R(v)).join(' · ')+'</p>':'');
}

function renderTimeline(){
  const win=Array.from({length:12},(_,i)=>add(cur,i)),last=win[11],box=$('tl');
  const its=S.items.filter(i=>!i.rec&&i.n>1&&!i.who&&num(add(i.start,i.n-1))>=num(cur)&&num(i.start)<=num(last))
    .map(i=>({i,e:add(i.start,i.n-1)})).sort((a,b)=>num(a.e)-num(b.e)||b.i.val-a.i.val);
  if(!its.length){box.innerHTML='<p class="empty">Nenhuma parcela ativa nos próximos 12 meses.</p>';return}
  const ev=win.map(m=>({m,rs:myRows(m).filter(r=>!r.rec&&r.n>1&&r.k===r.n)})).filter(x=>x.rs.length);
  const msg=ev.length?'<ul class="tlmsg">'+ev.slice(0,4).map(({m,rs})=>{
    const nx=add(m,1),s=sal(nx),fol=s>0?TETO*s-tot(nx):null;
    return '<li>Em <b>'+sh(m)+'</b> terminam <b>'+rs.length+(rs.length===1?' parcela':' parcelas')+'</b> e liberam <b>'+R(sumV(rs))+'</b> por mês a partir de '+sh(nx)+(fol!==null?' · folga até o teto: '+R(Math.max(0,fol)):'')+'.</li>';
  }).join('')+'</ul>':'<p class="empty">Nenhuma parcela termina nos próximos 12 meses.</p>';
  const head='<div class="tlm">'+win.map(m=>'<span>'+MN[+m.slice(5)-1].slice(0,3).toLowerCase()+'</span>').join('')+'</div>';
  const list=its.map(({i,e})=>{
    const cr=rows(cur).find(x=>x.id===i.id),val=cr?cr.val:i.val,a=Math.max(0,num(i.start)-num(cur)),b=Math.min(11,num(e)-num(cur));
    const started=num(i.start)<=num(cur),beyond=num(e)>num(last);
    return '<div class="tli"><div class="tlh"><b>'+esc(i.name)+'</b><span>'+R(val)+'/mês</span></div><div class="tlb"><i class="'+(beyond?'more':'')+'" style="grid-column:'+(a+1)+'/'+(b+2)+'"></i></div><small>'+(started?'parcela '+(cr?cr.k:'')+'/'+i.n:'começa em '+sh(i.start))+' · termina em '+sh(e)+(beyond?' (depois dos 12 meses)':'')+'</small></div>';
  }).join('');
  box.innerHTML=msg+head+list;
}

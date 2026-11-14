/* Análises: categorias em barras, composição do mês e linha do tempo das parcelas (respeitam o período) */
const myRows=m=>rows(m).filter(r=>!r.who);
function renderAn(){
  const win=periodWin();
  renderHL(win);renderCats(win);renderComp(win);renderRitmo();renderTimeline(forwardWin());paintPeriod();
}

function renderCats(win){
  const by=aggWin(win).by,pv=aggWin(prevWin(win)).by,hasPrev=Object.keys(pv).length>0,single=win.length===1;
  const es=Object.entries(by).sort((a,b)=>b[1]-a[1]),mx=es.length?es[0][1]:1;
  $('cat-t').textContent=single?'Gastos por categoria':'Gastos por categoria no período';
  $('catbars').innerHTML=!es.length?'<p class="empty">Nenhum gasto seu '+(single?'em '+lab(cur):'neste período')+'.</p>':es.map(([n,v])=>{
    const p=pv[n]||0;let vr='';
    if(hasPrev){
      if(!p)vr='<em class="vr new">novo</em>';
      else{const d=(v-p)/p*100;vr=Math.abs(d)<1?'<em class="vr new">igual</em>':'<em class="vr '+(d>0?'up':'dn')+'">'+(d>0?'▲ ':'▼ ')+Math.round(Math.abs(d))+'%</em>'}
    }
    return '<button class="cb" data-cat="'+esc(n)+'" aria-label="Ver os gastos de '+esc(n)+'"><span class="cn">'+esc(n)+'</span>'+vr+'<span class="cv2">'+R(v)+'</span><span class="cbar"><i style="width:'+Math.max(3,v/mx*100)+'%;background:'+(COL[CATS.indexOf(n)%COL.length]||'#5B7370')+'"></i></span></button>';
  }).join('')+(es.length?'<p class="empty" style="margin:10px 0 0;font-size:13px">Toque numa categoria para ver os gastos dela em '+lab(cur)+(hasPrev?'. ▲▼ comparam com '+(single?lab(add(cur,-1)):'o período anterior'):'')+'.</p>':'');
  $('catbars').querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{
    F.cat=b.dataset.cat;F.q='';F.who='';F.st='';$('q').value='';VIEW='l';showTab('gs');
  });
}

function renderComp(win){
  const rs=win.flatMap(myRows),fx=sumV(rs.filter(r=>r.rec)),pc=sumV(rs.filter(r=>!r.rec&&r.n>1)),av=sumV(rs.filter(r=>!r.rec&&r.n===1));
  const g=fx+pc+av,s=win.reduce((a,m)=>a+sal(m),0),op={};
  win.forEach(m=>rows(m).filter(r=>r.who).forEach(r=>op[r.who]=(op[r.who]||0)+r.val));
  $('comp-t').textContent=win.length===1?'Composição do mês':'Composição do período';
  if(!g&&!s&&!Object.keys(op).length){$('comp').innerHTML='<p class="empty">Sem gastos '+(win.length===1?'neste mês':'neste período')+'.</p>';return}
  const base=Math.max(s,g)||1,den=s||g||1,pct=v=>Math.round(v/den*100)+'%',free=Math.max(0,s-g);
  const seg=(v,c)=>v>0?'<i class="'+c+'" style="width:'+v/base*100+'%"></i>':'';
  const lg=(c,n,v)=>'<div class="lg"><span class="dot '+c+'"></span><span>'+n+'</span><b>'+R(v)+'</b><small>'+pct(v)+'</small></div>';
  $('comp').innerHTML='<div class="stk" role="img" aria-label="Composição">'+seg(fx,'c-fx')+seg(pc,'c-pc')+seg(av,'c-av')+(s?seg(free,'c-fr'):'')+(s?'<b class="tetom" style="left:calc('+(TETO*s/base*100)+'% - 1px)" title="Teto"></b>':'')+'</div>'+
    lg('c-fx','Fixos (recorrentes)',fx)+lg('c-pc','Parcelas',pc)+lg('c-av','Avulsos',av)+
    (s?(g>s?lg('c-bd','Acima da receita',g-s):lg('c-fr','Livre',free)):'')+
    (g?'<p class="comp-note">Já travado em fixos e parcelas: <b>'+pct(fx+pc)+'</b>'+(s?' da receita':' dos gastos')+'.'+(s?(g>TETO*s?' O '+(win.length===1?'mês':'período')+' passa do teto de '+Math.round(TETO*100)+'%.':' Cabem mais '+R(TETO*s-g)+' até o teto de '+Math.round(TETO*100)+'%.'):'')+'</p>':'')+
    (Object.keys(op).length?'<p class="comp-note">Fora do total (outras pessoas): '+Object.entries(op).map(([n,v])=>esc(n)+' '+R(v)).join(' · ')+'</p>':'');
}

function renderTimeline(win){
  const N=win.length,w0=win[0],last=win[N-1],box=$('tl'),cols='grid-template-columns:repeat('+N+',1fr)';
  const its=S.items.filter(i=>!i.rec&&i.n>1&&!i.who&&num(add(i.start,i.n-1))>=num(w0)&&num(i.start)<=num(last))
    .map(i=>({i,e:add(i.start,i.n-1)})).sort((a,b)=>num(a.e)-num(b.e)||b.i.val-a.i.val);
  if(!its.length){box.innerHTML='<p class="empty">Nenhuma parcela ativa neste período.</p>';return}
  const ev=win.map(m=>({m,rs:myRows(m).filter(r=>!r.rec&&r.n>1&&r.k===r.n)})).filter(x=>x.rs.length);
  const msg=ev.length?'<ul class="tlmsg">'+ev.slice(0,4).map(({m,rs})=>{
    const nx=add(m,1),s=sal(nx),fol=s>0?TETO*s-tot(nx):null;
    return '<li>Em <b>'+sh(m)+'</b> terminam <b>'+rs.length+(rs.length===1?' parcela':' parcelas')+'</b> e liberam <b>'+R(sumV(rs))+'</b> por mês a partir de '+sh(nx)+(fol!==null?' · folga até o teto: '+R(Math.max(0,fol)):'')+'.</li>';
  }).join('')+'</ul>':'<p class="empty">Nenhuma parcela termina neste período.</p>';
  const head='<div class="tlm" style="'+cols+'">'+win.map(m=>'<span>'+MN[+m.slice(5)-1].slice(0,3).toLowerCase()+'</span>').join('')+'</div>';
  const list=its.map(({i,e})=>{
    const cr=rows(cur).find(x=>x.id===i.id),val=cr?cr.val:i.val,a=Math.max(0,num(i.start)-num(w0)),b=Math.min(N-1,num(e)-num(w0));
    const beyond=num(e)>num(last),status=cr?'parcela '+cr.k+'/'+i.n:num(e)<num(cur)?'terminou em '+sh(e):'começa em '+sh(i.start);
    return '<div class="tli"><div class="tlh"><b>'+esc(i.name)+'</b><span>'+R(val)+'/mês</span></div><div class="tlb" style="'+cols+'"><i class="'+(beyond?'more':'')+'" style="grid-column:'+(a+1)+'/'+(b+2)+'"></i></div><small>'+status+' · '+(num(e)<num(cur)?'':'termina em '+sh(e))+(beyond?' (depois do período)':'')+'</small></div>';
  }).join('');
  box.innerHTML=msg+head+list;
}

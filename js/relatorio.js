/* Relatório do mês (imagem e PDF) e exportação para planilha (.csv) */
const Rf=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
function score(p){
  if(p<=TETO)return 10-3*(p/TETO);
  if(p<=1)return 7-7*((p-TETO)/(1-TETO));
  return 0;
}
function reportData(m){
  const rs=rows(m),mine=rs.filter(r=>!r.who),s=sal(m),g=tot(m),by={},oth={};
  mine.forEach(r=>by[r.cat]=(by[r.cat]||0)+r.val);
  rs.filter(r=>r.who).forEach(r=>{const o=oth[r.who]||(oth[r.who]={t:0,p:0});o.t+=r.val;if(S.paid[r.id+'|'+m])o.p+=r.val});
  const p=s?g/s:null;
  return{m,s,g,p,pm:tot(add(m,-1)),cats:Object.entries(by).sort((a,b)=>b[1]-a[1]),top:[...mine].sort((a,b)=>b.val-a.val).slice(0,5),oth,
    nota:p===null?null:Math.max(0,Math.min(10,score(p))),parc:parc(m),fix:sumV(mine.filter(r=>r.rec)),paid:sumV(mine.filter(r=>S.paid[r.id+'|'+m]))};
}
function drawReport(m){
  const d=reportData(m),W=1080,cv=document.createElement('canvas');cv.width=W;cv.height=2400;
  const c=cv.getContext('2d'),FN='Manrope, system-ui, -apple-system, sans-serif';
  const ink='#12302B',mu='#5B7370',ln='#D5DFDC',ok='#1E9E6A',wn='#D9961B',bd='#D6483B';
  const T=(s,x,y,sz,col,w,al)=>{c.font=(w||600)+' '+sz+'px '+FN;c.fillStyle=col;c.textAlign=al||'left';c.fillText(s,x,y)};
  const fit=(s,mw,sz,w)=>{c.font=(w||600)+' '+sz+'px '+FN;while(s.length>3&&c.measureText(s).width>mw)s=s.slice(0,-2);return s};
  const rr=(x,y,w,h,r,fill,stroke)=>{c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke()}};
  c.fillStyle='#EEF2F1';c.fillRect(0,0,W,2400);
  const gr=c.createLinearGradient(0,0,W,300);gr.addColorStop(0,'#072C28');gr.addColorStop(1,'#148671');c.fillStyle=gr;c.fillRect(0,0,W,300);
  T('Controle financeiro',60,92,32,'#BFE3D9',600);T(lab(m),60,184,72,'#FFFFFF',800);T('Resumo do mês',60,238,30,'#BFE3D9',500);
  if(d.nota!==null){
    const col=d.nota>=8?'#34C48A':d.nota>=6?'#9BD04F':d.nota>=4?'#E8AB35':'#EE6A5C';
    c.beginPath();c.arc(930,138,88,0,7);c.fillStyle='rgba(255,255,255,.12)';c.fill();c.lineWidth=10;c.strokeStyle=col;c.stroke();
    T(d.nota.toFixed(1).replace('.',','),930,162,62,'#FFFFFF',800,'center');T('Nota do mês',930,262,26,'#BFE3D9',600,'center');
  }
  let y=340;
  [['Salário',d.s?Rf(d.s):'—',ink],['Gastos',Rf(d.g),ink],['Saldo previsto',d.s?Rf(d.s-d.g):'—',d.s&&d.s-d.g<0?bd:ok]].forEach((x,i)=>{
    const bx=45+i*335;rr(bx,y,320,150,24,'#FFFFFF',ln);T(x[0],bx+28,y+52,26,mu,500);T(fit(x[1],270,40,800),bx+28,y+112,40,x[2],800);
  });
  y+=214;
  T('Uso do salário',60,y,36,ink,800);y+=38;
  if(d.p!==null){
    rr(60,y,960,30,15,'#D5DFDC');
    rr(60,y,Math.max(30,Math.min(d.p,1)*960),30,15,d.p<=TETO?ok:d.p<=Math.min(TETO+.15,.95)?wn:bd);
    c.fillStyle=ink;c.fillRect(60+TETO*960-2,y-8,4,46);
    y+=84;T(Math.round(d.p*100)+'% do salário usado · teto de '+Math.round(TETO*100)+'%',60,y,30,ink,600);
  }else{y+=40;T('Cadastre o salário para ver o percentual.',60,y,28,mu,500)}
  y+=50;
  if(d.pm>0){const df=d.g-d.pm;T(fit('Em relação a '+lab(add(m,-1))+': gastos '+(df>=0?'maiores':'menores')+' em '+Rf(Math.abs(df))+' ('+Math.round(Math.abs(df)/d.pm*100)+'%)',960,28,500),60,y,28,mu,500)}
  else T('Sem gastos no mês anterior para comparar.',60,y,28,mu,500);
  y+=44;T(fit('Parcelas '+Rf(d.parc)+' · Fixos '+Rf(d.fix)+' · Já pago '+Rf(d.paid),960,28,500),60,y,28,mu,500);
  y+=86;
  T('Gastos por categoria',60,y,36,ink,800);y+=30;
  if(!d.cats.length){T('Nenhum gasto neste mês.',60,y+40,28,mu,500);y+=80}
  else{
    const mx=d.cats[0][1];
    d.cats.slice(0,6).forEach(([n,v])=>{
      T(fit(n,260,28,600),60,y+40,28,ink,600);
      rr(340,y+14,Math.max(8,440*v/mx),34,10,COL[CATS.indexOf(n)%COL.length]||'#5B7370');
      T(Rf(v),W-60,y+42,28,ink,700,'right');y+=62;
    });
    if(d.cats.length>6){T('+ '+(d.cats.length-6)+(d.cats.length-6===1?' categoria menor':' categorias menores'),60,y+34,24,mu,500);y+=50}
  }
  y+=44;
  T('Maiores gastos',60,y,36,ink,800);y+=20;
  d.top.forEach((r,i)=>{
    c.fillStyle=ln;c.fillRect(60,y+10,960,2);
    T(fit((i+1)+'. '+r.name,500,28,600),60,y+56,28,ink,600);T(fit(r.cat,200,24,500),590,y+54,24,mu,500);T(Rf(r.val),W-60,y+56,28,ink,700,'right');y+=62;
  });
  if(!d.top.length){T('Nenhum gasto neste mês.',60,y+50,28,mu,500);y+=70}
  const on=Object.entries(d.oth);
  if(on.length){
    y+=76;T('Gastos de outras pessoas',60,y,36,ink,800);y+=14;T('Não somam nos totais acima',60,y+36,24,mu,500);y+=50;
    on.forEach(([n,o])=>{c.fillStyle=ln;c.fillRect(60,y+10,960,2);T(fit(n,400,28,600),60,y+56,28,ink,600);T('A receber '+Rf(o.t-o.p),W-60,y+56,28,ink,700,'right');y+=62});
  }
  y+=60;
  T('Gerado em '+new Date().toLocaleDateString('pt-BR')+' · Controle financeiro v'+APP_VERSION,W/2,y,24,mu,500,'center');
  const out=document.createElement('canvas');out.width=W;out.height=y+50;
  out.getContext('2d').drawImage(cv,0,0,W,y+50,0,0,W,y+50);
  return out;
}
/* PDF mínimo de uma página A4 com a imagem do relatório */
function pdfFromJpeg(dataUrl,w,h){
  const bin=atob(dataUrl.split(',')[1]),len=bin.length,jpg=new Uint8Array(len);
  for(let i=0;i<len;i++)jpg[i]=bin.charCodeAt(i);
  const PW=595,PH=842,sc=Math.min(PW/w,PH/h),iw=w*sc,ih=h*sc,x=(PW-iw)/2,y=(PH-ih)/2;
  const enc=s=>new TextEncoder().encode(s),parts=[],offs=[];let off=0;
  const push=b=>{parts.push(b);off+=b.length};
  push(enc('%PDF-1.4\n'));
  offs[1]=off;push(enc('1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n'));
  offs[2]=off;push(enc('2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n'));
  offs[3]=off;push(enc('3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 '+PW+' '+PH+']/Resources<</XObject<</Im0 4 0 R>>>>/Contents 5 0 R>>endobj\n'));
  offs[4]=off;push(enc('4 0 obj<</Type/XObject/Subtype/Image/Width '+w+'/Height '+h+'/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length '+len+'>>stream\n'));push(jpg);push(enc('\nendstream endobj\n'));
  const cs='q '+iw.toFixed(2)+' 0 0 '+ih.toFixed(2)+' '+x.toFixed(2)+' '+y.toFixed(2)+' cm /Im0 Do Q';
  offs[5]=off;push(enc('5 0 obj<</Length '+cs.length+'>>stream\n'+cs+'\nendstream endobj\n'));
  const xr=off;let t='xref\n0 6\n0000000000 65535 f \n';
  for(let i=1;i<=5;i++)t+=String(offs[i]).padStart(10,'0')+' 00000 n \n';
  push(enc(t+'trailer<</Size 6/Root 1 0 R>>\nstartxref\n'+xr+'\n%%EOF'));
  return new Blob(parts,{type:'application/pdf'});
}
async function saveFile(blob,name){
  const f=new File([blob],name,{type:blob.type});
  try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:name});return}}catch(e){if(e&&e.name==='AbortError')return}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),3000);
}
let RPC=null;
function openReport(){
  RPC=drawReport(cur);$('rpi').src=RPC.toDataURL('image/png');$('rp').showModal();
}
$('xr').onclick=openReport;
$('rpx').onclick=()=>$('rp').close();
$('rpi2').onclick=()=>RPC.toBlob(b=>saveFile(b,'relatorio-'+cur+'.png'),'image/png');
$('rpp').onclick=()=>saveFile(pdfFromJpeg(RPC.toDataURL('image/jpeg',0.92),RPC.width,RPC.height),'relatorio-'+cur+'.pdf');
/* planilhas (.csv, separador ; e acentos para o Excel em português) */
const num2=v=>v.toFixed(2).replace('.',',');
const csvCell=v=>{const s=String(v==null?'':v);return /[;"\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
const HEAD=['Mês','Nome','Categoria','Valor','Parcela','Tipo','De quem','Cartão','Situação'];
function csvRow(m,r){
  const p=!!S.paid[r.id+'|'+m];
  return [m,r.name,r.cat,num2(r.val),r.rec?'mensal':r.n>1?r.k+'/'+r.n:'única',r.rec?'Recorrente':r.n>1?'Parcelado':'Único',r.who||'Eu',cardName(r.card)||'',r.who?(p?'Reembolsado':'A receber'):(p?'Pago':'Pendente')];
}
function monthsRange(){
  const t=new Date(),now=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0');
  let a=cur,b=cur;
  S.items.forEach(i=>{
    if(num(i.start)<num(a))a=i.start;
    const e=i.rec?(i.end||add(now,12)):add(i.start,i.n-1);
    if(num(e)>num(b))b=e;
  });
  return Array.from({length:Math.min(120,num(b)-num(a)+1)},(_,i)=>add(a,i));
}
function csvText(lines){return '\ufeff'+lines.map(l=>l.map(csvCell).join(';')).join('\r\n')}
function detailLines(ms){
  const L=[HEAD];
  ms.forEach(m=>rows(m).sort((x,y)=>(x.who?1:0)-(y.who?1:0)||y.val-x.val).forEach(r=>L.push(csvRow(m,r))));
  return L;
}
function summaryLines(ms){
  const L=[['Mês','Salário','Gastos (meus)','Saldo previsto','% do salário','Parcelas','Fixos','Já pago','Falta pagar','Nota']];
  ms.forEach(m=>{
    const d=reportData(m);
    L.push([m,num2(d.s),num2(d.g),num2(d.s-d.g),d.p===null?'':num2(d.p*100),num2(d.parc),num2(d.fix),num2(d.paid),num2(d.g-d.paid),d.nota===null?'':num2(d.nota)]);
  });
  return L;
}
const csvBlob=lines=>new Blob([csvText(lines)],{type:'text/csv;charset=utf-8'});
$('xm').onclick=()=>saveFile(csvBlob(detailLines([cur])),'controle-financeiro-'+cur+'.csv');
$('xa').onclick=()=>saveFile(csvBlob(detailLines(monthsRange())),'controle-financeiro-completo.csv');
$('xs').onclick=()=>saveFile(csvBlob(summaryLines(monthsRange())),'controle-financeiro-resumo-mensal.csv');

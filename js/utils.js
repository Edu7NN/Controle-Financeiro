/* Utilitários: formatação, datas, mensagens */
const MN=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const $=id=>document.getElementById(id);
const R=v=>v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const num=m=>{const[y,mo]=m.split('-').map(Number);return y*12+mo-1};
const add=(m,n)=>{const t=num(m)+n;return Math.floor(t/12)+'-'+String(t%12+1).padStart(2,'0')};
const lab=m=>MN[+m.slice(5)-1]+' '+m.slice(0,4);
const sh=m=>MN[+m.slice(5)-1].slice(0,3)+'/'+m.slice(2,4);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cssv=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const pnum=s=>parseFloat(String(s).replace(/\./g,'').replace(',','.'));
let toastT=null;
function toast(msg,undo){
  const t=$('toast');t.textContent='';
  const s=document.createElement('span');s.textContent=msg;t.append(s);
  if(undo){const b=document.createElement('button');b.className='s';b.textContent='Desfazer';b.onclick=()=>{undo();hideToast()};t.append(b)}
  try{t.hidePopover()}catch(e){}
  try{t.showPopover()}catch(e){}
  clearTimeout(toastT);toastT=setTimeout(hideToast,9000);
}
function hideToast(){try{$('toast').hidePopover()}catch(e){}}

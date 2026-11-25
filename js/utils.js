/* Utilitários: formatação, datas, mensagens */
window.PRIV = window.PRIV || false; // Garante que a variável global exista antes de tudo

const MN=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const $=id=>document.getElementById(id);
const R=v=>(window.PRIV?'R$ ••••':v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}));
const num=m=>{if(!m||typeof m!=='string'||!m.includes('-'))return 0;const[y,mo]=m.split('-').map(Number);return (y||0)*12+(mo||1)-1};
const add=(m,n)=>{const t=num(m)+n;return Math.floor(t/12)+'-'+String(t%12+1).padStart(2,'0')};
const lab=m=>{if(!m||!m.includes('-'))return'';return MN[+m.slice(5)-1]+' '+m.slice(0,4)};
const sh=m=>{if(!m||!m.includes('-'))return'';return MN[+m.slice(5)-1].slice(0,3)+'/'+m.slice(2,4)};
const brDate=d=>{if(!d)return'';const p=String(d).split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:d};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cssv=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const pnum=s=>parseFloat(String(s).replace(/\./g,'').replace(',','.'));

let toastT=null;
const TOAST_MS={plain:3000,undo:5000};
function toast(msg,undo,ms){
  const t=$('toast');if(!t)return alert(msg);t.textContent='';
  const s=document.createElement('span');s.textContent=msg;t.append(s);
  if(undo){const b=document.createElement('button');b.className='s';b.textContent='Desfazer';b.onclick=e=>{e.stopPropagation();undo();hideToast()};t.append(b)}
  t.onclick=hideToast;
  try{t.hidePopover()}catch(e){}
  try{t.showPopover()}catch(e){}
  clearTimeout(toastT);toastT=setTimeout(hideToast,ms||(undo?TOAST_MS.undo:TOAST_MS.plain));
}
function hideToast(){try{$('toast').hidePopover()}catch(e){}}

const pad2=n=>String(n).padStart(2,'0');
const monthKey=d=>d.getFullYear()+'-'+pad2(d.getMonth()+1);
const todayKey=()=>monthKey(new Date());
const daysIn=m=>new Date(+m.slice(0,4),+m.slice(5),0).getDate();

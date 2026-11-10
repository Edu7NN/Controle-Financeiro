/* Navegação por abas e botão de ocultar valores */
const EYE='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>';
const EYE_ON=EYE+'</svg>',EYE_OFF=EYE+'<path d="M4 4l16 16"/></svg>';
function paintEye(){
  const b=$('eye');b.innerHTML=PRIV?EYE_OFF:EYE_ON;
  b.setAttribute('aria-label',PRIV?'Mostrar valores':'Ocultar valores');b.setAttribute('aria-pressed',PRIV?'true':'false');
}
function showTab(t){
  TAB=t;
  if(t!=='gs'&&SELM){SELM=false;SEL.clear()}
  document.querySelectorAll('.pane').forEach(p=>p.hidden=p.id!=='pane-'+t);
  document.querySelectorAll('.tabs [data-tab]').forEach(b=>{const on=b.dataset.tab===t;b.classList.toggle('on',on);b.setAttribute('aria-current',on?'page':'false')});
  $('mnav').hidden=(t==='op');
  if(t==='op')openCfg();
  render();
  try{window.scrollTo(0,0)}catch(e){}
}
document.querySelectorAll('.tabs [data-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));
$('eye').onclick=()=>{
  PRIV=!PRIV;try{localStorage.setItem('fin_priv',PRIV?'1':'0')}catch(e){}
  paintEye();render();if(TAB==='op')openCfg();
};

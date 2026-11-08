/* Estado, persistência local e desfazer */
const K='fin_v1',DEFAULT_CATS=['Moradia','Alimentação','Transporte','Saúde','Educação','Lazer','Compras','Assinaturas','Cartão de crédito','Dívidas','Outros'];
let CATS=[];
const COL=['#0F6B5C','#E0A526','#3B7DD8','#D6483B','#7A5AC7','#E8743B','#2AA7A0','#9B6B43','#C0407A','#5B7370','#8AA14A'];
let TETO=0.7;
let S={salary:{},items:[]},cur=(()=>{const n=new Date(),k=n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0');return k<'2026-12'?'2026-12':k})(),ch={};
try{const r=localStorage.getItem(K);if(r)S=JSON.parse(r)}catch(e){}
applyState(S);
const save=()=>{
  try{S.updatedAt=new Date().toISOString();localStorage.setItem(K,JSON.stringify(S))}catch(e){}
  if(window.Backup)Backup.touch();
};
function applyState(next){
  S=next;S.salary=S.salary||{};S.items=S.items||[];S.paid=S.paid||{};
  S.cats=(S.cats&&S.cats.length)?S.cats:[...DEFAULT_CATS];CATS=S.cats;
  TETO=(S.teto>=50&&S.teto<=95?S.teto:70)/100;
  if(typeof fillCats==='function')fillCats();
}
/* Executa uma alteração, salva e oferece "Desfazer" */
function withUndo(msg,fn){
  const snap=JSON.stringify(S);fn();save();render();
  toast(msg,()=>{applyState(JSON.parse(snap));save();render()});
}

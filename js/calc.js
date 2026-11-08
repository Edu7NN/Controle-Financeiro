/* Cálculos: salário, gastos do mês, parcelas, recorrência e saúde financeira */
const sal=m=>{const k=Object.keys(S.salary).filter(x=>x<=m).sort();return k.length?S.salary[k.pop()]:0};
const act=(i,m)=>{const d=num(m)-num(i.start);return d>=0&&(i.rec?(!i.end||num(m)<=num(i.end)):d<i.n)};
const rows=m=>S.items.filter(i=>act(i,m)).map(i=>({...i,...((i.ov&&i.ov[m])||{}),id:i.id,k:num(m)-num(i.start)+1}));
const tot=m=>rows(m).filter(r=>!r.who).reduce((a,r)=>a+r.val,0);
const parc=m=>rows(m).filter(r=>r.n>1&&!r.who).reduce((a,r)=>a+r.val,0);

function level(p){return p<=TETO?'ok':p<=Math.min(TETO+.15,.95)?'wn':'bd'}

function health(m){
  const s=sal(m),g=tot(m);
  if(!s)return{lv:'none',t:'Informe seu salário',d:'Com o salário cadastrado, o sistema mostra se você pode gastar mais ou deve segurar o mês.',p:0,s,g};
  const p=g/s,marg=s*TETO-g;let t,d,lv=level(p);
  if(p<=TETO-.2){t='Pode gastar mais';d='Você usou '+Math.round(p*100)+'% do salário. Ainda cabem '+R(marg)+' até o teto de '+Math.round(TETO*100)+'%. Que tal reforçar a reserva de emergência?'}
  else if(p<=TETO){t='Dentro do plano';d='Você usou '+Math.round(p*100)+'% do salário. Restam '+R(marg)+' até o teto. Gaste com cuidado e evite novas parcelas.'}
  else if(p<=Math.min(TETO+.15,.95)){t='Atenção: segure os gastos';d='Você passou do teto em '+R(-marg)+' ('+Math.round(p*100)+'% do salário). Priorize só o essencial até o fim do mês.'}
  else if(p<=1){t='Alerta: não gaste mais';d='Já são '+Math.round(p*100)+'% do salário comprometidos e sobram só '+R(s-g)+'. Um imprevisto pode te deixar no vermelho.'}
  else{t='Alerta: gasta mais do que ganha';d='Os gastos superam o salário em '+R(g-s)+'. Corte despesas ou renegocie parcelas.'}
  return{lv,t,d,p,s,g,marg};
}

/* Cálculos: salário, gastos do mês, parcelas, recorrência e saúde financeira */
const sal=m=>{const k=Object.keys(S.salary).filter(x=>x<=m).sort();return k.length?S.salary[k.pop()]:0};
const act=(i,m)=>{const d=num(m)-num(i.start);return d>=0&&(i.rec?(!i.end||num(m)<=num(i.end)):d<i.n)};
const rows=m=>S.items.filter(i=>act(i,m)).map(i=>({...i,...((i.ov&&i.ov[m])||{}),id:i.id,k:num(m)-num(i.start)+1}));
const tot=m=>rows(m).reduce((a,r)=>a+r.val,0);
const parc=m=>rows(m).filter(r=>r.n>1).reduce((a,r)=>a+r.val,0);

function level(p){return p<=TETO?'ok':p<=Math.min(TETO+.15,.95)?'wn':'bd'}

function health(m){
  const s=sal(m),g=tot(m);
  if(!s)return{lv:'none',t:'Informe seu salário',d:'Com o salário cadastrado, o sistema avalia se você pode gastar mais ou se deve segurar este mês.',p:0,s,g};
  const p=g/s,marg=s*TETO-g;let t,d,lv=level(p);
  if(p<=TETO-.2){t='Muito bem: pode gastar mais';d='Você comprometeu '+Math.round(p*100)+'% do salário. Ainda há '+R(marg)+' de margem até o teto saudável de '+Math.round(TETO*100)+'%. Um bom uso é reforçar a reserva de emergência.'}
  else if(p<=TETO){t='Dentro do plano';d='Você comprometeu '+Math.round(p*100)+'% do salário. Restam '+R(marg)+' até o teto saudável. Dá para gastar com cuidado, sem criar novas parcelas.'}
  else if(p<=Math.min(TETO+.15,.95)){t='Atenção: evite novos gastos';d='Você passou do teto saudável em '+R(-marg)+' ('+Math.round(p*100)+'% do salário). Priorize só o essencial até o fim do mês.'}
  else if(p<=1){t='Alerta: não gaste mais';d='Já são '+Math.round(p*100)+'% do salário comprometidos, sobram só '+R(s-g)+'. Qualquer imprevisto pode te colocar no vermelho.'}
  else{t='Alerta: gastos acima do salário';d='Você gasta '+R(g-s)+' a mais do que ganha neste mês. Corte despesas ou renegocie parcelas.'}
  return{lv,t,d,p,s,g,marg};
}

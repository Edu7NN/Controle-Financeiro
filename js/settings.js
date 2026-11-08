/* Opções: categorias e salários editáveis e excluíveis, mais a seção de backup */
function fillCats(){
  const o=CATS.map(c=>'<option>'+esc(c)+'</option>').join(''),a=$('ct').value,b=$('ec').value;
  $('ct').innerHTML=o;$('ec').innerHTML=o;
  if(CATS.includes(a))$('ct').value=a;if(CATS.includes(b))$('ec').value=b;
}
const mapCat=(from,to)=>S.items.forEach(i=>{if(i.cat===from)i.cat=to;if(i.ov)Object.values(i.ov).forEach(o=>{if(o.cat===from)o.cat=to})});
function renameCat(a,b){
  b=b.trim();if(!b||b===a||CATS.includes(b))return openCfg();
  withUndo('Categoria renomeada',()=>{S.cats[S.cats.indexOf(a)]=b;mapCat(a,b)});fillCats();openCfg();
}
function delCat(c){
  if(CATS.length<=1)return;
  withUndo('Categoria excluída',()=>{
    const n=CATS.filter(x=>x!==c),fb=n.includes('Outros')?'Outros':n[0];
    mapCat(c,fb);S.cats=n;CATS=S.cats;
  });fillCats();openCfg();
}
function addCat(n){
  n=n.trim();if(!n||CATS.includes(n))return openCfg();
  withUndo('Categoria adicionada',()=>{S.cats.push(n)});fillCats();openCfg();
}
function openCfg(){
  const sk=Object.keys(S.salary).sort().reverse();
  $('cfgc').innerHTML=
   '<h2>Categorias</h2><p class="empty" style="margin:0 0 8px">Renomeie ou exclua. Gastos de uma categoria excluída passam para “Outros”.</p>'+
   CATS.map((c,i)=>'<div class="cr"><input value="'+esc(c)+'" data-rc="'+i+'" aria-label="Renomear categoria '+esc(c)+'"><button class="s" data-dc="'+i+'" aria-label="Excluir categoria '+esc(c)+'">✕</button></div>').join('')+
   '<div class="cr"><input id="nc" placeholder="Nova categoria"><button id="anc">Adicionar</button></div>'+
   '<h2 style="margin-top:20px">Salários</h2>'+
   (sk.length?'<p class="empty" style="margin:0 0 8px">Cada valor vale a partir do mês indicado, até o próximo valor cadastrado.</p>'+
    sk.map(k=>'<div class="cr s3"><span>'+lab(k)+'</span><input value="'+String(S.salary[k]).replace('.',',')+'" data-rs="'+k+'" inputmode="decimal" aria-label="Salário de '+lab(k)+'"><button class="s" data-ds="'+k+'" aria-label="Excluir salário de '+lab(k)+'">✕</button></div>').join('')
    :'<p class="empty">Nenhum salário cadastrado.</p>')+
   '<h2 style="margin-top:20px">Teto saudável de gastos</h2><p class="empty" style="margin:0 0 8px">Percentual do salário que você aceita gastar no mês; o restante vai para reserva. Entre 50% e 95%.</p><div class="cr s3" style="grid-template-columns:120px auto 1fr"><input id="tp2" type="number" min="50" max="95" step="5" value="'+Math.round(TETO*100)+'" aria-label="Teto saudável em porcentagem"><span>% do salário</span></div>'+
   '<h2 style="margin-top:20px">Backup e restauração</h2>'+Backup.section();
  const q=s=>$('cfgc').querySelectorAll(s);
  q('[data-rc]').forEach(el=>el.onchange=()=>renameCat(CATS[+el.dataset.rc],el.value));
  q('[data-dc]').forEach(b=>b.onclick=()=>delCat(CATS[+b.dataset.dc]));
  $('anc').onclick=()=>addCat($('nc').value);
  $('tp2').onchange=e=>{const v=Math.round(pnum(e.target.value));if(isNaN(v)||v<50||v>95)return openCfg();withUndo('Teto alterado',()=>{S.teto=v;TETO=v/100});openCfg()};
  q('[data-rs]').forEach(el=>el.onchange=()=>{const v=pnum(el.value);if(isNaN(v)||v<0)return openCfg();S.salary[el.dataset.rs]=v;save();render();openCfg()});
  q('[data-ds]').forEach(b=>b.onclick=()=>{withUndo('Salário excluído',()=>{delete S.salary[b.dataset.ds]});openCfg()});
  Backup.bind($('cfgc'));
  if(!$('cfg').open)$('cfg').showModal();
}

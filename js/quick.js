/* Lançamento rápido: janela "Novo gasto", categoria automática, atalhos e repetir último */
const norm=s=>String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const KW=[
 ['Assinaturas','netflix|spotify|youtube|prime|disney|hbo|assinatura|icloud'],
 ['Transporte','gasolina|combustivel|etanol|uber|99|onibus|metro|moto|carro|estacionamento|pedagio|oficina|ipva'],
 ['Alimentação','mercado|supermercado|atacadao|comida|ifood|restaurante|lanche|padaria|feira|acougue|pizza|hamburguer|cafe'],
 ['Moradia','aluguel|condominio|luz|energia|agua|internet|iptu|gas|reforma|obra|movel|moveis'],
 ['Saúde','farmacia|remedio|consulta|plano de saude|dentista|exame|academia|psicologo|medico'],
 ['Educação','escola|curso|faculdade|pos|mensalidade|livro|apostila'],
 ['Lazer','cinema|viagem|passeio|bar|show|ingresso|jogo|parque'],
 ['Compras','roupa|sapato|tenis|celular|notebook|shopee|amazon|presente'],
 ['Dívidas','emprestimo|financiamento|divida|juros']
].map(([c,w])=>[c,new RegExp('\\b('+w+')\\b')]);
let ctManual=false;
const hist=()=>[...S.items].sort((a,b)=>a.id<b.id?1:-1);
function suggestCat(name){
  const k=norm(name);if(k.length<3)return null;
  const sc={};
  S.items.forEach(i=>{const n=norm(i.name);if(n===k||n.startsWith(k)||(n.length>=4&&k.startsWith(n)))sc[i.cat]=(sc[i.cat]||0)+(n===k?3:1)});
  const best=Object.entries(sc).filter(([c])=>CATS.includes(c)).sort((a,b)=>b[1]-a[1])[0];
  if(best)return{cat:best[0],src:'h'};
  for(const [c,re] of KW)if(CATS.includes(c)&&re.test(k))return{cat:c,src:'k'};
  return null;
}
function hint(){
  const s=ctManual?null:suggestCat($('nm').value);
  if(s)$('ct').value=s.cat;
  $('cth').textContent='Categoria: '+$('ct').value+(ctManual?' · escolhida por você':s?(s.src==='h'?' · do seu histórico':' · sugerida'):' · altere em “Mais opções”');
  const k=norm($('nm').value),last=k.length>=3?hist().find(i=>norm(i.name)===k):null;
  $('vl').placeholder=last&&!PRIV?'Último: '+String(last.val).replace('.',','):'0,00';
}
function openQ(pre){
  pre=pre||{};ctManual=false;
  $('nm').value=pre.nm||'';$('vl').value=pre.vl||'';$('np').value=pre.np||1;$('rc').value='u';$('tp').value=pre.tp||'p';
  rcSync();$('st').value=pre.st||cur;$('wh').value='';$('cd').value='';$('ncw').hidden=true;$('msg').textContent='';
  $('mo').open=!!((pre.np&&pre.np>1)||(pre.st&&pre.st!==cur));
  hint();$('qd').showModal();$('nm').focus();
}
function addCopy(src,start){
  if(!src)return;
  const snap=JSON.stringify(S);
  S.items.push({id:uid(),name:src.name,cat:src.cat,val:src.val,n:src.n,start,...(src.rec?{rec:true}:{}),...(src.who?{who:src.who}:{}),...(src.card?{card:src.card}:{})});
  save();render();
  toast('Adicionado: '+src.name+' '+R(src.val),()=>{applyState(JSON.parse(snap));save();render()});
}
function frequent(){
  const g={};
  hist().filter(i=>!i.rec&&i.n===1).forEach(i=>{const k=norm(i.name)+'|'+(i.who||''),o=g[k]||(g[k]={c:0,i});o.c++});
  return Object.values(g).filter(o=>o.c>=2).sort((a,b)=>b.c-a.c).slice(0,4).map(o=>o.i);
}
function renderChips(){
  const hs=hist(),w=$('chipsw');w.hidden=!hs.length;
  if(hs.length){
    $('chips').innerHTML='<button class="chip" data-rep="1" title="Repete o último gasto neste mês">↻ <span>'+esc(hs[0].name)+'</span></button>'+
      frequent().map(i=>'<button class="chip" data-f="'+i.id+'">+ <span>'+esc(i.name)+'</span><em>'+R(i.val)+'</em></button>').join('');
    $('chips').querySelector('[data-rep]').onclick=()=>addCopy(hs[0],cur);
    $('chips').querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>addCopy(S.items.find(i=>i.id===b.dataset.f),cur));
  }
  const c={};S.items.forEach(i=>{const k=i.name.trim();c[k]=(c[k]||0)+1});
  $('nms').innerHTML=Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,40).map(([n])=>'<option value="'+esc(n)+'">').join('');
}
$('nm').addEventListener('input',hint);
$('ct').addEventListener('change',()=>{ctManual=true;hint()});
$('qx').onclick=()=>$('qd').close();
['nm','vl'].forEach(id=>$(id).addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('ad').click()}}));

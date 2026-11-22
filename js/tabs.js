/* js/tabs.js - Navegação entre as abas (Blindado) */
var TAB = 'in';

function showTab(t) {
  TAB = t;
  
  // 1. Esconde todas as abas com segurança (verifica se a aba existe)
  document.querySelectorAll('.pane').forEach(p => {
    if (p) p.hidden = true;
  });
  
  // 2. Mostra a aba clicada (só se ela existir no HTML)
  const targetPane = document.getElementById('pane-' + t);
  if (targetPane) {
    targetPane.hidden = false;
  }
  
  // 3. Atualiza a cor dos botões do menu inferior
  document.querySelectorAll('.tabs button[data-tab]').forEach(btn => {
    if (btn) {
      if (btn.dataset.tab === t) btn.classList.add('on');
      else btn.classList.remove('on');
    }
  });

  // 4. Manda desenhar a tela novamente ao trocar de aba
  if (typeof render === 'function') render();
  
  // 5. Se for a aba de Opções, manda carregar os dados de configuração
  if (t === 'op') {
    if (typeof openCfg === 'function') openCfg();
    else if (typeof renderCfg === 'function') renderCfg();
  }
}

// Liga os botões do menu inferior à função de trocar de aba
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tabs button[data-tab]').forEach(btn => {
    btn.onclick = () => showTab(btn.dataset.tab);
  });
  
  // Inicia o app na aba Início
  showTab('in');
});

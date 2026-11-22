/* js/tabs.js - Navegação entre as abas (Blindado) */
var TAB = 'in';

function showTab(t) {
  TAB = t;
  
  // 1. Esconde todas as telas com segurança
  var panes = document.querySelectorAll('.pane');
  for (var i = 0; i < panes.length; i++) {
    if (panes[i]) panes[i].style.display = 'none'; // Usa display em vez de hidden
  }
  
  // 2. Mostra a tela selecionada
  var target = document.getElementById('pane-' + t);
  if (target) {
    target.style.display = 'block';
  }
  
  // 3. Atualiza a cor dos botões
  var btns = document.querySelectorAll('.tabs button[data-tab]');
  for (var j = 0; j < btns.length; j++) {
    if (btns[j].dataset.tab === t) {
      btns[j].classList.add('on');
    } else {
      btns[j].classList.remove('on');
    }
  }

  // 4. Manda desenhar a tela novamente
  if (typeof render === 'function') {
    try { render(); } catch (e) { console.warn('Erro no render:', e); }
  }
  
  // 5. Carrega as opções, se for a aba de opções
  if (t === 'op') {
    if (typeof openCfg === 'function') {
      try { openCfg(); } catch (e) { console.warn('Erro no openCfg:', e); }
    }
  }
}

// Liga os botões do menu inferior
window.addEventListener('DOMContentLoaded', function() {
  var btns = document.querySelectorAll('.tabs button[data-tab]');
  for (var i = 0; i < btns.length; i++) {
    btns[i].onclick = function() { showTab(this.dataset.tab); };
  }
  showTab('in');
});

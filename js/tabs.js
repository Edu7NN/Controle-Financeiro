var TAB = 'in';

function showTab(t) {
  TAB = t;
  document.querySelectorAll('.pane').forEach(p => { if (p) p.hidden = true; });
  const targetPane = document.getElementById('pane-' + t);
  if (targetPane) targetPane.hidden = false;
  
  document.querySelectorAll('.tabs button[data-tab]').forEach(btn => {
    if (btn) {
      if (btn.dataset.tab === t) btn.classList.add('on');
      else btn.classList.remove('on');
    }
  });

  if (typeof render === 'function') render();
  
  // Abre a tela de opções (Configurações)
  if (t === 'op' && typeof openCfg === 'function') {
    try { openCfg(); } catch(e) { console.warn("Erro ao abrir opções:", e); }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const eyeBtn = document.getElementById('eye');
  if (eyeBtn) {
    eyeBtn.onclick = () => {
      window.PRIV = !window.PRIV;
      localStorage.setItem("hidden", window.PRIV ? "1" : "0");
      if (typeof render === 'function') render();
      if (window.TAB === 'op' && typeof openCfg === 'function') openCfg();
    };
  }

  document.querySelectorAll('.tabs button[data-tab]').forEach(btn => {
    btn.onclick = () => showTab(btn.dataset.tab);
  });
});

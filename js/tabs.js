/* js/tabs.js */
var TAB = 'in';
var PRIV = localStorage.getItem("hidden") === "1";

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
  if (t === 'op' && typeof openCfg === 'function') openCfg();
}

document.addEventListener('DOMContentLoaded', () => {
  const eyeBtn = document.getElementById('eye');
  if (eyeBtn) {
    eyeBtn.onclick = () => {
      PRIV = !PRIV;
      localStorage.setItem("hidden", PRIV ? "1" : "0");
      if (typeof render === 'function') render();
      if (typeof openCfg === 'function' && TAB === 'op') openCfg();
    };
  }
  document.querySelectorAll('.tabs button[data-tab]').forEach(btn => {
    btn.onclick = () => showTab(btn.dataset.tab);
  });
  showTab('in');
});

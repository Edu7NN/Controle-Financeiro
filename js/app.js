/* js/app.js - Inicialização segura */
document.addEventListener('DOMContentLoaded', () => {
  // Função auxiliar para não deixar um erro quebrar o resto do app
  const safeInit = (name, fn) => { 
    try { if (typeof fn === 'function') fn(); } 
    catch(e) { console.warn('Erro ao iniciar ' + name + ':', e); } 
  };

  safeInit('Cloud', () => Cloud.init());
  safeInit('Lock', () => Lock.init());
  safeInit('Tabs', () => {
    if (typeof showTab === 'function') showTab('in');
  });
  safeInit('Render', () => {
    if (typeof render === 'function') render();
  });
});

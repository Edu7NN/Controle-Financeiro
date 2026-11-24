document.addEventListener('DOMContentLoaded', () => {
  const safeInit = (name, fn) => { 
    try { 
      if (typeof fn === 'function') fn(); 
    } catch(e) { 
      console.warn('Erro ao iniciar ' + name + ':', e); 
    } 
  };

  safeInit('Cloud', () => { if (typeof Cloud !== 'undefined' && Cloud.init) Cloud.init(); });
  safeInit('Lock', () => { if (typeof Lock !== 'undefined' && Lock.init) Lock.init(); });
  safeInit('Tabs', () => { if (typeof showTab === 'function') showTab('in'); });
  safeInit('Render', () => { if (typeof render === 'function') render(); });
});

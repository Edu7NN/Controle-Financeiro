/* js/state.js - Estado global blindado */
var S = {
  items: [], salary: {}, cards: [], goals: [], paid: {}, decisions: [],
  profile: { onboarded: true, rules: { reserve: 6, parc: 25, trav: 50 } },
  income: [], categories: []
};
var PRIV = false;
var TETO = 0.7;

try {
  // Tenta recuperar do localStorage, se existir
  const saved = localStorage.getItem('fin_state') || localStorage.getItem('fin_data');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed) S = Object.assign(S, parsed);
  }
  PRIV = localStorage.getItem('fin_priv') === '1';
  if (localStorage.getItem('fin_teto')) TETO = parseFloat(localStorage.getItem('fin_teto'));
} catch(e) { console.warn("Erro ao carregar state:", e); }

function save() {
  try {
    localStorage.setItem('fin_state', JSON.stringify(S));
    localStorage.setItem('fin_priv', PRIV ? '1' : '0');
    localStorage.setItem('fin_teto', TETO);
    // Se você usa outra chave no cloud.js, adicione aqui também
    localStorage.setItem('fin_sb_data', JSON.stringify(S)); 
  } catch(e) { console.warn("Erro ao salvar state:", e); }
}

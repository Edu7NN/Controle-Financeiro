/* js/utils.js — Funções utilitárias de formatação, datas e avisos */
const $ = s => document.getElementById(s);

function num(m) {
  if (!m || typeof m !== 'string' || !m.includes('-')) return 0; // Trava de segurança
  const parts = m.split('-');
  if (parts.length < 2) return 0;
  const y = Number(parts[0]);
  const mo = Number(parts[1]);
  if (isNaN(y) || isNaN(mo)) return 0;
  return y * 12 + (mo - 1);
}

function add(m, n) {
  if (!m || typeof m !== 'string' || !m.includes('-')) m = todayKey();
  let [y, mo] = m.split('-').map(Number);
  if (isNaN(y) || isNaN(mo)) { const d = new Date(); y = d.getFullYear(); mo = d.getMonth() + 1; }
  const d = new Date(y, mo - 1 + n, 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function todayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function R(v) {
  if (typeof PRIV !== 'undefined' && PRIV) return 'R$ ••••';
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function brDate(dStr) {
  if (!dStr) return '';
  const d = new Date(dStr);
  return isNaN(d) ? '' : d.toLocaleDateString('pt-BR');
}

const MS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const ML = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function sh(m) {
  if (!m || typeof m !== 'string' || !m.includes('-')) return '';
  const [y, mo] = m.split('-').map(Number);
  if (isNaN(y) || isNaN(mo) || mo < 1 || mo > 12) return '';
  return MS[mo - 1] + '/' + String(y).slice(2);
}

function lab(m) {
  if (!m || typeof m !== 'string' || !m.includes('-')) return '';
  const [y, mo] = m.split('-').map(Number);
  if (isNaN(y) || isNaN(mo) || mo < 1 || mo > 12) return '';
  return ML[mo - 1] + ' ' + y;
}

let toastTimer = null;
function toast(msg, act) {
  const box = document.getElementById('toast');
  if (!box) return alert(msg); 
  box.innerHTML = `<span>${msg}</span>${act ? '<button id="toast-act">Desfazer</button>' : ''}`;
  box.hidden = false;
  box.classList.add('show');
  if (act) {
    const btn = document.getElementById('toast-act');
    if (btn) btn.onclick = () => { act(); box.hidden = true; box.classList.remove('show'); };
  }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { box.hidden = true; box.classList.remove('show'); }, act ? 5000 : 3000);
}

function parseVal(str) {
  if (!str) return 0;
  return Number(String(str).replace(/\./g, '').replace(',', '.'));
}

function cssv(v) {
  return getComputedStyle(document.documentElement).getPropertyValue(v).trim();
}

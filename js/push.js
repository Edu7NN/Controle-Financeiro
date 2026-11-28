/* js/push.js — Gerenciamento de Notificações Push Locais */
window.Push = (() => {
  
  // Pede permissão ao usuário
  async function requestPermission() {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações.');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Dispara a notificação usando o Service Worker
  async function sendLocalNotification(title, body, url) {
    if (Notification.permission !== 'granted') return;
    
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification(title, {
      body: body,
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png',
      vibrate: [100, 50, 100],
      data: { url: url || '/' }
    });
  }

  // Verifica os dados do app e dispara alertas se necessário
  function checkAndNotify() {
    if (Notification.permission !== 'granted') return;

    const hojeStr = todayKey();
    
    // 1. Faturas vencendo
    if (typeof S !== 'undefined' && S.cards) {
      S.cards.forEach(c => {
        if (!c.due) return;
        const d = new Date();
        const diasAteVencer = c.due - d.getDate();
        
        if (diasAteVencer === 1) {
          sendLocalNotification('Fatura a vencer', `A fatura do cartão "${c.name}" vence amanhã!`, '/#gs');
        } else if (diasAteVencer === 0) {
          sendLocalNotification('Fatura vence hoje', `A fatura do cartão "${c.name}" vence hoje!`, '/#gs');
        }
      });
    }

    // 2. Teto de gastos
    if (typeof S !== 'undefined' && S.salary && S.salary[hojeStr]) {
      if (typeof health === 'function') {
        const h = health(hojeStr);
        if (h.p > 0.8 && h.p < 1) {
          sendLocalNotification('Atenção ao Teto', `Você já usou ${Math.round(h.p * 100)}% do seu teto de gastos e o mês não acabou.`, '/');
        }
      }
    }

    // 3. Metas atingidas
    if (typeof S !== 'undefined' && S.goals) {
      S.goals.forEach(g => {
        if (g.target > 0 && g.saved >= g.target) {
          const key = 'notified_goal_' + g.id;
          if (!localStorage.getItem(key)) {
            sendLocalNotification('Meta Atingida! 🎉', `Parabéns! Você atingiu a meta "${g.name}".`, '/');
            localStorage.setItem(key, '1'); // Evita notificar várias vezes
          }
        }
      });
    }
  }

  return { requestPermission, sendLocalNotification, checkAndNotify };
})();

// Checa as notificações quando o app carrega (com um pequeno atraso)
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      Push.checkAndNotify();
    }
  }, 3000);
});

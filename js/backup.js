/* js/backup.js - Gerenciamento de Backup e Restauração (Blindado) */
var Backup = (() => {
  const KS = 'fin_gh_token', KU = 'fin_gh_user', KL = 'fin_gh_last';
  const REPO_NAME = 'Controle-Financeiro';

  // 1. PROTEÇÃO: Valida se os dados são reais antes de deixar salvar
  function isValidState(state) {
    if (!state) return false;
    if (!Array.isArray(state.items)) return false;
    if (typeof state.salary !== 'object') return false;
    // Se tiver itens, verifica se algum está corrompido (sem mês)
    for (let i of state.items) {
      if (!i.st || typeof i.st !== 'string') return false;
    }
    return true;
  }

  // 2. PROTEÇÃO: Snapshot Local (Mantém as 5 últimas versões seguras no navegador)
  function saveLocalSnapshot(stateStr) {
    try {
      let snaps = JSON.parse(localStorage.getItem('fin_snapshots') || '[]');
      snaps.unshift({ date: new Date().toISOString(), data: stateStr });
      if (snaps.length > 5) snaps = snaps.slice(0, 5); // Mantém só 5
      localStorage.setItem('fin_snapshots', JSON.stringify(snaps));
    } catch(e) { console.warn("Erro ao salvar snapshot local", e); }
  }

  function getHeaders() {
    const token = localStorage.getItem(KS);
    return {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
  }

  function getConfig() {
    return { u: localStorage.getItem(KU), t: localStorage.getItem(KS) };
  }

  // Envia para o GitHub (só se for válido)
  async function sendToGitHub(state) {
    const cfg = getConfig();
    if (!cfg.u || !cfg.t) return;

    if (!isValidState(state)) {
      toast('Erro: Dados inválidos. Backup no GitHub bloqueado para proteger seu histórico.');
      return;
    }

    const stateStr = JSON.stringify(state);
    saveLocalSnapshot(stateStr);

    const url = `https://api.github.com/repos/${cfg.u}/${REPO_NAME}/contents/financeiro-latest.json`;
    const histUrl = `https://api.github.com/repos/${cfg.u}/${REPO_NAME}/contents/historico/financeiro-${todayKey()}.json`;
    
    try {
      // Pega o SHA do latest para poder atualizar
      let sha = null;
      let res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        sha = data.sha;
      }

      const body = {
        message: `Backup automático - ${new Date().toLocaleString('pt-BR')}`,
        content: btoa(unescape(encodeURIComponent(stateStr)))
      };
      if (sha) body.sha = sha;

      // 1. Atualiza o Latest
      await fetch(url, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) });
      
      // 2. Salva uma copia no histórico do dia
      let hSha = null;
      let hRes = await fetch(histUrl, { headers: getHeaders() });
      if (hRes.ok) {
        const hData = await hRes.json();
        hSha = hData.sha;
      }
      const hBody = { ...body, message: `Histórico diário - ${todayKey()}` };
      if (hSha) hBody.sha = hSha;
      await fetch(histUrl, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(hBody) });

      localStorage.setItem(KL, new Date().toISOString());
      console.log('Backup enviado com sucesso.');
    } catch (e) {
      console.warn('Falha no backup GitHub', e);
    }
  }

  // Lista os backups disponíveis no GitHub
  async function listHistory() {
    const cfg = getConfig();
    if (!cfg.u || !cfg.t) return [];
    const url = `https://api.github.com/repos/${cfg.u}/${REPO_NAME}/contents/historico`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) return [];
    const files = await res.json();
    return files.filter(f => f.name.endsWith('.json')).map(f => f.name.replace('financeiro-', '').replace('.json', ''));
  }

  // Restaura um backup específico
  async function restoreFromGitHub(dateStr) {
    const cfg = getConfig();
    if (!cfg.u || !cfg.t) return alert('Configure o GitHub primeiro.');
    
    const file = dateStr === 'latest' ? 'financeiro-latest.json' : `historico/financeiro-${dateStr}.json`;
    const url = `https://api.github.com/repos/${cfg.u}/${REPO_NAME}/contents/${file}`;
    
    try {
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error('Arquivo não encontrado no GitHub.');
      const data = await res.json();
      const stateStr = decodeURIComponent(escape(atob(data.content)));
      const state = JSON.parse(stateStr);
      
      if (!isValidState(state)) {
        throw new Error('O backup selecionado está corrompido.');
      }
      
      if (confirm('Isso vai substituir os dados atuais pelos dados do backup de ' + dateStr + '. Continuar?')) {
        applyState(state);
        localStorage.setItem(K, JSON.stringify(S));
        render();
        toast('Backup restaurado com sucesso!');
      }
    } catch (e) {
      alert('Erro ao restaurar: ' + e.message);
    }
  }

  // Retorna HTML para a tela de opções
  function section() {
    const cfg = getConfig();
    const last = localStorage.getItem(KL);
    return `
      <p class="empty" style="margin:0 0 8px">Faça backup dos seus dados. Se algo der errado, você pode voltar no tempo.</p>
      <div class="cr">
        <button id="b-exp">Exportar arquivo (.json)</button>
        <button id="b-imp" class="s">Restaurar de arquivo</button>
      </div>
      <hr style="margin:16px 0;border:none;border-top:1px solid var(--ln)">
      <h3>GitHub Backup</h3>
      <p class="empty">Último backup: <b>${last ? new Date(last).toLocaleString('pt-BR') : 'nunca'}</b></p>
      <div class="cr" style="grid-template-columns: 1fr 1fr;">
        <input id="gh-user" placeholder="Usuário GitHub" value="${cfg.u || ''}">
        <input id="gh-token" type="password" placeholder="Token (ghp_...)" value="${cfg.t || ''}">
      </div>
      <div class="cr" style="grid-template-columns: 1fr 1fr; margin-top:8px;">
        <button id="gh-save">Salvar e Enviar Backup</button>
        <button id="gh-restore-latest" class="s">Restaurar Latest</button>
      </div>
      <div style="margin-top:12px">
        <button id="gh-list" class="s" style="width:100%">Carregar Histórico de Datas</button>
        <div id="gh-history-list" style="margin-top:8px; display:flex; flex-wrap:wrap; gap:8px"></div>
      </div>
    `;
  }

  function bind(root) {
    const g = id => root.querySelector('#' + id);
    
    if(g('b-exp')) g('b-exp').onclick = () => {
      const blob = new Blob([JSON.stringify(S, null, 2)], {type: 'application/json'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'backup-financeiro-' + todayKey() + '.json';
      a.click();
    };

    if(g('gh-save')) g('gh-save').onclick = async () => {
      localStorage.setItem(KU, g('gh-user').value.trim());
      localStorage.setItem(KS, g('gh-token').value.trim());
      await sendToGitHub(S);
      openCfg();
    };

    if(g('gh-restore-latest')) g('gh-restore-latest').onclick = () => restoreFromGitHub('latest');

    if(g('gh-list')) g('gh-list').onclick = async () => {
      const listDiv = g('gh-history-list');
      listDiv.innerHTML = 'Carregando...';
      const dates = await listHistory();
      if (dates.length === 0) { listDiv.innerHTML = 'Nenhum histórico encontrado.'; return; }
      listDiv.innerHTML = dates.map(d => `<button class="s sm" onclick="Backup.restoreFromGitHub('${d}')">${d}</button>`).join('');
    };
  }

  return { section, bind, sendToGitHub, restoreFromGitHub, isValidState };
})();

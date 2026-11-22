/* js/ia.js — Camada 3: IA em cima do motor de fatos.
   - A IA nunca faz conta: recebe fatos prontos e, no chat, chama o simulador.
   - A chave da OpenAI fica na Edge Function, nunca aqui.
   - Só um resumo agregado sai do aparelho; nomes viram "Pessoa A".
   - Pode ser desligada em um clique.
*/
(() => {
  "use strict";
  const IA = (window.IA = {});
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n) => (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  IA.fmt = fmt;

  // ---------------------------------------------------------------
  // ADAPTADOR — Integrado com as variáveis do config.js e cloud.js
  // ---------------------------------------------------------------
  const cfg = () => {
    const u = typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : (window.SUPABASE_URL || "");
    const k = typeof SUPABASE_KEY !== 'undefined' ? SUPABASE_KEY : (window.SUPABASE_KEY || window.SUPABASE_ANON || "");
    return { url: u.replace(/\/$/, ""), anon: k };
  };

  IA.token = function () {
    try {
      const ses = JSON.parse(localStorage.getItem('fin_sb') || 'null');
      if (ses && ses.at) return ses.at;
    } catch (e) { 
      console.warn("Erro ao ler token do cloud.js", e); 
    }
    return null;
  };

  IA.buildFacts = function () {
    if (typeof window.buildIaFacts === "function") {
      try { return window.buildIaFacts(); } catch (e) { console.warn("buildIaFacts falhou", e); }
    }
    const out = { gerado_em: new Date().toISOString(), perfil: null, regras: null, decisoes: null, alertas: [], metas: [] };
    try {
      const ds = window.decisionSummary?.() || {};
      out.perfil   = ds.perfil   ?? null;
      out.regras   = ds.regras   ?? null;
      out.decisoes = ds.decisoes ?? null;
    } catch {}
    return out;
  };

  IA.runSimulator = async function (args) {
    const fn = window.simularCompra || window.simulate || window.Simulator?.run || window.simulador;
    if (typeof fn === "function") {
      try { 
        const res = await fn(args); 
        return res;
      } catch (e) { 
        console.error("Erro no simulador:", e);
        return { erro: "O simulador deu erro interno: " + String(e) }; 
      }
    }
    console.warn("IA.runSimulator: Função não encontrada. window.simularCompra existe?", typeof window.simularCompra);
    return { indisponivel: true, mensagem: "Simulador não encontrado. O app precisa ser atualizado." };
  };
  // ---------------------------------------------------------------

  IA.ativo    = () => localStorage.getItem("ia.ativo") !== "0";
  IA.setAtivo = (v) => localStorage.setItem("ia.ativo", v ? "1" : "0");

  function pseudonimizar(facts) {
    const nomes = new Set();
    (function walk(o) {
      if (!o || typeof o !== "object") return;
      if (Array.isArray(o)) return o.forEach(walk);
      for (const [k, v] of Object.entries(o)) {
        if (/^(pessoa|nome_pessoa|de_quem|nome)$/i.test(k) && typeof v === "string" && v.trim()) nomes.add(v.trim());
        walk(v);
      }
    })(facts);
    const map = new Map([...nomes].sort().map((n, i) => [n, "Pessoa " + String.fromCharCode(65 + i)]));
    const aplicar = (o) => {
      if (typeof o === "string") { let s = o; for (const [a, b] of map) s = s.split(a).join(b); return s; }
      if (Array.isArray(o)) return o.map(aplicar);
      if (o && typeof o === "object") { const r = {}; for (const [k, v] of Object.entries(o)) r[k] = aplicar(v); return r; }
      return o;
    };
    return aplicar(facts);
  }

  IA.call = async function (payload) {
    const { url, anon } = cfg();
    const token = IA.token();
    if (!url || !anon) throw new Error("Supabase não configurado em js/config.js");
    if (!token) throw new Error("Entre no banco online (Opções > Banco online) para usar a IA.");
    if (!navigator.onLine) throw new Error("Sem internet. A IA só funciona conectada.");
    
    const r = await fetch(url + "/functions/v1/ia", {
      method: "POST",
      headers: { "Authorization": "Bearer " + token, "apikey": anon, "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    
    const data = await r.json().catch(() => ({}));
    
    if (r.status === 429) throw new Error("Limite diário de IA atingido. Volte amanhã.");
    
    if (!r.ok) {
      const detalhe = data.detail ? `OpenAI: ${data.detail}` : (data.error || ("Falha " + r.status));
      throw new Error(detalhe);
    }
    return data;
  };

  // -------- Leitura do mês --------
  IA.gerarLeitura = async function (forcar) {
    const out = $("#ia-out"); if (!out) return;
    if (!IA.ativo()) { out.innerHTML = '<p class="empty">IA desligada em Opções.</p>'; return; }
    
    let mes = new Date().toISOString().slice(0, 7);
    try { if (typeof window.mesExibido === 'function') mes = window.mesExibido(); } catch {}
    
    const key = "ia.leitura." + mes;
    if (!forcar) {
      const cache = localStorage.getItem(key);
      if (cache) { try { return IA.renderLeitura(JSON.parse(cache)); } catch {} }
    }
    
    out.innerHTML = '<p class="empty">Lendo os fatos…</p>';
    try {
      const facts = pseudonimizar(IA.buildFacts());
      const res   = await IA.call({ mode: "leitura", facts });
      localStorage.setItem(key, JSON.stringify(res.leitura));
      IA.renderLeitura(res.leitura, res.usage);
      
      // Mostra o botão de ocultar quando gerar com sucesso
      const toggleBtn = $("#ia-toggle");
      if (toggleBtn) toggleBtn.style.display = "inline-block";
      
    } catch (e) {
      out.innerHTML = '<p class="empty" style="color:var(--bd)">' + esc(e.message) + "</p>";
    }
  };

  const labelAction = (t) => ({
    criar_meta: "Criar meta", criar_provisao: "Criar provisão",
    mensagem_cobranca: "Copiar cobrança", abrir_simulador: "Abrir simulador",
  }[t] || "Aplicar");

  IA.renderLeitura = function (l, usage) {
    const out = $("#ia-out"); if (!out) return;
    
    const formatarTexto = (txt) => {
      if (!txt) return "";
      let html = esc(txt);
      html = html.replace(/(R\$\s?[\d.,]+)/g, '<strong class="ia-hl-money">$1</strong>');
      html = html.replace(/([A-Z][a-z]{2}\/\d{2})/g, '<span class="ia-hl-date">$1</span>');
      return html;
    };

    if (!l || !Array.isArray(l.prioridades) || !l.prioridades.length) {
      out.innerHTML = '<p class="empty">Sem prioridades relevantes nos fatos deste mês.</p>';
      return;
    }

    const pri = l.prioridades.slice(0, 3).map((p, i) => {
      const act = p.action ? `<button class="ia-act" data-i="${i}">${esc(labelAction(p.action.tipo))}</button>` : "";
      return `<div class="ia-pri-card">
        <h3>${esc(p.titulo || "Prioridade " + (i + 1))}</h3>
        <p class="ia-pri-desc">${formatarTexto(p.explicacao)}</p>
        
        <div class="ia-meta-box">
          <div class="ia-meta-item"><span>Impacto</span><strong>${fmt(p.impacto_reais)}</strong></div>
          <div class="ia-meta-item"><span>Ação</span><strong>${esc(p.acao || "-")}</strong></div>
          <div class="ia-meta-item"><span>Prazo</span><strong class="ia-hl-date">${esc(p.prazo || "-")}</strong></div>
        </div>
        ${act}</div>`;
    }).join("");
    
    out.innerHTML = `<p class="ia-resumo">${formatarTexto(l.resumo)}</p>${pri}` +
      (usage ? `<p class="empty" style="margin:12px 0 0;font-size:11px;text-align:right">${usage.prompt_tokens || 0} + ${usage.completion_tokens || 0} tokens</p>` : "");
      
    out.querySelectorAll(".ia-act").forEach((b) => {
      b.addEventListener("click", () => IA.applyAction(l.prioridades[Number(b.dataset.i)].action));
    });

    // Garante que o botão de ocultar está visível quando renderiza algo
    const toggleBtn = $("#ia-toggle");
    if (toggleBtn) toggleBtn.style.display = "inline-block";
  };

  IA.applyAction = async function (a) {
    if (!a || !a.tipo) return;
    const p = a.params || {};
    try {
      if (a.tipo === "criar_meta") {
        const fn = window.openGoalDialog || window.abrirMeta || window.Metas?.nova;
        if (typeof fn === "function") return fn(p);
        return alert("Crie em Opções > Metas: " + (p.nome || ""));
      }
      if (a.tipo === "criar_provisao") {
        return alert(`Sugestão: separar ${fmt(p.valor_mensal)}/mês para "${p.nome || "reserva"}".`);
      }
      if (a.tipo === "mensagem_cobranca") {
        const msg = `Oi! Passando para lembrar do valor de ${fmt(p.valor)}${p.vencimento ? " (vence " + p.vencimento + ")" : ""}. Se já pagou, desconsidera. Obrigado!`;
        if (navigator.share) { try { return await navigator.share({ text: msg }); } catch {} }
        await navigator.clipboard?.writeText(msg).catch(() => {});
        return alert("Mensagem copiada:\n\n" + msg);
      }
      if (a.tipo === "abrir_simulador") {
        const fn = window.abrirSimulador || window.openSimulator;
        if (typeof fn === "function") return fn(p);
        return alert(`Abra Análises > Simulador e teste ${fmt(p.valor)} em ${p.parcelas || 1}x.`);
      }
    } catch (e) { console.warn(e); }
  };

  // -------- Chat --------
  IA.hist = [];
  IA.abrirChat = function () {
    if (!IA.ativo()) return alert("IA desligada em Opções.");
    IA.facts = pseudonimizar(IA.buildFacts());
    IA.hist = [];
    
    const msgs = $("#ia-msgs"); 
    if (msgs) {
      msgs.innerHTML = `<div class="ia-msg a">Olá! Eu sou o assistente do seu Controle Financeiro. Já li os seus alertas e dados deste mês. Como posso ajudar?</div>`;
    }
    
    const dlg = $("#ia-dlg");
    if (dlg) {
      dlg.showModal();
      setTimeout(() => { const inp = $("#ia-in"); if(inp) inp.focus(); }, 100);
    }
  };

  IA.enviarChat = async function (texto) {
    texto = String(texto || "").trim();
    if (!texto) return;
    const msgs = $("#ia-msgs"); if (!msgs) return;
    
    const add = (role, txt) => {
      const b = document.createElement("div");
      b.className = "ia-msg " + (role === "user" ? "u" : role === "assistant" ? "a" : "s");
      b.textContent = txt; 
      msgs.appendChild(b); 
      msgs.scrollTop = msgs.scrollHeight;
      return b;
    };
    
    add("user", texto);
    IA.hist.push({ role: "user", content: texto });
    
    const input = $("#ia-in");   if (input) input.value = "";
    const btn   = $("#ia-send"); if (btn) btn.disabled = true;

    const typing = document.createElement("div");
    typing.className = "typing-indicator";
    typing.innerHTML = "<span></span><span></span><span></span>";
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;
    
    try {
      for (let i = 0; i < 5; i++) {
        const res = await IA.call({ mode: "chat", facts: IA.facts, messages: IA.hist });
        
        if (res.needs_tool) {
          IA.hist.push(res.assistant_message);
          let result;
          
          try {
            // Se a IA pediu para criar um gasto
            if (res.needs_tool.name === "criar_gasto") {
              result = await window.criarGastoPorIA(res.needs_tool.args);
            } 
            // Se a IA pediu para simular uma compra
            else if (res.needs_tool.name === "simular_compra") {
              result = await IA.runSimulator(res.needs_tool.args);
            } 
            // Fallback para ferramentas desconhecidas
            else {
              result = { erro: "Ferramenta não reconhecida." };
            }
          } catch (toolError) {
            // Se a ferramenta der qualquer erro de sintaxe ou execução, captura aqui
            console.error("Erro na execução da ferramenta:", toolError);
            result = { erro: "Falha interna ao executar a ação: " + String(toolError) };
          }

          // Devolve o resultado para a IA continuar a conversa
          IA.hist.push({ role: "tool", tool_call_id: res.needs_tool.tool_call_id, content: JSON.stringify(result) });
          continue;
        }
        
        if (res.reply) {
          typing.remove();
          IA.hist.push({ role: "assistant", content: res.reply });
          add("assistant", res.reply);
          return;
        }
        break;
      }
      typing.remove();
      add("s", "Não consegui completar. Tente de novo.");
    } catch (e) {
      typing.remove();
      add("s", "Erro: " + e.message);
    } finally { 
      if (btn) btn.disabled = false; 
      if (input) input.focus();
    }
  };

  // -------- Ligação com a UI --------
  IA.init = function () {
    const gen = $("#ia-gen");
    if (gen) gen.addEventListener("click", () => IA.gerarLeitura(true));
    const open = $("#ia-open");
    if (open) open.addEventListener("click", () => IA.abrirChat());
    const x = $("#ia-x");
    if (x) x.addEventListener("click", () => $("#ia-dlg")?.close());
    const send = $("#ia-send");
    if (send) send.addEventListener("click", () => IA.enviarChat($("#ia-in")?.value));
    const inp = $("#ia-in");
    if (inp) inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); IA.enviarChat(inp.value); } });
    
    // Lógica do botão Ocultar/Mostrar Leitura
    const toggleBtn = $("#ia-toggle");
    const outDiv = $("#ia-out");
    if (toggleBtn && outDiv) {
      toggleBtn.addEventListener("click", () => {
        const isHidden = outDiv.style.display === "none";
        outDiv.style.display = isHidden ? "block" : "none";
        toggleBtn.textContent = isHidden ? "Ocultar" : "Mostrar";
      });
    }

    let mes = new Date().toISOString().slice(0, 7);
    try { if (typeof window.mesExibido === 'function') mes = window.mesExibido(); } catch {}
    
    const cache = localStorage.getItem("ia.leitura." + mes);
    if (cache && outDiv) { 
      try { IA.renderLeitura(JSON.parse(cache)); } catch {} 
    }
  };

  document.addEventListener("DOMContentLoaded", IA.init);
})();

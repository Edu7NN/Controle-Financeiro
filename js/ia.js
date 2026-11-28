/* js/ia.js — Camada 3 */
(() => {
  "use strict";
  const IA = (window.IA = {});
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n) => (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // NOVO: Função para formatar o Markdown básico da IA em HTML seguro
  function formatarTextoIA(texto) {
    if (!texto) return "";
    let html = esc(texto);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Negrito
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>'); // Itálico
    html = html.replace(/\n/g, '<br>'); // Quebra de linha
    return html;
  }

  const cfg = () => {
    const u = typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : (window.SUPABASE_URL || "");
    const k = typeof SUPABASE_KEY !== 'undefined' ? SUPABASE_KEY : (window.SUPABASE_KEY || window.SUPABASE_ANON || "");
    return { url: u.replace(/\/$/, ""), anon: k };
  };

  IA.token = function () { try { const ses = JSON.parse(localStorage.getItem('fin_sb') || 'null'); if (ses && ses.at) return ses.at; } catch (e) {} return null; };
  IA.buildFacts = function () { if (typeof window.buildIaFacts === "function") { try { return window.buildIaFacts(); } catch (e) {} } return {}; };
  
  function pseudonimizar(facts) {
    const nomes = new Set();
    (function walk(o) {
      if (!o || typeof o !== "object") return;
      if (Array.isArray(o)) return o.forEach(walk);
      for (const [k, v] of Object.entries(o)) { if (/^(pessoa|nome_pessoa|de_quem|nome)$/i.test(k) && typeof v === "string" && v.trim()) nomes.add(v.trim()); walk(v); }
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
    const { url, anon } = cfg(), token = IA.token();
    if (!url || !anon) throw new Error("Supabase não configurado.");
    if (!token) throw new Error("Entre no banco online para usar a IA.");
    if (!navigator.onLine) throw new Error("Sem internet.");
    const r = await fetch(url + "/functions/v1/ia", { method: "POST", headers: { "Authorization": "Bearer " + token, "apikey": anon, "content-type": "application/json" }, body: JSON.stringify(payload) });
    const data = await r.json().catch(() => ({}));
    if (r.status === 429) throw new Error("Limite diário atingido.");
    if (!r.ok) throw new Error(data.detail ? `OpenAI: ${data.detail}` : (data.error || ("Falha " + r.status)));
    return data;
  };

  IA.gerarLeitura = async function (forcar) {
    const out = $("#ia-out"); if (!out) return;
    let mes = new Date().toISOString().slice(0, 7);
    try { if (typeof window.mesExibido === 'function') mes = window.mesExibido(); } catch {}
    const key = "ia.leitura." + mes;
    if (!forcar) { const cache = localStorage.getItem(key); if (cache) { try { return IA.renderLeitura(JSON.parse(cache)); } catch {} } }
    out.innerHTML = '<p class="empty">Lendo os fatos…</p>';
    try {
      const facts = pseudonimizar(IA.buildFacts());
      const res = await IA.call({ mode: "leitura", facts });
      localStorage.setItem(key, JSON.stringify(res.leitura));
      IA.renderLeitura(res.leitura, res.usage);
      
      // Mostra o botão de ocultar
      const toggleBtn = $("#ia-toggle");
      if (toggleBtn) {
        toggleBtn.style.display = "inline-block";
        toggleBtn.textContent = "Ocultar";
      }
      out.style.display = "block";
      
    } catch (e) { out.innerHTML = '<p class="empty" style="color:var(--bd)">' + esc(e.message) + "</p>"; }
  };

  IA.renderLeitura = function (l, usage) {
    const out = $("#ia-out"); if (!out) return;
    const formatarTexto = (txt) => { if (!txt) return ""; let html = esc(txt); html = html.replace(/(R\$\s?[\d.,]+)/g, '<strong class="ia-hl-money">$1</strong>').replace(/([A-Z][a-z]{2}\/\d{2})/g, '<span class="ia-hl-date">$1</span>'); return html; };
    if (!l || !Array.isArray(l.prioridades) || !l.prioridades.length) { out.innerHTML = '<p class="empty">Sem prioridades relevantes nos fatos deste mês.</p>'; return; }
    const pri = l.prioridades.slice(0, 3).map((p, i) => {
      const act = p.action ? `<button class="ia-act" data-i="${i}">Aplicar</button>` : "";
      return `<div class="ia-pri-card"><h3>${esc(p.titulo || "Prioridade " + (i + 1))}</h3><p class="ia-pri-desc">${formatarTexto(p.explicacao)}</p><div class="ia-meta-box"><div class="ia-meta-item"><span>Impacto</span><strong>${fmt(p.impacto_reais)}</strong></div><div class="ia-meta-item"><span>Ação</span><strong>${esc(p.acao || "-")}</strong></div><div class="ia-meta-item"><span>Prazo</span><strong class="ia-hl-date">${esc(p.prazo || "-")}</strong></div></div>${act}</div>`;
    }).join("");
    out.innerHTML = `<p class="ia-resumo">${formatarTexto(l.resumo)}</p>${pri}`;
  };

  IA.abrirChat = function () {
    IA.facts = pseudonimizar(IA.buildFacts()); IA.hist = [];
    const msgs = $("#ia-msgs"); if (msgs) msgs.innerHTML = `<div class="ia-msg a">Olá! Já li os seus dados e alertas deste mês. Como posso ajudar?</div>`;
    const dlg = $("#ia-dlg"); if (dlg) { dlg.showModal(); setTimeout(() => { const inp = $("#ia-in"); if(inp) inp.focus(); }, 100); }
  };

  IA.enviarChat = async function (texto) {
    texto = String(texto || "").trim(); if (!texto) return;
    const msgs = $("#ia-msgs"); if (!msgs) return;
    
    // ALTERAÇÃO AQUI: Aplica a formatação HTML apenas nas mensagens da IA
    const add = (role, txt) => { 
      const b = document.createElement("div"); 
      b.className = "ia-msg " + (role === "user" ? "u" : role === "assistant" ? "a" : "s"); 
      if (role === "assistant") {
        b.innerHTML = formatarTextoIA(txt); 
      } else {
        b.textContent = txt; 
      }
      msgs.appendChild(b); 
      msgs.scrollTop = msgs.scrollHeight; 
      return b; 
    };

    add("user", texto); IA.hist.push({ role: "user", content: texto });
    const input = $("#ia-in"); if (input) input.value = "";
    const btn = $("#ia-send"); if (btn) btn.disabled = true;
    const typing = document.createElement("div"); typing.className = "typing-indicator"; typing.innerHTML = "<span></span><span></span><span></span>"; msgs.appendChild(typing); msgs.scrollTop = msgs.scrollHeight;
    
    try {
      for (let i = 0; i < 5; i++) {
        const res = await IA.call({ mode: "chat", facts: IA.facts, messages: IA.hist });
        if (res.needs_tool) {
          IA.hist.push(res.assistant_message);
          let result = { erro: "Ferramenta não encontrada." };
          if (res.needs_tool.name === "simular_compra") { try { result = await window.simularCompra(res.needs_tool.args); } catch (e) { result = { erro: String(e) }; } }
          IA.hist.push({ role: "tool", tool_call_id: res.needs_tool.tool_call_id, content: JSON.stringify(result) });
          continue;
        }
        if (res.reply) { typing.remove(); IA.hist.push({ role: "assistant", content: res.reply }); add("assistant", res.reply); return; }
        break;
      }
      typing.remove(); add("s", "Não consegui completar.");
    } catch (e) { typing.remove(); add("s", "Erro: " + e.message); } finally { if (btn) btn.disabled = false; if (input) input.focus(); }
  };

  IA.init = function () {
    const gen = $("#ia-gen"); if (gen) gen.addEventListener("click", () => IA.gerarLeitura(true));
    const open = $("#ia-open"); if (open) open.addEventListener("click", () => IA.abrirChat());
    const x = $("#ia-x"); if (x) x.addEventListener("click", () => $("#ia-dlg")?.close());
    const send = $("#ia-send"); if (send) send.addEventListener("click", () => IA.enviarChat($("#ia-in")?.value));
    const inp = $("#ia-in"); if (inp) inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); IA.enviarChat(inp.value); } });
    
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
      try { 
        IA.renderLeitura(JSON.parse(cache)); 
        if (toggleBtn) toggleBtn.style.display = "inline-block";
      } catch {} 
    }
  };
  document.addEventListener("DOMContentLoaded", IA.init);
})();

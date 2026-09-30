/* Kuper Media — chat de la orb.
   Click en la orb → abre chat con IA. Siempre hay botón para seguir en WhatsApp.
   Si window.KUPER_CHAT_ENDPOINT está vacío o falla, responde con un FAQ local (gratis, sin backend). */
(() => {
  const CFG = {
    get endpoint() { return window.KUPER_CHAT_ENDPOINT || '/chat.php'; },
    wa: '34694221737',
    maxHistory: 10,
    timeoutMs: 20000,
  };

  const orb = document.getElementById('orb');
  if (!orb) return;

  // ── Estilos ──
  const css = `
  #kchat{position:fixed;right:14px;bottom:104px;width:370px;height:min(560px,calc(100vh - 130px));z-index:300;
    display:flex;flex-direction:column;overflow:hidden;font-family:-apple-system,sans-serif;color:#fff;
    background:rgba(8,12,20,.82);border:1px solid rgba(255,255,255,.18);border-radius:22px;
    backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);box-shadow:0 20px 60px rgba(0,0,0,.5);
    opacity:0;transform:translateY(14px) scale(.97);pointer-events:none;transition:opacity .25s ease,transform .25s ease;
    -webkit-user-select:text;user-select:text}
  #kchat.open{opacity:1;transform:none;pointer-events:auto}
  body.kchat-open #orb-tooltip{display:none}
  #kchat header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.12)}
  #kchat header b{font-size:14px;letter-spacing:.02em}
  #kchat header small{display:block;font-size:11px;color:rgba(255,255,255,.55);margin-top:2px}
  #kchat header button{background:none;border:0;color:#fff;font-size:22px;line-height:1;cursor:pointer;padding:4px 8px}
  #kchat-list{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;
    touch-action:pan-y;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
  .kmsg{max-width:85%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}
  .kmsg.bot{align-self:flex-start;background:rgba(255,255,255,.1);border-bottom-left-radius:4px}
  .kmsg.user{align-self:flex-end;background:linear-gradient(135deg,#9b6dff,#7c4dff);border-bottom-right-radius:4px}
  .kmsg.typing{opacity:.6}
  #kchat-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 10px}
  #kchat-chips button{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);color:#fff;border-radius:999px;
    padding:6px 12px;font-size:12px;cursor:pointer;font-family:inherit}
  #kchat-chips button:hover{background:rgba(255,255,255,.16)}
  #kchat-wa{margin:0 16px 10px;display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border-radius:12px;
    background:#25d366;color:#04210f;font-weight:700;font-size:13px;text-decoration:none}
  #kchat form{display:flex;gap:8px;padding:12px 16px 16px;border-top:1px solid rgba(255,255,255,.12)}
  #kchat input{flex:1;min-width:0;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:999px;
    color:#fff;font:16px -apple-system,sans-serif;padding:10px 16px;outline:none;-webkit-user-select:text;user-select:text;touch-action:manipulation}
  #kchat input:focus{border-color:#fff}
  #kchat form button{background:#fff;color:#0a0e16;border:0;border-radius:999px;padding:0 18px;font-weight:800;font-size:13px;cursor:pointer}
  #kchat form button:disabled{opacity:.5}
  .klead{align-self:stretch;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:8px}
  .klead p{margin:0;font-size:13px;line-height:1.4}
  .klead input{width:100%;box-sizing:border-box;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.2);border-radius:12px;color:#fff;font:16px -apple-system,sans-serif;padding:10px 12px;outline:none}
  .klead input:focus{border-color:#fff}
  .klead .hp{position:absolute;left:-9999px;opacity:0;height:0;width:0}
  .klead .row{display:flex;gap:8px}
  .klead button{border:0;border-radius:12px;padding:10px 14px;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit}
  .klead .go{flex:1;background:#fff;color:#0a0e16}
  .klead .skip{background:none;color:rgba(255,255,255,.6);font-weight:500}
  .klead .err{color:#ff8a8a;font-size:12px;min-height:0}
  @media (max-width:768px){#kchat{inset:0;width:auto;height:auto;border-radius:0;right:0;bottom:0}}
  `;
  const st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  // ── DOM ──
  const root = document.createElement('div');
  root.id = 'kchat';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'Chat con Kuper AI');
  root.innerHTML = `
    <header>
      <div><b>Kuper AI</b><small>Resuelve dudas al instante · Gratis · Guardamos la conversación para atenderte mejor</small></div>
      <button type="button" id="kchat-close" aria-label="Cerrar chat">×</button>
    </header>
    <div id="kchat-list" aria-live="polite"></div>
    <div id="kchat-chips"></div>
    <a id="kchat-wa" target="_blank" rel="noopener">Continuar en WhatsApp</a>
    <form autocomplete="off">
      <input type="text" name="q" placeholder="Escribe tu pregunta…" maxlength="500" aria-label="Tu mensaje">
      <button type="submit">Enviar</button>
    </form>`;
  document.body.appendChild(root);

  const list = root.querySelector('#kchat-list');
  const chips = root.querySelector('#kchat-chips');
  const form = root.querySelector('form');
  const input = form.querySelector('input');
  const sendBtn = form.querySelector('button');
  const waLink = root.querySelector('#kchat-wa');

  // El sitio usa scroll-jacking en window (wheel/touch/teclado): el chat no debe dispararlo.
  ['wheel', 'touchstart', 'touchmove', 'touchend', 'keydown', 'mousemove', 'click'].forEach(ev =>
    root.addEventListener(ev, e => e.stopPropagation(), { passive: ev !== 'touchmove' })
  );

  // ── Estado ──
  const history = []; // {role:'user'|'assistant', content}
  const sid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  let busy = false;
  let greeted = false;

  function waUrl() {
    const users = history.filter(m => m.role === 'user').map(m => m.content);
    const base = 'Hola Kuper Media, vengo de la web.';
    const text = users.length ? `${base} Mi consulta: ${users.slice(-3).join(' | ')}` : base;
    return `https://wa.me/${CFG.wa}?text=${encodeURIComponent(text)}`;
  }
  function refreshWa() { waLink.href = waUrl(); }

  function addMsg(role, text, extra) {
    const d = document.createElement('div');
    d.className = 'kmsg ' + (role === 'user' ? 'user' : 'bot') + (extra ? ' ' + extra : '');
    d.textContent = text;
    list.appendChild(d);
    list.scrollTop = list.scrollHeight;
    return d;
  }

  // ── FAQ local (fallback gratis) ──
  const FAQ = [
    { k: /precio|cuesta|costo|cotiz|presupuesto|tarifa|cu[aá]nto/, a: 'Cada proyecto se cotiza según alcance (páginas, funciones, integraciones). Cuéntanos qué necesitas por WhatsApp y te enviamos una propuesta.' },
    { k: /agente|ia\b|inteligencia|chatbot|bot|automat/, a: 'Creamos agentes de IA a medida: atención al cliente, ventas y operaciones, entrenados con los datos de tu negocio y conectados a WhatsApp, web o tu CRM. Nada de plantillas genéricas.' },
    { k: /web|p[aá]gina|sitio|tienda|shopify|wordpress|ecommerce|e-commerce/, a: 'Diseñamos y desarrollamos sitios web a medida y tiendas online (Shopify, WordPress o código propio), optimizados para velocidad, conversión y SEO.' },
    { k: /seo|google|posicion|geo/, a: 'Hacemos SEO y GEO: que te encuentren en Google y también en buscadores de IA como ChatGPT o Perplexity.' },
    { k: /brand|marca|logo|identidad|dise[nñ]o gr/, a: 'Desarrollamos branding e identidad visual: estrategia, logotipo y sistema de marca reconocible.' },
    { k: /redes|instagram|social|marketing|ads|publicidad|campa/, a: 'Gestionamos redes sociales y marketing digital con campañas medibles (Google Ads, Meta, TikTok).' },
    { k: /d[oó]nde|ubicaci|ciudad|madrid|m[eé]xico|cdmx|remot/, a: 'Tenemos equipo en Madrid y Ciudad de México, y trabajamos de forma remota con clientes de cualquier país.' },
    { k: /tiempo|cu[aá]nto tarda|plazo|entrega/, a: 'Depende del alcance: una web corporativa suele tomar unas semanas. Te damos un calendario concreto en la propuesta.' },
    { k: /hola|buenas|hey|qu[eé] tal/, a: '¡Hola! Soy Kuper AI. Pregúntame por webs, agentes de IA, branding, SEO o marketing.' },
  ];
  function localReply(q) {
    const t = q.toLowerCase();
    const hit = FAQ.find(f => f.k.test(t));
    return (hit ? hit.a : 'Cuéntame un poco más de tu proyecto y te oriento. Si prefieres hablar con el equipo, tienes el botón de WhatsApp.');
  }

  // ── Llamada al backend (Cloudflare Worker, ver worker.js) ──
  async function remoteReply() {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), CFG.timeoutMs);
    try {
      const r = await fetch(CFG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sid, messages: history.slice(-CFG.maxHistory) }),
        signal: ctrl.signal,
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      if (!data.reply) throw new Error('empty');
      return String(data.reply);
    } finally { clearTimeout(to); }
  }


  // ── Captura de lead ──
  let leadShown = false;
  function showLead() {
    if (leadShown) return;
    leadShown = true;
    const box = document.createElement('form');
    box.className = 'klead';
    box.innerHTML = `
      <p>¿Quieres que alguien del equipo te escriba con una propuesta? Déjanos tus datos.</p>
      <input type="text" name="name" placeholder="Tu nombre" maxlength="80" autocomplete="name" required>
      <input type="tel" name="phone" placeholder="Tu WhatsApp (con código de país)" maxlength="20" autocomplete="tel" required>
      <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="err"></div>
      <div class="row"><button type="submit" class="go">Que me contacten</button><button type="button" class="skip">Ahora no</button></div>`;
    list.appendChild(box);
    list.scrollTop = list.scrollHeight;
    const err = box.querySelector('.err');
    box.querySelector('.skip').addEventListener('click', () => box.remove());
    box.addEventListener('submit', async e => {
      e.preventDefault();
      const name = box.name.value.trim(), phone = box.phone.value.trim();
      if (phone.replace(/\D/g, '').length < 8) { err.textContent = 'Revisa tu número de WhatsApp.'; return; }
      const go = box.querySelector('.go'); go.disabled = true; go.textContent = 'Enviando…';
      try {
        const r = await fetch(CFG.endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sid, lead: { name, phone, website: box.website.value }, messages: history.slice(-CFG.maxHistory) }),
        });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        box.remove();
        const msg = `¡Gracias, ${name.split(' ')[0]}! Te escribimos pronto por WhatsApp. Mientras tanto, sigo aquí para lo que necesites.`;
        history.push({ role: 'assistant', content: msg });
        addMsg('bot', msg);
      } catch (x) {
        console.warn('Kuper chat: lead', x);
        err.textContent = 'No pudimos enviarlo. Escríbenos por el botón de WhatsApp.';
        go.disabled = false; go.textContent = 'Que me contacten';
      }
    });
  }

  async function send(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true; sendBtn.disabled = true;
    chips.style.display = 'none';
    history.push({ role: 'user', content: text });
    addMsg('user', text);
    refreshWa();
    const typing = addMsg('bot', 'Escribiendo…', 'typing');
    let reply;
    const t0 = Date.now();
    if (CFG.endpoint) {
      try { reply = await remoteReply(); }
      catch (e) { console.warn('Kuper chat: fallo al llamar al backend', e); reply = localReply(text); }
      // Ritmo humano: mínimo 1.8 s + ~15 ms por carácter (máx 4 s) mostrando "Escribiendo…"
      const minMs = Math.min(4000, 1800 + reply.length * 15);
      const wait = minMs - (Date.now() - t0);
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
    } else {
      await new Promise(r => setTimeout(r, 1500));
      reply = localReply(text);
    }
    typing.remove();
    history.push({ role: 'assistant', content: reply });
    addMsg('bot', reply);
    const nUser = history.filter(m => m.role === 'user').length;
    if (CFG.endpoint && (nUser >= 2 || /precio|cuesta|cotiz|presupuesto|contrat|propuesta/i.test(text))) setTimeout(showLead, 600);
    busy = false; sendBtn.disabled = false;
    if (!matchMedia('(max-width:768px)').matches) input.focus();
  }

  function greet() {
    if (greeted) return;
    greeted = true;
    addMsg('bot', '¡Hola! Soy Kuper AI. Puedo resolver tus dudas sobre diseño web, agentes de IA, branding, SEO y marketing. ¿En qué te ayudo?');
    ['¿Qué servicios ofrecen?', '¿Hacen agentes de IA?', '¿Cuánto cuesta una web?', '¿Dónde están?'].forEach(q => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = q;
      b.addEventListener('click', () => send(q));
      chips.appendChild(b);
    });
    refreshWa();
  }

  function open() {
    root.classList.add('open');
    document.body.classList.add('kchat-open');
    greet();
    setTimeout(() => input.focus({ preventScroll: true }), 250);
  }
  function close() {
    root.classList.remove('open');
    document.body.classList.remove('kchat-open');
  }

  orb.style.cursor = 'pointer';
  orb.setAttribute('role', 'button');
  orb.setAttribute('tabindex', '0');
  orb.setAttribute('aria-label', 'Abrir chat con Kuper AI');
  const toggle = () => (root.classList.contains('open') ? close() : open());
  orb.addEventListener('click', e => { e.stopPropagation(); toggle(); });
  orb.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggle(); }
  });
  root.querySelector('#kchat-close').addEventListener('click', close);
  window.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  form.addEventListener('submit', e => { e.preventDefault(); const v = input.value; input.value = ''; send(v); });
})();
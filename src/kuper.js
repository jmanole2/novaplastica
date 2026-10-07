/* Kuper Media — "Tu Agente de IA en WhatsApp" 10 s paper-cut promo.
 * Drawn procedurally on a 1080x1920 canvas. Choreography is authored on a
 * 10 s base timeline and stretched to kuper.config.json "duration".
 * The math / paper / mascot toolkit below is shared with src/anim.js.
 */
'use strict';
(() => {
  const DEFAULT_CFG = {
    duration: 10,
    colors: { background: '#1E3B2F' },
    text: {
      banner: ['Tu Agente de IA', 'en WhatsApp'],
      bannerBy: 'by Kuper Media',
      checklist: [['01.', 'Cuentas'], ['02.', 'Infraestructura'], ['03.', 'Info Negocio'], ['04.', 'Pago']],
      chatName: 'Agente IA',
      chatStatus: 'en línea',
      chat: [['in', '¡Hola! Soy tu agente de IA.'], ['out', '¿Cuánto cuesta?'], ['in', 'Te comparto los precios:']],
      prices: [['Configuración inicial', '$5,499', ''], ['Mantenimiento y soporte', '$499', '/mes']],
      title: 'Kuper Media',
      titleSub: 'Agentes de IA',
      subtitle: 'Arrancamos en cuanto lo tengamos',
    },
  };
  const USER = window.ANIM_CONFIG || {};
  const CFG = {
    ...DEFAULT_CFG, ...USER,
    colors: { ...DEFAULT_CFG.colors, ...(USER.colors || {}) },
    text: { ...DEFAULT_CFG.text, ...(USER.text || {}) },
  };
  const TXT = CFG.text;
  const DURATION = CFG.duration;
  const SUR = 1, HOP = 1;
  const W = 1080, H = 1920;
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');

  // ---------------------------------------------------------------- math
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const bell = (u) => Math.sin(Math.PI * clamp(u));
  const E = {
    linear: (t) => t,
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    out: (t) => 1 - Math.pow(1 - t, 3),
    in: (t) => t * t * t,
    sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    outSoft: (t) => { const c1 = 0.8, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  };
  const mix = (a, b, u) => (Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], u)) : lerp(a, b, u));
  function kf(t, keys) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t1, v1, e] = keys[i];
      const [t0, v0] = keys[i - 1];
      if (t <= t1) return mix(v0, v1, (e || E.inOut)((t - t0) / (t1 - t0)));
    }
    return keys[keys.length - 1][1];
  }
  function hash(i, seed = 0) {
    let h = Math.imul((i | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul((seed | 0) + 1, 0xc2b2ae35);
    h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
    return ((h >>> 0) / 4294967295) * 2 - 1;
  }
  function noise1(x, seed) {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return lerp(hash(i, seed), hash(i + 1, seed), u);
  }
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const quad = (a, c, b, u) => [
    (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0],
    (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1],
  ];

  // ---------------------------------------------------------------- textures
  let GRAIN = null, GRAIN_DARK = null;
  function makeGrain(seed, dark) {
    const S = 384, c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d'), R = rng(seed);
    for (let i = 0; i < 70; i++) {
      const x = R() * S, y = R() * S, rad = 25 + R() * 80, d = R() < 0.5;
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
        const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad);
        gr.addColorStop(0, d ? 'rgba(110,70,35,0.014)' : 'rgba(255,255,255,0.022)');
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2);
      }
    }
    for (let i = 0; i < 6500; i++) {
      const x = R() * S, y = R() * S, a = R() * (dark ? 0.12 : 0.09);
      g.fillStyle = R() < 0.55 ? `rgba(90,58,32,${a})` : `rgba(255,255,255,${a * (dark ? 0.8 : 1.6)})`;
      const s = R() < 0.92 ? 1 : 2;
      g.fillRect(x, y, s, s);
    }
    g.lineWidth = 0.7;
    for (let i = 0; i < 90; i++) {
      const x = R() * S, y = R() * S, an = R() * Math.PI * 2, l = 6 + R() * 20;
      g.strokeStyle = R() < 0.5 ? 'rgba(105,70,40,0.10)' : 'rgba(255,255,255,0.20)';
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(an) * l * 0.5 + (R() - 0.5) * 6, y + Math.sin(an) * l * 0.5 + (R() - 0.5) * 6, x + Math.cos(an) * l, y + Math.sin(an) * l);
      g.stroke();
    }
    return ctx.createPattern(c, 'repeat');
  }

  // Hatch strokes for the mascot body, in normalized body coords (0..1)
  const HATCH = (() => {
    const R = rng(7), out = [];
    for (let i = 0; i < 150; i++) {
      const k = -0.75 + R() * 1.8;
      const x0 = k, y0 = -0.05, len = 0.35 + R() * 0.7;
      if (R() > 0.35 + 0.65 * clamp(k + 0.3)) continue; // denser toward the right
      const dark = R() < 0.62;
      out.push({ x0, y0: y0 + R() * 0.5, dx: 0.62 * len, dy: 1.0 * len, dark, a: 0.25 + R() * 0.35, w: 0.9 + R() * 0.9 });
    }
    return out;
  })();

  // ---------------------------------------------------------------- paper primitives
  const pathCache = new Map();
  function paperPath(w, h, r = 8, seed = 1, amp = 1.1, freq = 0.045) {
    w = Math.max(1, Math.round(w * 2) / 2); h = Math.max(1, Math.round(h * 2) / 2);
    const key = `${w}|${h}|${r}|${seed}|${amp}|${freq}`;
    let p = pathCache.get(key);
    if (p) return p;
    r = Math.min(r, w / 2, h / 2);
    const pts = [], x0 = -w / 2, y0 = -h / 2, step = 9;
    let dist = 0;
    const jit = (d) => amp * noise1(d * freq, seed) + amp * 0.4 * noise1(d * freq * 3.7, seed + 11);
    const edge = (ax, ay, bx, by, nx, ny) => {
      const len = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(len / step));
      for (let i = 0; i < n; i++) {
        const u = i / n, j = jit(dist + u * len);
        pts.push([ax + (bx - ax) * u + nx * j, ay + (by - ay) * u + ny * j]);
      }
      dist += len;
    };
    const arc = (cx, cy, a0) => {
      const n = 5;
      for (let i = 0; i < n; i++) {
        const a = a0 + (i / n) * Math.PI / 2, j = jit(dist);
        pts.push([cx + Math.cos(a) * (r + j), cy + Math.sin(a) * (r + j)]);
        dist += (r * Math.PI) / 2 / n;
      }
    };
    edge(x0 + r, y0, x0 + w - r, y0, 0, -1); arc(x0 + w - r, y0 + r, -Math.PI / 2);
    edge(x0 + w, y0 + r, x0 + w, y0 + h - r, 1, 0); arc(x0 + w - r, y0 + h - r, 0);
    edge(x0 + w - r, y0 + h, x0 + r, y0 + h, 0, 1); arc(x0 + r, y0 + h - r, Math.PI / 2);
    edge(x0, y0 + h - r, x0, y0 + r, -1, 0); arc(x0 + r, y0 + r, Math.PI);
    p = new Path2D();
    p.moveTo(pts[0][0], pts[0][1]);
    for (const q of pts) p.lineTo(q[0], q[1]);
    p.closePath();
    if (pathCache.size > 6000) pathCache.clear();
    pathCache.set(key, p);
    return p;
  }
  function curScale() { const m = ctx.getTransform(); return Math.hypot(m.a, m.b) || 1; }
  function setShadow(elev, alpha = 1) {
    const s = curScale();
    ctx.shadowColor = `rgba(78,44,22,${(0.2 + 0.05 * elev) * alpha})`;
    ctx.shadowBlur = (3 + 10 * elev) * s;
    ctx.shadowOffsetX = (0.6 + 1.6 * elev) * s;
    ctx.shadowOffsetY = (1.5 + 5.5 * elev) * s;
  }
  /** Draw a sheet of paper centred at the origin. */
  function paper(o) {
    const p = paperPath(o.w, o.h, o.r ?? 8, o.seed ?? 1, o.amp ?? 1.1);
    const elev = o.elev ?? 1;
    ctx.save();
    if (elev > 0) setShadow(elev, o.shadowAlpha ?? 1);
    ctx.fillStyle = o.color;
    ctx.fill(p);
    ctx.restore();
    ctx.save();
    ctx.clip(p);
    if (o.grain !== false) {
      ctx.fillStyle = o.dark ? GRAIN_DARK : GRAIN;
      ctx.fillRect(-o.w / 2 - 4, -o.h / 2 - 4, o.w + 8, o.h + 8);
    }
    const g = ctx.createLinearGradient(0, -o.h / 2, 0, o.h / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.10)');
    g.addColorStop(1, 'rgba(90,45,20,0.06)');
    ctx.fillStyle = g;
    ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
    if (o.inner) o.inner();
    if (o.fold) { // folding shade
      ctx.fillStyle = `rgba(60,30,15,${0.32 * o.fold})`;
      ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
    }
    ctx.restore();
    ctx.save();
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = o.dark ? 'rgba(0,0,0,0.35)' : 'rgba(80,45,20,0.2)';
    ctx.stroke(p);
    ctx.restore();
    return p;
  }
  function at(x, y, rot, sx, sy, fn) {
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    if (sx !== 1 || sy !== 1) ctx.scale(Math.abs(sx) < 1e-3 ? 1e-3 : sx, Math.abs(sy) < 1e-3 ? 1e-3 : sy);
    fn();
    ctx.restore();
  }
  function rrect(x, y, w, h, r, color, stroke) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    if (color) { ctx.fillStyle = color; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke[0]; ctx.lineWidth = stroke[1]; ctx.stroke(); }
  }
  function circle(x, y, r, color) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }
  function font(size, fam = 'DM Sans', weight = 700) { return `${weight} ${size}px "${fam}"`; }
  function text(str, x, y, o = {}) {
    const fam = o.font || 'DM Sans', weight = o.weight || 700;
    let size = o.size || 40;
    ctx.save();
    ctx.letterSpacing = (o.ls || 0) + 'px';
    ctx.font = font(size, fam, weight);
    if (o.maxW) {
      const w = ctx.measureText(str).width;
      if (w > o.maxW) { size *= o.maxW / w; ctx.font = font(size, fam, weight); }
    }
    ctx.fillStyle = o.color || C.charcoal;
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.base || 'middle';
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.fillText(str, x, y);
    ctx.restore();
    return size;
  }
  function lines(x, y, widths, gap, h, color) {
    widths.forEach((w, i) => rrect(x, y + i * gap, w, h, h / 2, color));
  }
  function stitchLine(x0, y0, x1, y1, width, color, stitch, frac = 1) {
    if (frac <= 0) return;
    const x = lerp(x0, x1, frac), y = lerp(y0, y1, frac);
    const len = Math.hypot(x - x0, y - y0), an = Math.atan2(y - y0, x - x0);
    ctx.save();
    ctx.translate(x0, y0); ctx.rotate(an);
    setShadow(0.4);
    rrect(0, -width / 2, len, width, width / 2, color);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = GRAIN; ctx.fillRect(0, -width / 2, len, width);
    if (stitch) {
      ctx.setLineDash([7, 7]); ctx.lineWidth = 1.6; ctx.strokeStyle = stitch;
      ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(len - 4, 0); ctx.stroke();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- mascot
  const LEG_X = [-88, -47, 47, 88];
  function drawMascot(m) {
    const sur = clamp(m.surprise || 0) * SUR;
    const air = m.air || 0;
    // ground shadow
    ctx.save();
    ctx.translate(m.x, m.y + air);
    ctx.scale(m.s, m.s);
    const sk = clamp(1 - air / 110) * (m.shadow ?? 1);
    if (sk > 0.01) {
      ctx.globalAlpha = sk;
      const rx = 150 * (0.8 + 0.2 * sk);
      ctx.beginPath(); ctx.ellipse(0, 2, rx, 13, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(55,40,32,0.16)'; ctx.fill();
      ctx.save(); ctx.clip();
      ctx.strokeStyle = 'rgba(55,40,32,0.28)'; ctx.lineWidth = 1.4;
      for (let x = -rx; x < rx; x += 7) { ctx.beginPath(); ctx.moveTo(x, 14); ctx.lineTo(x + 12, -10); ctx.stroke(); }
      ctx.restore();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.tilt || 0);
    ctx.scale(m.s, m.s);
    const sq = (m.squash || 0) - sur * 0.07; // + squash, - stretch
    const walkAmt = m.walkAmt || 0, ph = m.walkPhase || 0;
    const bob = -Math.abs(Math.sin(ph)) * 5 * walkAmt;
    const sx = 1 + sq * 0.7, sy = 1 - sq;
    const legH = 38 * (1 - Math.max(0, sq) * 0.9) + (air > 4 ? 5 : 0);
    const bw = 240 * sx, bh = 150 * sy;
    const bottom = -legH + bob;
    const top = bottom - bh;
    const OUT = C.ink, LW = 5.5;
    ctx.lineJoin = 'round';

    // legs
    LEG_X.forEach((lx, i) => {
      const lift = walkAmt * Math.max(0, Math.sin(ph + (i % 2 ? Math.PI : 0))) * 12;
      const x = lx * sx;
      const y1 = -lift;
      ctx.beginPath(); ctx.roundRect(x - 10, bottom - 6, 20, y1 - bottom + 6, 3);
      ctx.fillStyle = C.mascot; ctx.fill();
      ctx.lineWidth = LW; ctx.strokeStyle = OUT; ctx.stroke();
      ctx.save(); ctx.clip();
      ctx.fillStyle = 'rgba(150,70,35,0.25)'; ctx.fillRect(x + 2, bottom - 6, 10, y1 - bottom + 6);
      ctx.restore();
    });

    // arms (behind body)
    const armY = top + 0.56 * bh;
    const drawArm = (side, raise) => {
      ctx.save();
      ctx.translate(side * bw / 2, armY);
      ctx.rotate(side < 0 ? raise : -raise);
      ctx.beginPath();
      if (side < 0) ctx.roundRect(-38, -17, 44, 34, 4); else ctx.roundRect(-6, -17, 44, 34, 4);
      ctx.fillStyle = C.mascot; ctx.fill();
      ctx.lineWidth = LW; ctx.strokeStyle = OUT; ctx.stroke();
      ctx.save(); ctx.clip();
      ctx.strokeStyle = 'rgba(160,75,38,0.45)'; ctx.lineWidth = 1.2;
      for (let k = -40; k < 50; k += 6) { ctx.beginPath(); ctx.moveTo(k, -20); ctx.lineTo(k + 14, 20); ctx.stroke(); }
      ctx.restore();
      ctx.restore();
    };
    drawArm(-1, m.armL || 0);
    drawArm(1, m.armR || 0);

    // body
    ctx.save();
    ctx.translate(0, (top + bottom) / 2);
    const bp = paperPath(bw, bh, 10, 3, 0.9, 0.06);
    ctx.save();
    setShadow(0.6, 0.8);
    ctx.fillStyle = C.mascot; ctx.fill(bp);
    ctx.restore();
    ctx.save();
    ctx.clip(bp);
    ctx.fillStyle = GRAIN; ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    const hl = ctx.createLinearGradient(-bw / 2, -bh / 2, bw / 2, bh / 2);
    hl.addColorStop(0, 'rgba(255,200,160,0.18)'); hl.addColorStop(0.55, 'rgba(255,200,160,0)'); hl.addColorStop(1, 'rgba(120,50,20,0.12)');
    ctx.fillStyle = hl; ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    for (const s of HATCH) {
      ctx.strokeStyle = s.dark ? `rgba(168,76,38,${s.a})` : `rgba(248,178,138,${s.a})`;
      ctx.lineWidth = s.w;
      ctx.beginPath();
      ctx.moveTo(-bw / 2 + s.x0 * bw, -bh / 2 + s.y0 * bh);
      ctx.lineTo(-bw / 2 + (s.x0 + s.dx) * bw, -bh / 2 + (s.y0 + s.dy) * bh);
      ctx.stroke();
    }
    ctx.restore();
    ctx.lineWidth = LW; ctx.strokeStyle = OUT; ctx.stroke(bp);
    ctx.restore();

    // eyes
    const blink = clamp(m.blink || 0);
    const ew = 21 * (1 + 0.14 * sur), eh = 38 * (1 + 0.3 * sur) * (1 - 0.88 * blink);
    const ey = top + 63 * sy - sur * 4 + (m.lookY || 0) * 7;
    const ex = (m.lookX || 0) * 11;
    for (const side of [-1, 1]) {
      const cx = side * 61 * sx + ex;
      rrect(cx - ew / 2, ey - eh / 2, ew, eh, Math.min(7, eh / 2), OUT);
      if (blink < 0.5) rrect(cx + 1, ey - eh / 2 + 5, 6, 9, 2, 'rgba(255,255,255,0.92)');
    }

    // surprise pop lines
    if (sur > 0.02) {
      ctx.save();
      ctx.globalAlpha = clamp(sur * 1.4);
      ctx.strokeStyle = OUT; ctx.lineWidth = 6; ctx.lineCap = 'round';
      const L = 22 * sur;
      for (const [x, y, dx, dy] of [[-150, top - 16, -1, -1], [0, top - 28, 0, -1.3], [150, top - 16, 1, -1]]) {
        ctx.beginPath(); ctx.moveTo(x * sx, y); ctx.lineTo(x * sx + dx * L, y + dy * L); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- choreography helpers
  function walkSeq(t, x0, walks) {
    let x = x0;
    for (const w of walks) {
      if (t < w.t0) return { x, amt: 0, phase: 0, dir: 0 };
      if (t <= w.t1) {
        const u = (t - w.t0) / (w.t1 - w.t0), e = E.sine(u);
        const steps = Math.abs(w.x - x) / 38;
        return { x: lerp(x, w.x, e), amt: clamp(bell(u) * 2), phase: e * steps * Math.PI, dir: Math.sign(w.x - x) };
      }
      x = w.x;
    }
    return { x, amt: 0, phase: 0, dir: 0 };
  }
  const val = (v, t) => (typeof v === 'function' ? v(t) : v);
  /** Chain of hops. Targets can be functions of time (moving platforms). */
  function hopSeq(t, start, hops) {
    let px = val(start[0], t), py = val(start[1], t), lastLand = -99;
    for (const hp of hops) {
      const tx = val(hp.x, t), ty = val(hp.y, t);
      if (t < hp.t0) {
        const pre = seg(t, hp.t0 - 0.13, hp.t0);
        const lp = seg(t, lastLand, lastLand + 0.28);
        return { x: px, y: py, air: 0, squash: 0.13 * bell(pre) + 0.16 * Math.sin(Math.PI * lp) * (1 - lp), inAir: false, dir: Math.sign(tx - px), lastLand };
      }
      if (t <= hp.t1) {
        const u = (t - hp.t0) / (hp.t1 - hp.t0);
        const x = lerp(px, tx, E.sine(u));
        const arc = (hp.h ?? 100) * HOP * 4 * u * (1 - u);
        const y = lerp(py, ty, u * u * (3 - 2 * u)) - arc;
        return { x, y, air: arc, squash: -0.07 * bell(u), inAir: true, u, dir: Math.sign(tx - px), lastLand };
      }
      px = tx; py = ty; lastLand = hp.t1;
    }
    const lp = seg(t, lastLand, lastLand + 0.28);
    return { x: px, y: py, air: 0, squash: 0.16 * Math.sin(Math.PI * lp) * (1 - lp), inAir: false, dir: 0, lastLand };
  }
  function jump(t, t0, t1, h) {
    const pre = seg(t, t0 - 0.12, t0), u = seg(t, t0, t1), post = seg(t, t1, t1 + 0.28);
    return {
      air: h * HOP * 4 * u * (1 - u),
      squash: 0.13 * bell(pre) - 0.07 * bell(u) + 0.16 * Math.sin(Math.PI * post) * (1 - post) * (t > t1 ? 1 : 0),
    };
  }
  function blinkAt(t) { let b = 0; for (const s of BLINKS) b = Math.max(b, bell(seg(t, s, s + 0.16))); return b; }

  // ---------------------------------------------------------------- palette
  const C = {
    bg: CFG.colors.background, bgL: '#284B3B', bgLL: '#33594A', bgD: '#16302A', slab: '#10241C', front: '#1A372C',
    cream: '#F7EFE1', creamD: '#EDE2CF', paper: '#FBF6EC',
    orange: '#DD7C4E', orangeL: '#F0A77C', terracotta: '#C2603F', terracottaD: '#A24C31',
    charcoal: '#2C2522', charcoalL: '#5A4F49', ink: '#221B18',
    chatGreen: '#2E7D57', bubbleOut: '#DCEFD2', chatBg: '#EFE6D6',
    mascot: '#D6774B',
  };
  const BLINKS = [0.15, 1.75, 3.0, 4.75, 6.3, 7.9, 9.35];

  // ---------------------------------------------------------------- layout
  const DESK_Y = 1500;
  const CARD_POS = [[290, 770, -0.03], [790, 770, 0.025], [290, 1035, 0.02], [790, 1035, -0.03]];
  const CARD_W = 440, CARD_H = 200;
  const DECK = [150, 1452];
  const DECK_S = 0.36;
  const CHAT = { x: 600, y: 610, w: 700, h: 560 };
  const PRICE = [{ x: 610, y: 1045 }, { x: 610, y: 1240 }];
  const PRICE_W = 660, PRICE_H = 178;
  const PLAQUE = { x: 540, y: 1080, w: 880, h: 360 };
  const checkAt = (i) => 2.75 + i * 0.36;

  // ---------------------------------------------------------------- background
  function drawBackground(t) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = GRAIN_DARK; ctx.fillRect(0, 0, W, H);
    const d = Math.sin(t * 0.6) * 6;
    at(900, 120 + d, 0.18, 1, 1, () => paper({ w: 720, h: 460, r: 4, color: C.bgL, seed: 21, amp: 5, elev: 0.6, dark: true }));
    at(80, 330 - d, 0.32, 1, 1, () => paper({ w: 260, h: 340, r: 4, color: C.bgLL, seed: 24, amp: 4, elev: 0.5, dark: true }));
    at(1080, 1350 + d, -0.35, 1, 1, () => paper({ w: 320, h: 560, r: 4, color: C.bgL, seed: 23, amp: 4, elev: 0.5, dark: true }));
    const v = ctx.createRadialGradient(540, 900, 450, 540, 960, 1300);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,10,5,0.35)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }

  // ---------------------------------------------------------------- desk
  function drawDesk(t) {
    const out = E.in(seg(t, 8.15, 8.6));
    if (out >= 1) return;
    const y = DESK_Y + out * 500;
    at(540, y + 22 + 230, 0, 1, 1, () => paper({ w: 1020, h: 460, r: 6, color: C.front, seed: 80, elev: 1, dark: true, inner: () => {
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(-480, -210, 960, 6);
      ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(-510, 80, 1020, 150);
    } }));
    at(540, y + 11, 0, 1, 1, () => paper({ w: 1060, h: 22, r: 6, color: C.slab, seed: 81, elev: 1.2, dark: true, inner: () => {
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(-530, -11, 1060, 3);
    } }));
  }

  // ---------------------------------------------------------------- banner (0–5 s)
  function drawBanner(t) {
    const p = seg(t, 0.15, 0.95);
    if (p <= 0) return;
    const q = seg(t, 4.85, 5.2);
    if (q >= 1) return;
    const move = E.inOut(seg(t, 1.85, 2.3));
    const x = 540, y = lerp(800, 395, move) - E.in(q) * 120;
    const s = lerp(1, 0.7, move);
    const unfold = E.outBack(seg(p, 0.15, 1));
    const bw = 900, bh = 400;
    ctx.save();
    ctx.globalAlpha = clamp(p * 4) * (1 - seg(q, 0.6, 1));
    at(x, y, Math.sin(t * 1.6) * 0.008, s, s, () => {
      // ribbon tails
      for (const sd of [-1, 1]) {
        const tp = E.outBack(seg(p, 0.35, 0.8));
        at(sd * (bw / 2 - 10), 120, sd * 0.05, tp, tp, () => {
          ctx.save(); setShadow(0.8);
          ctx.beginPath();
          ctx.moveTo(sd * -40, -50); ctx.lineTo(sd * 90, -50); ctx.lineTo(sd * 60, 0); ctx.lineTo(sd * 90, 50); ctx.lineTo(sd * -40, 50); ctx.closePath();
          ctx.fillStyle = C.terracottaD; ctx.fill(); ctx.restore();
        });
      }
      // unfolding sheet: hinged at its top roll
      at(0, -bh / 2, 0, 1, Math.max(0.02, unfold) * (1 - E.in(q)), () => at(0, bh / 2, 0, 1, 1, () => paper({
        w: bw, h: bh, r: 10, color: C.cream, seed: 30, elev: 1.4, fold: 1 - clamp(unfold),
        inner: () => {
          ctx.strokeStyle = 'rgba(194,96,63,0.45)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.roundRect(-bw / 2 + 22, -bh / 2 + 22, bw - 44, bh - 44, 6); ctx.stroke();
          text(TXT.banner[0], 0, -88, { font: 'Fraunces', weight: 800, size: 96, color: C.charcoal, maxW: bw - 110 });
          text(TXT.banner[1], 0, 22, { font: 'Fraunces', weight: 800, size: 96, color: C.terracotta, maxW: bw - 110 });
          rrect(-60, 88, 120, 4, 2, C.orange);
          text(TXT.bannerBy, 0, 134, { font: 'DM Sans', weight: 700, size: 38, color: C.charcoalL, ls: 2, maxW: bw - 160 });
        },
      })));
      // top roll
      ctx.save(); setShadow(1);
      rrect(-bw / 2 - 16, -bh / 2 - 18, bw + 32, 34, 17, C.terracotta);
      ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-bw / 2, -bh / 2 - 12, bw, 5);
    });
    ctx.restore();
  }

  // ---------------------------------------------------------------- checklist cards (2–5 s)
  function cardPose(t, i) {
    const a = 2.0 + i * 0.16, p = seg(t, a, a + 0.42);
    if (p <= 0) return null;
    const [tx, ty, tr] = CARD_POS[i];
    const e = E.outSoft(p);
    let x = lerp(540, tx, e), y = lerp(1330, ty, e) - bell(p) * 60;
    let s = lerp(0.35, 1, E.outBack(p)), r = lerp(i % 2 ? 0.5 : -0.5, tr, E.out(p));
    let sy = E.out(clamp(p * 1.5));
    // gather into a deck on the desk
    const g = E.inOut(seg(t, 4.85 + i * 0.05, 5.25 + i * 0.05));
    if (g > 0) {
      x = lerp(x, DECK[0] + i * 3, g); y = lerp(y, DECK[1] - CARD_H * DECK_S / 2 - i * 7, g);
      s = lerp(s, DECK_S, g); r = lerp(r, -0.05 + i * 0.03, g);
    }
    // final fold-away
    const f = E.in(seg(t, 8.0 + i * 0.03, 8.35 + i * 0.03));
    return { x, y: y + f * 40, s, r, sy: sy * (1 - f), fold: Math.max(1 - sy, f), alpha: 1 - seg(f, 0.7, 1) };
  }
  function drawCards(t) {
    for (let i = 0; i < 4; i++) {
      const ps = cardPose(t, i);
      if (!ps || ps.alpha <= 0) continue;
      const ck = seg(t, checkAt(i), checkAt(i) + 0.3);
      ctx.save(); ctx.globalAlpha = ps.alpha;
      at(ps.x, ps.y, ps.r, ps.s, ps.s * Math.max(0.02, ps.sy), () => {
        paper({ w: CARD_W, h: CARD_H, r: 12, color: C.paper, seed: 90 + i, elev: 1.3, fold: ps.fold, inner: () => {
          rrect(-CARD_W / 2, -CARD_H / 2, 14, CARD_H, 0, ck > 0 ? C.orange : C.creamD);
          text(TXT.checklist[i][0], -CARD_W / 2 + 40, -38, { font: 'Fraunces', weight: 800, size: 46, color: C.terracotta, align: 'left' });
          text(TXT.checklist[i][1], -CARD_W / 2 + 40, 32, { font: 'DM Sans', weight: 700, size: 42, color: C.charcoal, align: 'left', maxW: CARD_W - 150 });
          // check box
          const cx = CARD_W / 2 - 62, cy = -36;
          ctx.strokeStyle = 'rgba(44,37,34,0.3)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2); ctx.stroke();
          if (ck > 0) {
            const pop = E.outBack(ck);
            at(cx, cy, 0, pop, pop, () => {
              circle(0, 0, 30, C.orange);
              ctx.strokeStyle = '#FFF8EE'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
              const k = clamp(ck * 1.6);
              const P = [[-13, 1], [-3, 11], [15, -11]];
              ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
              if (k < 0.4) ctx.lineTo(lerp(P[0][0], P[1][0], k / 0.4), lerp(P[0][1], P[1][1], k / 0.4));
              else { ctx.lineTo(P[1][0], P[1][1]); const u = (k - 0.4) / 0.6; ctx.lineTo(lerp(P[1][0], P[2][0], u), lerp(P[1][1], P[2][1], u)); }
              ctx.stroke();
            });
            // little paper burst
            const b = seg(ck, 0.1, 0.8);
            if (b > 0 && b < 1) {
              ctx.save(); ctx.globalAlpha *= 1 - b;
              for (let k2 = 0; k2 < 6; k2++) {
                const an = k2 / 6 * Math.PI * 2 + 0.3, rr = 40 + b * 34;
                at(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr, an, 1, 1, () => rrect(-6, -2.5, 12, 5, 2, k2 % 2 ? C.orangeL : C.terracotta));
              }
              ctx.restore();
            }
          }
        } });
      });
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- connector strip (5–8 s)
  function stripEnds(t) {
    const g = E.out(seg(t, 5.42, 5.85));
    const a = [DECK[0] + 10, DECK[1] - 70];
    const b = [CHAT.x - CHAT.w / 2 + 10, CHAT.y + 120];
    return { a, b, g };
  }
  function drawStrip(t) {
    const { a, b, g } = stripEnds(t);
    const f = 1 - E.in(seg(t, 8.0, 8.3));
    if (g <= 0 || f <= 0) return;
    // slight curve through a control point
    const c = [a[0] - 60, (a[1] + b[1]) / 2];
    const N = 28, n = Math.max(1, Math.round(N * g * f));
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    setShadow(0.6);
    ctx.strokeStyle = C.orange; ctx.lineWidth = 16;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]);
    for (let i = 1; i <= n; i++) { const [x, y] = quad(a, c, b, i / N); ctx.lineTo(x, y); }
    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255,248,238,0.75)'; ctx.lineWidth = 2; ctx.setLineDash([9, 9]);
    ctx.stroke();
    ctx.restore();
    if (g >= 1 && f >= 1) circle(b[0], b[1], 11, C.terracottaD);
    circle(a[0], a[1], 11, C.terracottaD);
  }

  // ---------------------------------------------------------------- chat + prices (5–8 s)
  function drawChat(t) {
    const p = seg(t, 5.65, 6.1);
    if (p <= 0) return;
    const f = E.in(seg(t, 8.0, 8.35));
    if (f >= 1) return;
    const { x, y, w, h } = CHAT;
    const sy = E.outBack(p) * (1 - f);
    ctx.save(); ctx.globalAlpha = clamp(p * 4) * (1 - seg(f, 0.7, 1));
    at(x, y - h / 2, (1 - E.out(p)) * 0.06, 1, Math.max(0.02, sy), () => at(0, h / 2, 0, 1, 1, () => paper({
      w, h, r: 22, color: C.chatBg, seed: 100, elev: 1.5, fold: Math.max(1 - clamp(sy), f),
      inner: () => {
        // wallpaper dots
        ctx.fillStyle = 'rgba(46,125,87,0.08)';
        for (let yy = -h / 2 + 110; yy < h / 2; yy += 34) for (let xx = -w / 2 + 20 + ((yy / 34) % 2) * 17; xx < w / 2; xx += 34) circle(xx, yy, 3, 'rgba(46,125,87,0.08)');
        // header
        ctx.fillStyle = C.chatGreen; ctx.fillRect(-w / 2, -h / 2, w, 100);
        ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(-w / 2, -h / 2, w, 4);
        // avatar: tiny mascot face
        rrect(-w / 2 + 34, -h / 2 + 22, 58, 58, 14, C.mascot, [C.ink, 3]);
        rrect(-w / 2 + 48, -h / 2 + 40, 7, 16, 3, C.ink); rrect(-w / 2 + 71, -h / 2 + 40, 7, 16, 3, C.ink);
        text(TXT.chatName, -w / 2 + 112, -h / 2 + 38, { size: 36, weight: 700, color: '#FFFFFF', align: 'left' });
        text(TXT.chatStatus, -w / 2 + 112, -h / 2 + 72, { size: 24, weight: 500, color: 'rgba(255,255,255,0.8)', align: 'left' });
        circle(w / 2 - 50, -h / 2 + 50, 5, 'rgba(255,255,255,0.85)'); circle(w / 2 - 50, -h / 2 + 34, 5, 'rgba(255,255,255,0.85)'); circle(w / 2 - 50, -h / 2 + 66, 5, 'rgba(255,255,255,0.85)');
        // messages
        let yy = -h / 2 + 150;
        TXT.chat.forEach(([who, msg], k) => {
          const a = 6.05 + k * 0.33, mp = seg(t, a, a + 0.28);
          if (mp <= 0) { yy += 96; return; }
          ctx.save();
          ctx.font = font(36, 'DM Sans', 500);
          const tw = Math.min(ctx.measureText(msg).width, w - 200);
          ctx.restore();
          const bw2 = tw + 52, bh2 = 76;
          const bx = who === 'out' ? w / 2 - 30 - bw2 : -w / 2 + 30;
          const e = E.outBack(mp);
          ctx.save();
          ctx.globalAlpha *= clamp(mp * 3);
          ctx.translate(bx + (who === 'out' ? bw2 : 0), yy);
          ctx.scale(e, e);
          ctx.translate(-(who === 'out' ? bw2 : 0), 0);
          ctx.save(); setShadow(0.4);
          rrect(0, 0, bw2, bh2, 18, who === 'out' ? C.bubbleOut : '#FFFFFF');
          ctx.restore();
          text(msg, 26, bh2 / 2 + 1, { size: 36, weight: 500, color: C.charcoal, align: 'left', maxW: w - 200 });
          text(who === 'out' ? '✓✓' : '', bw2 - 14, bh2 - 14, { size: 14, weight: 700, color: '#4E9BD0', align: 'right' });
          ctx.restore();
          yy += 96;
        });
        // typing dots before the prices
        const ty = seg(t, 6.75, 6.95) * (1 - seg(t, 7.3, 7.4));
        if (ty > 0) {
          ctx.save(); ctx.globalAlpha *= ty;
          rrect(-w / 2 + 30, yy, 110, 56, 18, '#FFFFFF');
          for (let k = 0; k < 3; k++) circle(-w / 2 + 62 + k * 23, yy + 28 - Math.max(0, Math.sin(t * 14 - k)) * 6, 7, 'rgba(44,37,34,0.4)');
          ctx.restore();
        }
      },
    })));
    ctx.restore();
  }
  function drawPrices(t) {
    TXT.prices.forEach(([label, price, unit], k) => {
      const a = 6.85 + k * 0.32, p = seg(t, a, a + 0.42);
      if (p <= 0) return;
      const f = E.in(seg(t, 8.05 + k * 0.04, 8.4 + k * 0.04));
      if (f >= 1) return;
      const T = PRICE[k];
      const from = [CHAT.x, CHAT.y + CHAT.h / 2 - 60];
      const e = E.outSoft(p);
      const x = lerp(from[0], T.x, e), y = lerp(from[1], T.y, e) + f * 60;
      const s = lerp(0.3, 1, E.outBack(p));
      const rot = (1 - E.out(p)) * (k ? 0.3 : -0.3) + (k ? 0.012 : -0.015);
      ctx.save(); ctx.globalAlpha = clamp(p * 4) * (1 - seg(f, 0.7, 1));
      at(x, y, rot, s, s * Math.max(0.02, 1 - f), () => paper({
        w: PRICE_W, h: PRICE_H, r: 14, color: C.paper, seed: 110 + k, elev: 1.5, fold: f,
        inner: () => {
          rrect(-PRICE_W / 2, -PRICE_H / 2, 18, PRICE_H, 0, k ? C.terracotta : C.orange);
          text(label, -PRICE_W / 2 + 50, -44, { size: 34, weight: 700, color: C.charcoalL, align: 'left', maxW: PRICE_W - 100 });
          ctx.save();
          ctx.font = font(84, 'Fraunces', 800);
          const pw = ctx.measureText(price).width;
          ctx.restore();
          text(price, -PRICE_W / 2 + 48, 34, { font: 'Fraunces', weight: 800, size: 84, color: C.terracotta, align: 'left' });
          if (unit) text(unit, -PRICE_W / 2 + 56 + pw, 50, { font: 'DM Sans', weight: 700, size: 40, color: C.charcoalL, align: 'left' });
        },
      }));
      ctx.restore();
    });
  }

  // ---------------------------------------------------------------- final frame (8–10 s)
  const plaqueTop = (t) => PLAQUE.y - PLAQUE.h / 2 * E.outBack(seg(t, 8.15, 8.55));
  function drawPlaque(t) {
    const p = seg(t, 8.15, 8.55);
    if (p <= 0) return;
    const sy = E.outBack(p);
    const { x, y, w, h } = PLAQUE;
    const layers = [[C.terracotta, 16, 18, 0.012], [C.orangeL, -18, 12, -0.014]];
    const sp = E.outSoft(seg(t, 8.35, 8.8));
    layers.forEach(([col, dx, dy, r], i) => at(x + dx * sp, y + dy * sp, r * sp, 1, Math.max(0.02, sy), () => paper({ w, h, r: 12, color: col, seed: 130 + i, elev: 1 })));
    at(x, y, 0, 1, Math.max(0.02, sy), () => paper({
      w, h, r: 12, color: C.cream, seed: 129, elev: 1.6, fold: 1 - clamp(sy),
      inner: () => {
        // title letters
        ctx.save();
        ctx.letterSpacing = '2px';
        let size = 128;
        ctx.font = font(size, 'Fraunces', 800);
        const tw = ctx.measureText(TXT.title).width;
        if (tw > w - 100) { size *= (w - 100) / tw; ctx.font = font(size, 'Fraunces', 800); }
        ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
        let xx = -ctx.measureText(TXT.title).width / 2;
        let k = 0;
        for (const ch of TXT.title) {
          const cw = ctx.measureText(ch).width;
          const a = 8.35 + k * 0.04, lp = seg(t, a, a + 0.35);
          if (lp > 0) {
            const e = E.outBack(lp);
            ctx.save();
            ctx.globalAlpha *= clamp(lp * 3);
            ctx.translate(xx + cw / 2, -4 + (1 - e) * 40);
            ctx.scale(lerp(0.6, 1, e), lerp(0.6, 1, e));
            ctx.fillStyle = 'rgba(80,40,20,0.14)'; ctx.fillText(ch, -cw / 2 + 2, 4);
            ctx.fillStyle = C.charcoal; ctx.fillText(ch, -cw / 2, 0);
            ctx.restore();
          }
          xx += cw; k++;
        }
        ctx.restore();
        const sp2 = E.out(seg(t, 8.6, 8.95));
        if (sp2 > 0) {
          rrect(-60 * sp2, 72, 120 * sp2, 4, 2, C.orange);
          text(TXT.titleSub, 0, 128 + (1 - sp2) * 20, { font: 'Fraunces', weight: 600, size: 62, color: C.terracotta, alpha: sp2, maxW: w - 120 });
        }
      },
    }));
  }
  function drawSubtitle(t) {
    const p = seg(t, 8.65, 9.05);
    if (p <= 0) return;
    const y = PLAQUE.y + PLAQUE.h / 2 + 110 + (1 - E.out(p)) * 40;
    ctx.save(); ctx.globalAlpha = clamp(p * 3);
    at(540, y, -0.012, 1, Math.max(0.05, E.outBack(p)), () => paper({ w: 860, h: 104, r: 10, color: C.orange, seed: 140, elev: 1.3, inner: () => {
      text(TXT.subtitle, 0, 3, { font: 'DM Sans', weight: 700, size: 46, color: '#FFF8EE', maxW: 790 });
    } }));
    ctx.restore();
  }
  function drawDecor(t) {
    [[150, 560, 0, C.orange], [935, 600, 1, C.cream], [930, 1560, 0, C.terracotta], [160, 1570, 2, C.orangeL]].forEach(([x, y, kind, col], i) => {
      const p = seg(t, 8.8 + i * 0.07, 9.2 + i * 0.07);
      if (p <= 0) return;
      const e = E.outBack(p);
      at(x, y + Math.sin(t * 2 + i) * 5, Math.sin(t + i) * 0.2 + i, e, e, () => {
        ctx.save(); setShadow(0.6); ctx.fillStyle = col; ctx.beginPath();
        if (kind === 0) ctx.arc(0, 0, 18, 0, Math.PI * 2);
        else if (kind === 1) { ctx.moveTo(0, -22); ctx.lineTo(20, 14); ctx.lineTo(-20, 14); ctx.closePath(); }
        else ctx.roundRect(-16, -16, 32, 32, 4);
        ctx.fill(); ctx.restore();
      });
    });
  }

  // ---------------------------------------------------------------- mascot choreography
  function mascotState(t) {
    const m = { x: 540, y: DESK_Y, s: 1.05, lookX: 0, lookY: 0, blink: blinkAt(t), surprise: 0, armL: 0, armR: 0, walkPhase: 0, walkAmt: 0, squash: 0, air: 0, tilt: 0 };
    const breathe = 0.012 * Math.sin(t * 2 * Math.PI * 0.9);
    const idle = 0.05 * Math.sin(t * 2.6);
    if (t < 8.15) {
      m.s = kf(t, [[0, 1.05], [4.75, 1.05], [5.1, 0.85]]);
      const wk = walkSeq(t, 540, [{ t0: 5.0, t1: 5.38, x: 300 }, { t0: 5.75, t1: 6.15, x: 560 }]);
      m.x = wk.x; m.walkAmt = wk.amt; m.walkPhase = wk.phase;
      const j0 = jump(t, 0.95, 1.2, 26), j1 = jump(t, 4.35, 4.65, 60), j2 = jump(t, 5.42, 5.62, 30), j3 = jump(t, 7.25, 7.5, 18);
      m.air = j0.air + j1.air + j2.air + j3.air;
      m.y = DESK_Y - m.air;
      // proud stance: chest up, arms out
      const proud = seg(t, 0.25, 0.45) * (1 - seg(t, 1.7, 1.95));
      m.squash = j0.squash + j1.squash + j2.squash + j3.squash + (wk.amt ? 0 : breathe) - proud * 0.05;
      // nod on each check
      for (let i = 0; i < 4; i++) m.squash += 0.08 * bell(seg(t, checkAt(i), checkAt(i) + 0.18));
      const look = kf(t, [
        [0, [0, 0.1]], [0.3, [0, -1]], [1.3, [0, -1]], [1.45, [0, 0.1]], [2.0, [0, 0.1]],
        [2.15, [-0.6, -1]], [checkAt(0) - 0.05, [-0.9, -1]], [checkAt(1) - 0.1, [0.9, -1]], [checkAt(2) - 0.1, [-0.9, -0.5]], [checkAt(3) - 0.1, [0.9, -0.5]],
        [4.25, [0, 0]], [4.95, [0, 0]], [5.05, [-1, 0.2]], [5.38, [-0.8, 0.4]], [5.45, [0.4, -1]], [5.75, [0.6, -1]], [5.8, [1, 0]],
        [6.15, [0.3, -1]], [6.8, [0.3, -1]], [6.9, [0.2, -0.3]], [7.25, [0, -0.2]], [7.7, [0, 0]],
      ]);
      m.lookX = look[0]; m.lookY = look[1];
      m.surprise = kf(t, [[7.15, 0], [7.25, 0.6], [7.6, 0.6], [7.9, 0]]);
      const raise = proud * 0.45 + 1.0 * bell(seg(t, 4.3, 4.75)) + 1.1 * bell(seg(t, 5.38, 5.75)) + 0.9 * bell(seg(t, 7.15, 7.75));
      m.armL = raise + idle;
      m.armR = raise - idle;
      m.tilt = wk.amt * wk.dir * 0.03;
      return m;
    }
    const hs = hopSeq(t, [560, DESK_Y], [{ t0: 8.22, t1: 8.62, x: 540, y: (tt) => plaqueTop(tt), h: 150 }]);
    m.x = hs.x; m.y = hs.y; m.air = hs.air;
    m.s = lerp(0.85, 1.0, E.inOut(seg(t, 8.25, 8.65)));
    m.squash = hs.squash + (hs.inAir ? 0 : breathe);
    if (hs.inAir) { m.lookX = 0; m.lookY = -0.4; m.armL = m.armR = 0.6; }
    else {
      const look = kf(t, [[8.65, [0, 0]], [8.8, [-0.5, 1]], [9.0, [0.5, 1]], [9.15, [0, 0.05]]]);
      m.lookX = look[0]; m.lookY = look[1];
      const wave = seg(t, 9.15, 9.25) * (1 - seg(t, 9.75, 9.9));
      m.armL = idle;
      m.armR = -idle + wave * (0.55 + 0.22 * Math.sin((t - 9.15) * 18));
    }
    return m;
  }

  // ---------------------------------------------------------------- frame
  function renderFrame(tReal) {
    const t = Math.min(10, tReal * 10 / DURATION);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.shadowColor = 'transparent';
    drawBackground(t);
    const z = kf(t, [[0, 1.0], [9.0, 1.0], [10, 1.02, E.sine]]);
    ctx.save();
    ctx.translate(540, 960); ctx.scale(z, z); ctx.translate(-540, -960);
    drawBanner(t);
    drawStrip(t);
    drawChat(t);
    drawPrices(t);
    drawDesk(t);
    drawCards(t);
    drawPlaque(t);
    drawSubtitle(t);
    drawDecor(t);
    drawMascot(mascotState(t));
    ctx.restore();
  }

  window.ANIM = {
    duration: DURATION,
    ready: (async () => {
      await Promise.all([
        document.fonts.load('600 50px "Fraunces"'), document.fonts.load('800 50px "Fraunces"'),
        document.fonts.load('500 20px "DM Sans"'), document.fonts.load('700 20px "DM Sans"'),
      ]);
      await document.fonts.ready;
      GRAIN = makeGrain(1, false);
      GRAIN_DARK = makeGrain(2, true);
      return true;
    })(),
    render: renderFrame,
  };
  if (!window.ANIM_CONFIG) {
    window.ANIM.ready.then(() => {
      const t0 = performance.now();
      const loop = () => { renderFrame(((performance.now() - t0) / 1000) % DURATION); requestAnimationFrame(loop); };
      loop();
    });
  }
})();

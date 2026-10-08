/* Kuper Media — "Agentes de IA a la medida" 15 s explainer.
 * Drawn procedurally on a 1080x1920 canvas. Choreography is authored on a
 * 15 s base timeline split in four scenes; agent.config.json can stretch each.
 * The math / paper / mascot toolkit below is shared with src/anim.js.
 */
'use strict';
(() => {
  const DEFAULT_CFG = {
    scenes: { problema: 3, negocio: 4, agente: 4, final: 4 },
    expressiveness: { surprise: 1, hopHeight: 1 },
    text: {
      line1: 'Nos cuentas de tu negocio…',
      line2: '…y creamos tu agente a la medida.',
      title: ['AGENTES DE IA', 'A LA MEDIDA'],
      subtitle: 'Kuper Media',
      chatName: 'Agente IA',
      chatStatus: 'en línea',
      chat: [
        ['in', '¿Qué horario tienen?', 9.0],
        ['out', '¡Hola! Abrimos de 9:00 a 19:00.', 9.3],
        ['out', '¿Quieres agendar una llamada?', 9.62],
        ['in', 'Sí, mañana por favor.', 10.0],
        ['out', 'Listo: mañana a las 10:00.', 10.32],
      ],
      cards: ['Tu negocio', 'Horarios', 'Servicios'],
    },
  };
  const USER = window.ANIM_CONFIG || {};
  const CFG = {
    ...DEFAULT_CFG, ...USER,
    scenes: { ...DEFAULT_CFG.scenes, ...(USER.scenes || {}) },
    expressiveness: { ...DEFAULT_CFG.expressiveness, ...(USER.expressiveness || {}) },
    text: { ...DEFAULT_CFG.text, ...(USER.text || {}) },
  };
  const TXT = CFG.text;
  const SUR = CFG.expressiveness.surprise, HOP = CFG.expressiveness.hopHeight;
  const SCENES = [['problema', 3], ['negocio', 4], ['agente', 4], ['final', 4]];
  const DURATION = SCENES.reduce((s, [k]) => s + CFG.scenes[k], 0);
  function toBase(t) {
    let acc = 0, bacc = 0;
    for (const [k, bd] of SCENES) {
      const d = CFG.scenes[k];
      if (t < acc + d || k === 'final') return bacc + Math.min(bd, Math.max(0, t - acc) * bd / d);
      acc += d; bacc += bd;
    }
    return 15;
  }
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
    bg: '#F1E6D4', sheetA: '#E8D8BE', sheetB: '#EDD0C4', sheetC: '#DCD3E6',
    cream: '#FCF7EE', paper: '#FFFBF3', creamD: '#EDE2CF', sand: '#E4CFAF',
    terracotta: '#C2603F', terracottaD: '#A24C31', orange: '#DD7C4E', orangeL: '#F0A77C',
    pink: '#E8B3A6', pinkL: '#F2CFC5', pinkD: '#D48F84',
    purple: '#8A78B0', purpleL: '#C6BAE0', purpleD: '#5E4E78',
    charcoal: '#2C2522', charcoalL: '#5A4F49', ink: '#221B18',
    skin: '#EBB99A', skinD: '#D9A07E', hair: '#3A2E2A',
    waGreen: '#2E7D57', bubbleOut: '#DCEFD2', chatBg: '#EFE6D6',
    mascot: '#D6774B',
  };
  const BLINKS = [0.6, 2.9, 5.2, 7.0, 8.7, 10.6, 12.4, 14.2];

  // ---------------------------------------------------------------- layout
  const DESK_Y = 1420;
  const PHONE = { x: 458, y: 1080, w: 370, h: 660 };
  const OWNER = { x: 152, headY: 1125 };
  const MASCOT_X = 870, MASCOT_S = 0.72;
  const STACK = [712, DESK_Y];
  const CARD_W = 150, CARD_H = 140;
  const SAY = [258, 885];
  const BUBBLES = [[330, 540, -0.08, 3], [620, 470, 0.06, 5], [850, 600, -0.05, 2], [190, 680, 0.07, 4]];
  const ASSEMBLE = [720, 1205];
  const CAL = { x: 760, y: 800, w: 190, h: 190 };
  const SIGN = { x: 540, y: 1610, w: 620, h: 190 };
  const launch = (i) => 3.55 + i * 0.85;

  const LOGO = new Image();
  LOGO.src = window.KUPER_LOGO; // embedded so the canvas stays exportable

  // ---------------------------------------------------------------- helpers
  function wrap(str, maxW) {
    const words = str.split(' '), out = [];
    let cur = '';
    for (const w of words) {
      const tryS = cur ? cur + ' ' + w : w;
      if (ctx.measureText(tryS).width > maxW && cur) { out.push(cur); cur = w; } else cur = tryS;
    }
    if (cur) out.push(cur);
    return out;
  }
  function checkMark(x, y, r, k, col = C.orange) {
    circle(x, y, r, col);
    ctx.save();
    ctx.strokeStyle = '#FFF8EE'; ctx.lineWidth = r * 0.24; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const P = [[-0.43, 0.03], [-0.1, 0.36], [0.5, -0.36]].map(([a, b]) => [x + a * r, y + b * r]);
    ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
    if (k < 0.4) ctx.lineTo(lerp(P[0][0], P[1][0], k / 0.4), lerp(P[0][1], P[1][1], k / 0.4));
    else { ctx.lineTo(P[1][0], P[1][1]); const u = clamp((k - 0.4) / 0.6); ctx.lineTo(lerp(P[1][0], P[2][0], u), lerp(P[1][1], P[2][1], u)); }
    ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------- background + desk
  function drawBackground(t) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = GRAIN; ctx.fillRect(0, 0, W, H);
    const d = Math.sin(t * 0.4) * 6;
    at(900, 110 + d, 0.2, 1, 1, () => paper({ w: 680, h: 440, r: 4, color: C.sheetA, seed: 21, amp: 5, elev: 0.5 }));
    at(-30, 420 - d, 0.3, 1, 1, () => paper({ w: 230, h: 320, r: 4, color: C.pinkL, seed: 24, amp: 4, elev: 0.4 }));
    at(1070, 1000 + d * 0.5, -0.35, 1, 1, () => paper({ w: 240, h: 460, r: 4, color: C.sheetC, seed: 23, amp: 4, elev: 0.4 }));
    const v = ctx.createRadialGradient(540, 960, 500, 540, 960, 1250);
    v.addColorStop(0, 'rgba(90,50,25,0)'); v.addColorStop(1, 'rgba(90,50,25,0.16)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }
  function drawDesk() {
    at(540, DESK_Y + 26 + 240, 0, 1, 1, () => paper({ w: 1010, h: 480, r: 6, color: C.terracotta, seed: 80, elev: 1, inner: () => {
      ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(-480, -216, 940, 6);
      ctx.fillStyle = 'rgba(70,25,10,0.16)'; ctx.fillRect(-505, 90, 1010, 150);
    } }));
    at(540, DESK_Y + 13, 0, 1, 1, () => paper({ w: 1050, h: 26, r: 6, color: C.charcoal, seed: 81, elev: 1.2, dark: true, inner: () => {
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(-525, -13, 1050, 3);
    } }));
  }

  // ---------------------------------------------------------------- text strips
  function strip(t, str, t0, t1, y, col, txtCol) {
    const p = seg(t, t0, t0 + 0.4), q = seg(t, t1, t1 + 0.3);
    if (p <= 0 || q >= 1) return;
    ctx.save();
    ctx.font = font(60, 'Fraunces', 600);
    const L = str.split('\n').flatMap((part) => wrap(part, 840));
    ctx.restore();
    const h = 70 + L.length * 72;
    ctx.save(); ctx.globalAlpha = clamp(p * 3) * (1 - seg(q, 0.6, 1));
    at(540, y + (1 - E.out(p)) * -40, -0.012 + (1 - E.out(p)) * 0.08, 1, Math.max(0.02, E.outBack(p) * (1 - E.in(q))), () => paper({
      w: 920, h, r: 10, color: col, seed: 150, elev: 1.3, fold: Math.max(1 - clamp(E.outBack(p)), q),
      inner: () => L.forEach((ln, i) => text(ln, 0, -((L.length - 1) * 72) / 2 + i * 72 + 4, { font: 'Fraunces', weight: 600, size: 60, color: txtCol, maxW: 860 })),
    }));
    ctx.restore();
  }

  // ---------------------------------------------------------------- unanswered bubbles
  function drawBubbles(t) {
    BUBBLES.forEach(([x, y, r, n], i) => {
      const a = 0.1 + i * 0.14, p = seg(t, a, a + 0.4);
      if (p <= 0) return;
      const res = 9.2 + i * 0.18;
      const ck = seg(t, res, res + 0.28), gone = seg(t, res + 0.35, res + 0.6);
      if (gone >= 1) return;
      const s = E.outBack(p) * (1 + 0.15 * bell(gone)) * (1 - E.in(gone));
      const bob = Math.sin(t * 2.2 + i * 1.7) * 8;
      const shake = t < 3.2 ? Math.sin(t * 13 + i) * 0.015 : 0;
      ctx.save(); ctx.globalAlpha = clamp(p * 3);
      at(x, y + bob, r + shake, s, s, () => {
        // tail
        ctx.save(); setShadow(0.8);
        ctx.beginPath(); ctx.moveTo(-50, 30); ctx.lineTo(-70, 70); ctx.lineTo(-18, 40); ctx.closePath();
        ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore();
        paper({ w: 180, h: 100, r: 26, color: '#FFFFFF', seed: 160 + i, elev: 1, inner: () => {
          rrect(-62, -22, 110, 12, 6, 'rgba(44,37,34,0.35)');
          rrect(-62, 4, 78, 12, 6, 'rgba(44,37,34,0.18)');
        } });
        if (ck <= 0) {
          circle(78, -40, 24, C.terracotta);
          text(String(n), 78, -38, { size: 26, weight: 700, color: '#FFF8EE' });
        } else checkMark(78, -40, 26, ck);
      });
      ctx.restore();
    });
  }

  // ---------------------------------------------------------------- phone
  function drawPhone(t) {
    const { x, y, w, h } = PHONE;
    const sw = w - 32, sh = h - 36;
    const agent = seg(t, 8.85, 9.05);
    at(x, y, -0.015, 1, 1, () => paper({ w, h, r: 48, color: C.charcoal, seed: 170, elev: 1.6, dark: true, inner: () => {
      ctx.save();
      ctx.beginPath(); ctx.roundRect(-sw / 2, -sh / 2 + 4, sw, sh, 32); ctx.clip();
      ctx.translate(0, 4);
      // --- problem screen: list of unanswered chats
      ctx.fillStyle = '#FBF6EC'; ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
      ctx.fillStyle = C.waGreen; ctx.fillRect(-sw / 2, -sh / 2, sw, 86);
      text('Chats', -sw / 2 + 28, -sh / 2 + 50, { size: 32, weight: 700, color: '#FFFFFF', align: 'left' });
      const av = [C.pink, C.purpleL, C.orangeL, C.sand, C.pinkD, C.purple];
      for (let r = 0; r < 6; r++) {
        const ry = -sh / 2 + 130 + r * 92;
        circle(-sw / 2 + 52, ry, 30, av[r]);
        rrect(-sw / 2 + 98, ry - 20, 120 - (r % 3) * 18, 14, 7, 'rgba(44,37,34,0.6)');
        rrect(-sw / 2 + 98, ry + 6, 160 - (r % 2) * 30, 12, 6, 'rgba(44,37,34,0.22)');
        if (r < 4) {
          const pulse = 1 + 0.12 * Math.max(0, Math.sin(t * 6 - r));
          at(sw / 2 - 40, ry, 0, pulse, pulse, () => { circle(0, 0, 18, C.terracotta); text(String(BUBBLES[r][3]), 0, 2, { size: 20, weight: 700, color: '#FFF8EE' }); });
        }
        ctx.fillStyle = 'rgba(44,37,34,0.08)'; ctx.fillRect(-sw / 2 + 98, ry + 44, sw - 110, 2);
      }
      // --- agent screen
      if (agent > 0) {
        ctx.save(); ctx.globalAlpha *= agent;
        ctx.fillStyle = C.chatBg; ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
        for (let yy = -sh / 2 + 110; yy < sh / 2; yy += 30) for (let xx = -sw / 2 + 16 + ((yy / 30) % 2) * 15; xx < sw / 2; xx += 30) circle(xx, yy, 2.5, 'rgba(46,125,87,0.08)');
        ctx.fillStyle = C.waGreen; ctx.fillRect(-sw / 2, -sh / 2, sw, 86);
        rrect(-sw / 2 + 20, -sh / 2 + 18, 50, 50, 12, C.mascot, [C.ink, 3]);
        rrect(-sw / 2 + 32, -sh / 2 + 34, 6, 14, 3, C.ink); rrect(-sw / 2 + 51, -sh / 2 + 34, 6, 14, 3, C.ink);
        text(TXT.chatName, -sw / 2 + 84, -sh / 2 + 34, { size: 28, weight: 700, color: '#FFFFFF', align: 'left' });
        text(TXT.chatStatus, -sw / 2 + 84, -sh / 2 + 62, { size: 19, weight: 500, color: 'rgba(255,255,255,0.85)', align: 'left' });
        let yy = -sh / 2 + 108;
        ctx.font = font(24, 'DM Sans', 500);
        TXT.chat.forEach(([who, msg, at0]) => {
          const L = wrap(msg, sw - 110);
          const tw = Math.max(...L.map((l) => ctx.measureText(l).width));
          const bw = tw + 34, bh = L.length * 30 + 22;
          const mp = seg(t, at0, at0 + 0.26);
          if (mp > 0) {
            const bx = who === 'out' ? sw / 2 - 18 - bw : -sw / 2 + 18;
            const e = E.outBack(mp);
            ctx.save();
            ctx.globalAlpha *= clamp(mp * 3);
            ctx.translate(bx + (who === 'out' ? bw : 0), yy + bh / 2);
            ctx.scale(e, e);
            ctx.translate(-(who === 'out' ? bw : 0), -bh / 2);
            ctx.save(); setShadow(0.3);
            rrect(0, 0, bw, bh, 16, who === 'out' ? C.bubbleOut : '#FFFFFF');
            ctx.restore();
            L.forEach((ln, i) => text(ln, 17, 26 + i * 30, { size: 24, weight: 500, color: C.charcoal, align: 'left' }));
            ctx.restore();
          }
          yy += bh + 12;
        });
        ctx.restore();
      }
      ctx.restore();
      // notch + glare
      rrect(-46, -h / 2 + 12, 92, 10, 5, 'rgba(0,0,0,0.5)');
    } }));
  }

  // ---------------------------------------------------------------- owner (business owner)
  function ownerMood(t) {
    return {
      worried: 1 - seg(t, 3.0, 3.5) + seg(t, 6.8, 7.2) * 0.25 * (1 - seg(t, 9.3, 9.6)),
      talk: seg(t, 3.3, 3.5) * (1 - seg(t, 6.4, 6.7)),
      happy: seg(t, 9.4, 9.8),
    };
  }
  function drawOwner(t) {
    const md = ownerMood(t);
    const hx = OWNER.x, hy = OWNER.headY + Math.sin(t * 2) * 3;
    const shake = md.worried * Math.sin(t * 9) * 0.05 + md.talk * Math.sin(t * 7) * 0.03;
    // torso
    at(hx, DESK_Y - 90, 0, 1, 1, () => {
      ctx.save(); setShadow(1);
      ctx.beginPath();
      ctx.moveTo(-95, -150); ctx.quadraticCurveTo(0, -178, 95, -150);
      ctx.lineTo(118, 110); ctx.lineTo(-118, 110); ctx.closePath();
      ctx.fillStyle = C.purple; ctx.fill(); ctx.restore();
      ctx.save(); ctx.clip(); ctx.fillStyle = GRAIN; ctx.fillRect(-130, -180, 260, 300); ctx.restore();
      // collar
      ctx.beginPath(); ctx.moveTo(-30, -166); ctx.lineTo(0, -126); ctx.lineTo(30, -166); ctx.closePath();
      ctx.fillStyle = C.cream; ctx.fill();
    });
    // neck
    rrect(hx - 18, hy + 40, 36, 40, 8, C.skinD);
    // head
    at(hx, hy, shake, 1, 1, () => {
      paper({ w: 124, h: 132, r: 60, color: C.skin, seed: 180, elev: 1, amp: 0.8 });
      // hair
      ctx.save();
      ctx.beginPath(); ctx.ellipse(0, -36, 66, 40, 0, Math.PI, 0); ctx.lineTo(66, -20); ctx.quadraticCurveTo(20, -42, -66, -12); ctx.closePath();
      ctx.fillStyle = C.hair; ctx.fill();
      ctx.restore();
      const lx = md.talk * 6 + md.worried * 4, ly = md.worried * -3;
      const blink = blinkAt(t + 0.33);
      for (const s of [-1, 1]) {
        // eyes
        const eh = 12 * (1 - 0.85 * blink) * (1 - md.happy * 0.55 * bell(seg(t, 9.5, 10.4)));
        rrect(s * 22 - 5 + lx, 4 - eh / 2 + ly, 10, eh, 5, C.ink);
        // brows: worried = inner ends up
        ctx.save();
        ctx.strokeStyle = C.hair; ctx.lineWidth = 5; ctx.lineCap = 'round';
        const tilt = md.worried * 0.4 - md.happy * 0.1;
        ctx.translate(s * 22 + lx * 0.5, -16 - md.happy * 3);
        ctx.rotate(-s * tilt);
        ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(11, 0); ctx.stroke();
        ctx.restore();
      }
      // cheeks
      circle(-36, 26, 9, 'rgba(214,120,110,0.35)'); circle(36, 26, 9, 'rgba(214,120,110,0.35)');
      // mouth
      ctx.save();
      ctx.strokeStyle = C.ink; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
      if (md.talk > 0.5) {
        const o = 4 + 7 * Math.abs(Math.sin(t * 14));
        ctx.beginPath(); ctx.ellipse(lx * 0.5, 40, 10, o, 0, 0, Math.PI * 2); ctx.fillStyle = C.ink; ctx.fill();
      } else {
        const curve = lerp(-8 * md.worried, 12, md.happy);
        ctx.beginPath(); ctx.moveTo(-14, 40 - curve * 0.3); ctx.quadraticCurveTo(0, 40 + curve, 14, 40 - curve * 0.3); ctx.stroke();
      }
      ctx.restore();
      // sweat drop
      if (md.worried > 0.3 && t < 3.4) {
        const sp = (t * 0.9) % 1;
        ctx.save(); ctx.globalAlpha = md.worried * (1 - sp);
        ctx.translate(58, -20 + sp * 30);
        ctx.beginPath(); ctx.moveTo(0, -12); ctx.quadraticCurveTo(10, 4, 0, 8); ctx.quadraticCurveTo(-10, 4, 0, -12);
        ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.strokeStyle = 'rgba(44,37,34,0.5)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      }
    });
    // arms
    const sh = [hx - 88, DESK_Y - 222], sh2 = [hx + 88, DESK_Y - 222];
    const worriedL = [hx - 62, hy + 30], worriedR = [hx + 62, hy + 30];
    const restL = [hx - 40, DESK_Y - 16], restR = [hx + 80, DESK_Y - 18];
    const gest = [hx + 150 + Math.sin(t * 6) * 10, hy + 20 + Math.sin(t * 8) * 14];
    const wl = clamp(md.worried * 1.4 - 0.4), tk = md.talk;
    const handL = mix(restL, worriedL, wl);
    let handR = mix(restR, worriedR, wl);
    handR = mix(handR, gest, tk);
    for (const [s, hnd] of [[sh, handL], [sh2, handR]]) {
      const el = [(s[0] + hnd[0]) / 2 + (hnd[0] > s[0] ? 10 : -14), Math.max(s[1], hnd[1]) + 40];
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      setShadow(0.6);
      ctx.strokeStyle = C.purpleD; ctx.lineWidth = 36;
      ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.quadraticCurveTo(el[0], el[1], hnd[0], hnd[1]); ctx.stroke();
      ctx.restore();
      circle(hnd[0], hnd[1], 19, C.skin);
    }
  }
  function drawSay(t) {
    const p = seg(t, 3.3, 3.6), q = seg(t, 6.35, 6.65);
    if (p <= 0 || q >= 1) return;
    const s = E.outBack(p) * (1 - E.in(q));
    at(SAY[0], SAY[1], -0.04, s, s, () => {
      ctx.save(); setShadow(0.8);
      ctx.beginPath(); ctx.moveTo(-60, 40); ctx.lineTo(-96, 96); ctx.lineTo(-20, 50); ctx.closePath();
      ctx.fillStyle = C.paper; ctx.fill(); ctx.restore();
      paper({ w: 190, h: 110, r: 30, color: C.paper, seed: 190, elev: 1, inner: () => {
        for (let k = 0; k < 3; k++) circle(-36 + k * 36, 4 - Math.max(0, Math.sin(t * 9 - k)) * 8, 10, C.charcoalL);
      } });
    });
  }

  // ---------------------------------------------------------------- business cards
  function drawCardFace(i) {
    paper({ w: CARD_W, h: CARD_H, r: 12, color: C.paper, seed: 200 + i, elev: 1.1, inner: () => {
      const iy = -18;
      if (i === 0) { // storefront
        rrect(-46, iy - 14, 92, 56, 3, C.pink);
        for (let k = 0; k < 5; k++) {
          ctx.fillStyle = k % 2 ? C.cream : C.terracotta;
          ctx.beginPath(); ctx.moveTo(-50 + k * 20, iy - 34); ctx.lineTo(-30 + k * 20, iy - 34); ctx.lineTo(-30 + k * 20, iy - 16);
          ctx.arc(-40 + k * 20, iy - 16, 10, 0, Math.PI); ctx.closePath(); ctx.fill();
        }
        rrect(-12, iy + 6, 24, 36, 2, C.charcoal);
        rrect(-38, iy + 6, 18, 16, 2, '#FFFFFF'); rrect(20, iy + 6, 18, 16, 2, '#FFFFFF');
      } else if (i === 1) { // clock
        circle(0, iy + 4, 38, C.charcoal); circle(0, iy + 4, 32, C.cream);
        ctx.save(); ctx.strokeStyle = C.charcoal; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, iy + 4); ctx.lineTo(0, iy - 18); ctx.moveTo(0, iy + 4); ctx.lineTo(15, iy + 12); ctx.stroke(); ctx.restore();
        circle(0, iy + 4, 4, C.orange);
      } else { // price tag
        at(0, iy + 4, -0.5, 1, 1, () => {
          ctx.save(); setShadow(0.4);
          ctx.beginPath(); ctx.moveTo(-40, -22); ctx.lineTo(24, -22); ctx.lineTo(46, 0); ctx.lineTo(24, 22); ctx.lineTo(-40, 22); ctx.closePath();
          ctx.fillStyle = C.orange; ctx.fill(); ctx.restore();
          circle(26, 0, 6, C.paper);
          text('$', -12, 2, { font: 'Fraunces', weight: 800, size: 34, color: '#FFF8EE' });
        });
      }
      text(TXT.cards[i], 0, CARD_H / 2 - 26, { size: 24, weight: 700, color: C.charcoal, maxW: CARD_W - 20 });
    } });
  }
  function cardPose(t, i) {
    const L = launch(i);
    if (t < L) return null;
    const catchP = [MASCOT_X - 6, 1222];
    const stackP = [STACK[0] + [-8, 10, -2][i], STACK[1] - CARD_H * 0.42 - i * 28];
    let x, y, s, r;
    if (t < L + 0.5) {
      const u = (t - L) / 0.5, e = E.sine(u);
      x = lerp(SAY[0], catchP[0], e); y = lerp(SAY[1], catchP[1], e) - 170 * 4 * u * (1 - u);
      s = lerp(0.3, 1, E.out(u)); r = (1 - u) * 1.2 * (i % 2 ? 1 : -1);
    } else if (t < L + 0.68) {
      x = catchP[0]; y = catchP[1] + 8 * bell(seg(t, L + 0.5, L + 0.62)); s = 1; r = 0;
    } else {
      const u = E.inOut(seg(t, L + 0.68, L + 0.95));
      x = lerp(catchP[0], stackP[0], u); y = lerp(catchP[1], stackP[1], u) - 60 * bell(u);
      s = lerp(1, 0.84, u); r = lerp(0, [-0.06, 0.05, -0.02][i], u);
    }
    // assemble into the chat bubble
    const a = E.inOut(seg(t, 7.2 + i * 0.08, 7.75 + i * 0.08));
    if (a > 0) {
      x = lerp(x, ASSEMBLE[0], a); y = lerp(y, ASSEMBLE[1] - 40 * bell(a), a);
      s *= lerp(1, 0.45, a); r = lerp(r, (i - 1) * 0.5, a);
    }
    return { x, y, s, r, alpha: 1 - seg(t, 7.7 + i * 0.08, 7.95 + i * 0.08) };
  }
  function drawCards(t) {
    for (let i = 0; i < 3; i++) {
      const ps = cardPose(t, i);
      if (!ps || ps.alpha <= 0) continue;
      ctx.save(); ctx.globalAlpha = ps.alpha;
      at(ps.x, ps.y, ps.r, ps.s, ps.s, () => drawCardFace(i));
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- assembled chat bubble
  function drawAssembled(t) {
    const p = seg(t, 7.65, 8.1);
    if (p <= 0) return;
    const fly = E.inOut(seg(t, 8.62, 9.05));
    if (fly >= 1) return;
    const pat = 0.1 * bell(seg(t, 8.25, 8.35)) + 0.1 * bell(seg(t, 8.42, 8.52));
    const e = E.outBack(p);
    const x = lerp(ASSEMBLE[0], PHONE.x, fly), y = lerp(ASSEMBLE[1], PHONE.y + 4, fly);
    const w = lerp(210, PHONE.w - 32, fly), h = lerp(150, PHONE.h - 36, fly);
    ctx.save(); ctx.globalAlpha = 1 - seg(fly, 0.7, 1);
    at(x, y, (1 - fly) * -0.05, e * (1 + pat * 0.6), e * (1 - pat), () => {
      // tail
      const tl = 1 - fly;
      if (tl > 0) {
        ctx.save(); setShadow(0.8);
        ctx.beginPath(); ctx.moveTo(-w / 2 + 30, h / 2 - 20); ctx.lineTo(-w / 2 + 10, h / 2 + 34 * tl); ctx.lineTo(-w / 2 + 80, h / 2 - 10); ctx.closePath();
        ctx.fillStyle = C.orange; ctx.fill(); ctx.restore();
      }
      // three folded layers (the business cards)
      [[C.purpleL, 10, 12, 0.03], [C.pink, -8, 7, -0.025]].forEach(([col, dx, dy, rr], k) => at(dx, dy, rr, 1, 1, () => paper({ w, h, r: lerp(40, 30, fly), color: col, seed: 210 + k, elev: 0.8 })));
      paper({ w, h, r: lerp(40, 30, fly), color: C.orange, seed: 212, elev: 1.3, inner: () => {
        ctx.globalAlpha *= 1 - fly;
        for (let k = 0; k < 3; k++) circle(-40 + k * 40, 0, 12, '#FFF8EE');
      } });
    });
    ctx.restore();
  }

  // ---------------------------------------------------------------- calendar, sign, title
  function drawCalendar(t) {
    const p = seg(t, 11.25, 11.75);
    if (p <= 0) return;
    const { x, y, w, h } = CAL;
    const u = E.outBack(p);
    ctx.save(); ctx.globalAlpha = clamp(p * 4);
    at(x, y - h / 2, 0.05 * (1 - u) + 0.04, 1, Math.max(0.02, u), () => at(0, h / 2, 0, 1, 1, () => paper({
      w, h, r: 14, color: C.paper, seed: 220, elev: 1.4, fold: 1 - clamp(u),
      inner: () => {
        ctx.fillStyle = C.terracotta; ctx.fillRect(-w / 2, -h / 2, w, 50);
        text('MAÑANA', 0, -h / 2 + 27, { size: 24, weight: 700, color: '#FFF8EE', ls: 2 });
        for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
          const hi = r === 1 && c === 2;
          rrect(-w / 2 + 18 + c * 40, -h / 2 + 66 + r * 38, 32, 30, 5, hi ? C.orange : 'rgba(44,37,34,0.1)');
        }
      },
    })));
    // ring binders
    at(x, y - h / 2, 0.04, 1, 1, () => { rrect(-50, -14, 12, 28, 6, C.charcoal); rrect(38, -14, 12, 28, 6, C.charcoal); });
    const ck = seg(t, 11.85, 12.2);
    if (ck > 0) { const s = E.outBack(ck); at(x + w / 2 - 6, y + h / 2 - 10, 0, s, s, () => { ctx.save(); setShadow(0.8); checkMark(0, 0, 34, ck); ctx.restore(); }); }
    ctx.restore();
  }
  function drawSign(t) {
    const p = seg(t, 12.15, 12.7);
    if (p <= 0) return;
    const { x, y, w, h } = SIGN;
    const u = E.outBack(p);
    ctx.save(); ctx.globalAlpha = clamp(p * 4);
    // hinged at its top edge, unfolds downward onto the desk front
    at(x, y - h / 2, -0.012 + (1 - u) * 0.04, 1, Math.max(0.02, u), () => at(0, h / 2, 0, 1, 1, () => paper({
      w, h, r: 10, color: '#FFFFFF', seed: 230, elev: 1.6, fold: 1 - clamp(u),
      inner: () => {
        if (LOGO.complete && LOGO.naturalWidth) {
          const lw = w - 110, lh = lw * LOGO.naturalHeight / LOGO.naturalWidth;
          ctx.save();
          ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(LOGO, -lw / 2, -lh / 2, lw, lh);
          ctx.restore();
        }
      },
    })));
    // pins
    const pp = seg(t, 12.55, 12.75);
    if (pp > 0) for (const sx of [-1, 1]) at(x + sx * (w / 2 - 26), y - h / 2 + 22, 0, E.outBack(pp), E.outBack(pp), () => {
      ctx.save(); setShadow(0.5); circle(0, 0, 10, C.charcoal); ctx.restore();
      circle(-3, -3, 3, 'rgba(255,255,255,0.5)');
    });
    ctx.restore();
  }
  function drawTitle(t) {
    const [l1, l2] = TXT.title;
    ctx.save();
    ctx.letterSpacing = '4px';
    let size = 104;
    ctx.font = font(size, 'Fraunces', 800);
    const mw = Math.max(ctx.measureText(l1).width, ctx.measureText(l2).width);
    if (mw > 900) { size *= 900 / mw; ctx.font = font(size, 'Fraunces', 800); }
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    let k = 0;
    [[l1, 370, C.charcoal], [l2, 370 + size * 1.05, C.terracotta]].forEach(([str, by, col]) => {
      let xx = 540 - ctx.measureText(str).width / 2;
      for (const ch of str) {
        const cw = ctx.measureText(ch).width;
        const a = 12.3 + k * 0.03, p = seg(t, a, a + 0.38);
        if (p > 0) {
          const e = E.outBack(p);
          ctx.save();
          ctx.globalAlpha = clamp(p * 3);
          ctx.translate(xx + cw / 2, by + (1 - e) * 40);
          ctx.rotate((1 - E.out(p)) * (k % 2 ? 0.2 : -0.2));
          ctx.scale(lerp(0.6, 1, e), lerp(0.6, 1, e));
          ctx.fillStyle = 'rgba(80,40,20,0.16)'; ctx.fillText(ch, -cw / 2 + 3, 4);
          ctx.fillStyle = col; ctx.fillText(ch, -cw / 2, 0);
          ctx.restore();
        }
        xx += cw; k++;
      }
    });
    ctx.restore();
    const p = seg(t, 12.95, 13.35);
    if (p > 0) {
      ctx.save(); ctx.globalAlpha = clamp(p * 3);
      at(540, 370 + size * 1.05 + 92 + (1 - E.out(p)) * 30, -0.015, 1, Math.max(0.05, E.outBack(p)), () => paper({ w: 380, h: 78, r: 8, color: C.pinkL, seed: 240, elev: 1, inner: () => {
        text(TXT.subtitle, 0, 3, { size: 44, weight: 700, color: C.charcoal, maxW: 340 });
      } }));
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- mascot choreography
  function mascotState(t) {
    const m = { x: MASCOT_X, y: DESK_Y, s: MASCOT_S, lookX: 0, lookY: 0, blink: blinkAt(t), surprise: 0, armL: 0, armR: 0, walkPhase: 0, walkAmt: 0, squash: 0, air: 0, tilt: 0 };
    const breathe = 0.012 * Math.sin(t * 2 * Math.PI * 0.8);
    const idle = 0.05 * Math.sin(t * 2.5);
    const hs = hopSeq(t, [1200, DESK_Y], [
      { t0: 1.25, t1: 1.62, x: 1030, y: DESK_Y, h: 110 },
      { t0: 1.78, t1: 2.12, x: MASCOT_X, y: DESK_Y, h: 80 },
    ]);
    m.x = hs.x; m.y = hs.y; m.air = hs.air;
    const extra = [];
    // catches: a small bounce as each card lands in its arms
    for (let i = 0; i < 3; i++) extra.push(jump(t, launch(i) + 0.42, launch(i) + 0.55, 14));
    extra.push(jump(t, 12.55, 12.85, 30));
    for (const j of extra) { m.air += j.air; m.y -= j.air; m.squash += j.squash; }
    m.squash += hs.squash + (hs.inAir ? 0 : breathe);
    // nods after placing each card + satisfied nod after the pat
    for (let i = 0; i < 3; i++) m.squash += 0.09 * bell(seg(t, launch(i) + 0.95, launch(i) + 1.15));
    m.squash += 0.1 * bell(seg(t, 8.55, 8.75));
    // proud chest-out
    const proud = seg(t, 9.35, 9.6) * (1 - seg(t, 10.9, 11.0)) + seg(t, 12.6, 12.9);
    m.squash -= proud * 0.045;
    // looks
    let look = kf(t, [
      [0, [-1, -0.5]], [2.1, [-1, -0.5]], [2.3, [-0.7, -1]], [3.0, [-0.7, -1]], [3.35, [-1, -0.3]],
    ]);
    for (let i = 0; i < 3; i++) {
      const L = launch(i);
      if (t >= L - 0.05 && t < L + 1.2) {
        look = kf(t, [[L - 0.05, [-1, -0.3]], [L + 0.25, [-0.6, -1]], [L + 0.5, [-0.1, -1]], [L + 0.7, [-0.9, 0.5]], [L + 1.0, [-0.9, 0.6]], [L + 1.2, [-1, -0.2]]]);
      }
    }
    if (t >= 6.2) look = kf(t, [
      [6.2, [-1, -0.2]], [7.1, [-1, -0.2]], [7.25, [-0.9, 0.4]], [8.1, [-0.9, 0.3]], [8.6, [-0.9, 0.3]], [8.75, [-1, -0.4]],
      [9.1, [-1, -0.5]], [10.9, [-1, -0.5]], [11.05, [-1, -0.7]], [11.4, [-0.6, -1]], [12.3, [-0.6, -1]], [12.5, [0, 0.05]],
    ]);
    m.lookX = look[0]; m.lookY = look[1];
    m.tilt = 0.07 * bell(seg(t, 2.25, 3.2)) * -1;
    m.surprise = kf(t, [[2.1, 0], [2.2, 0.45], [2.6, 0.45], [2.9, 0]]);
    // arms
    let aL = idle, aR = -idle;
    for (let i = 0; i < 3; i++) {
      const L = launch(i);
      const up = seg(t, L + 0.3, L + 0.45) * (1 - seg(t, L + 0.68, L + 0.85));
      aL += 0.95 * up; aR += 0.95 * up;
      const place = bell(seg(t, L + 0.7, L + 0.95));
      aL += 0.5 * place;
    }
    // gather + pat the bubble (left arm)
    aL += 0.6 * bell(seg(t, 7.2, 7.8));
    aL += 0.75 * (bell(seg(t, 8.15, 8.33)) + bell(seg(t, 8.33, 8.51)));
    // point at the phone
    const point = seg(t, 11.0, 11.2) * (1 - seg(t, 12.25, 12.45));
    aL += 0.55 * point;
    // proud arms
    aL += proud * 0.2; aR += proud * 0.2 + 0.7 * bell(seg(t, 12.55, 12.95));
    if (hs.inAir) { aL += 0.5; aR += 0.5; }
    m.armL = aL; m.armR = aR;
    return m;
  }

  // ---------------------------------------------------------------- frame
  function renderFrame(tReal) {
    const t = toBase(tReal);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.shadowColor = 'transparent';
    drawBackground(t);
    const z = kf(t, [[0, 1.0], [13.5, 1.0], [15, 1.02, E.sine]]);
    ctx.save();
    ctx.translate(540, 960); ctx.scale(z, z); ctx.translate(-540, -960);
    strip(t, TXT.line1, 3.6, 6.9, 300, C.paper, C.charcoal);
    strip(t, TXT.line2, 8.9, 11.0, 300, C.orange, '#FFF8EE');
    drawBubbles(t);
    drawCalendar(t);
    drawPhone(t);
    drawOwner(t);
    drawSay(t);
    drawDesk();
    drawSign(t);
    drawMascot(mascotState(t));
    drawCards(t);
    drawAssembled(t);
    drawTitle(t);
    ctx.restore();
  }

  window.ANIM = {
    duration: DURATION,
    ready: (async () => {
      await Promise.all([
        document.fonts.load('600 50px "Fraunces"'), document.fonts.load('800 50px "Fraunces"'),
        document.fonts.load('500 20px "DM Sans"'), document.fonts.load('700 20px "DM Sans"'),
        LOGO.decode().catch(() => {}),
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

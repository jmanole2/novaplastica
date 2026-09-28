/* Claude Academy — paper-cut intro.
 * Everything is drawn procedurally on a 1080x1920 canvas.
 * All choreography is authored on a 20 s "base" timeline (see SCENES);
 * animation.config.json can stretch each scene independently.
 */
'use strict';
(() => {
  const DEFAULT_CFG = {
    width: 1080, height: 1920, fps: 30,
    scenes: { intro: 3, workspace: 4, modules: 5, ecosystem: 4, finale: 4 },
    expressiveness: { surprise: 1, hopHeight: 1 },
    text: {
      claudeCard: 'Claude',
      tagline: ['Think.', 'Create.', 'Solve.'],
      modules: ['Claude.ai', 'Projects + Skills', 'Connectors + Search', 'Real-world workflows', 'Claude Academy'],
      title: ['CLAUDE', 'ACADEMY'],
      subtitle: 'Aprende a trabajar con Claude',
    },
  };
  const USER = window.ANIM_CONFIG || {};
  const CFG = {
    ...DEFAULT_CFG, ...USER,
    scenes: { ...DEFAULT_CFG.scenes, ...(USER.scenes || {}) },
    expressiveness: { ...DEFAULT_CFG.expressiveness, ...(USER.expressiveness || {}) },
    text: { ...DEFAULT_CFG.text, ...(USER.text || {}) },
  };
  const SUR = CFG.expressiveness.surprise;
  const HOP = CFG.expressiveness.hopHeight;
  const TXT = CFG.text;

  const W = 1080, H = 1920;
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');

  // ---------------------------------------------------------------- timeline
  const SCENES = [['intro', 3], ['workspace', 4], ['modules', 5], ['ecosystem', 4], ['finale', 4]];
  const DURATION = SCENES.reduce((s, [k]) => s + CFG.scenes[k], 0);
  function toBase(t) {
    let acc = 0, bacc = 0;
    for (const [k, bd] of SCENES) {
      const d = CFG.scenes[k];
      if (t < acc + d || k === 'finale') return bacc + Math.min(bd, Math.max(0, t - acc) * bd / d);
      acc += d; bacc += bd;
    }
    return 20;
  }

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

  // ---------------------------------------------------------------- palette
  const C = {
    bg: '#F1E6D4', sheetA: '#E8D8BE', sheetB: '#EDD0C4', sheetC: '#DCD3E6',
    cream: '#FCF7EE', paper: '#F7EFE2', sand: '#E4CFAF', sandD: '#C9AE88',
    terracotta: '#C2603F', terracottaD: '#A24C31', orange: '#DD7C4E', orangeL: '#F0A77C',
    pink: '#E8B3A6', pinkL: '#F2CFC5', pinkD: '#D48F84',
    purple: '#8A78B0', purpleL: '#C6BAE0', purpleD: '#5E4E78',
    charcoal: '#2C2522', charcoalL: '#473C37', ink: '#221B18',
    mascot: '#D6774B', mascotD: '#B45A33', mascotL: '#EFA27A',
  };

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
  const BLINKS = [0.5, 2.55, 4.45, 6.9, 8.4, 9.9, 11.4, 13.9, 16.9, 18.95];
  function blinkAt(t) { let b = 0; for (const s of BLINKS) b = Math.max(b, bell(seg(t, s, s + 0.16))); return b; }

  // ---------------------------------------------------------------- layout
  const BOARD_S1 = [450, 1120, 850, 1480];
  const BOARD_S2 = [80, 330, 1000, 1480];
  const HUB3 = [300, 330, 780, 620];
  const HUB4 = [390, 870, 690, 1080];
  const PLAQUE = [110, 820, 970, 1240];

  function boardRect(t) {
    return kf(t, [
      [0, BOARD_S1], [2.0, BOARD_S1], [3.05, BOARD_S2, E.outSoft], [7.12, BOARD_S2],
      [7.9, HUB3], [12.0, HUB3], [12.7, HUB4], [16.35, HUB4], [17.15, PLAQUE], [99, PLAQUE],
    ]);
  }
  // [x0, x1, y, thickness, frontHeight, alpha]
  function deskState(t) {
    const d = kf(t, [
      [0, [40, 1040, 1480, 26, 520, 1]], [7.12, [40, 1040, 1480, 26, 520, 1]],
      [7.9, [270, 810, 620, 16, 0, 1]], [12.0, [270, 810, 620, 16, 0, 1]],
      [12.7, [360, 720, 1080, 14, 0, 1]], [16.1, [360, 720, 1080, 14, 0, 1]], [16.45, [440, 640, 1080, 14, 0, 0]],
    ]);
    return { x0: d[0], x1: d[1], y: d[2], th: d[3], front: t < 7.12 ? d[4] : 520 * (1 - E.out(seg(t, 7.12, 7.5))), alpha: d[5] };
  }
  const bc = (b) => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];

  // ---------------------------------------------------------------- background
  function drawBackground(t, cam) {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = GRAIN;
    ctx.fillRect(0, 0, W, H);
    const px = (cam[0] - 540) * 0.08, py = (cam[1] - 960) * 0.05;
    const drift = Math.sin(t * 0.35) * 6;
    at(880 - px, 120 - py + drift, 0.2, 1, 1, () => paper({ w: 680, h: 460, r: 4, color: C.sheetA, seed: 21, amp: 5, elev: 0.5 }));
    at(160 - px * 1.3, 1860 - py - drift, -0.13, 1, 1, () => paper({ w: 760, h: 420, r: 4, color: C.sheetB, seed: 22, amp: 5, elev: 0.5 }));
    at(1060 - px * 1.2, 1480 - py + drift * 0.5, -0.35, 1, 1, () => paper({ w: 300, h: 520, r: 4, color: C.sheetC, seed: 23, amp: 4, elev: 0.4 }));
    at(-20 - px, 380 - py, 0.3, 1, 1, () => paper({ w: 220, h: 300, r: 4, color: C.pinkL, seed: 24, amp: 4, elev: 0.4 }));
    const v = ctx.createRadialGradient(540, 960, 500, 540, 960, 1250);
    v.addColorStop(0, 'rgba(90,50,25,0)');
    v.addColorStop(1, 'rgba(90,50,25,0.16)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  // ---------------------------------------------------------------- the board (central workspace)
  function drawBoard(t) {
    const b = boardRect(t), [cx, cy] = bc(b), w = b[2] - b[0], h = b[3] - b[1];
    const spread = kf(t, [[0, 0.5], [2.1, 0.5], [3.3, 1], [7.1, 1], [7.9, 0.55], [16.4, 0.55], [17.5, 1.25, E.outSoft], [99, 1.25]]);
    const layers = [
      { color: C.purpleL, dx: 20, dy: 26, rot: 0.018, seed: 31 },
      { color: C.pink, dx: -18, dy: 18, rot: -0.016, seed: 32 },
      { color: C.terracotta, dx: 10, dy: 12, rot: 0.006, seed: 33 },
    ];
    layers.forEach((L, i) => {
      const lag = i * 0.08;
      const sp = kf(t - lag, [[0, 0.5], [2.1, 0.5], [3.3, 1], [7.1, 1], [7.9, 0.55], [16.4, 0.55], [17.5, 1.25, E.outSoft], [99, 1.25]]);
      at(cx + L.dx * sp, cy + L.dy * sp, L.rot * sp, 1, 1, () => paper({ w, h, r: 10, color: L.color, seed: L.seed, elev: 0.8 }));
    });
    void spread;
    at(cx, cy, 0, 1, 1, () => paper({
      w, h, r: 10, color: C.cream, seed: 30, elev: 1.3,
      inner: () => {
        // dot grid — the "thinking environment"
        const dg = kf(t, [[2.5, 0], [3.1, 1], [6.95, 1], [7.4, 0]]);
        if (dg > 0) {
          ctx.fillStyle = `rgba(120,90,70,${0.22 * dg})`;
          for (let x = -w / 2 + 30; x < w / 2; x += 40) for (let y = -h / 2 + 30; y < h / 2; y += 40) ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
        }
        // miniatures of the collected work (hub state)
        const mi = kf(t, [[7.45, 0], [7.95, 1], [16.15, 1], [16.45, 0]]);
        if (mi > 0) drawMinis(w, h, mi);
      },
    }));
    drawTitle(t, b);
  }
  function drawMinis(w, h, a) {
    ctx.save();
    ctx.globalAlpha *= a;
    const items = [
      [-0.27, -0.22, 0.3, 0.36, C.paper, -0.04], [0.2, -0.24, 0.22, 0.26, C.pink, 0.05],
      [0.24, 0.16, 0.34, 0.3, C.charcoal, -0.02], [-0.22, 0.22, 0.3, 0.28, C.purpleL, 0.04],
    ];
    items.forEach(([x, y, iw, ih, col, r], i) => {
      at(x * w, y * h, r, 1, 1, () => paper({
        w: iw * w, h: ih * h, r: 4, color: col, seed: 40 + i, elev: 0.35, dark: col === C.charcoal, amp: 0.6,
        inner: () => {
          const lc = col === C.charcoal ? 'rgba(240,167,124,0.8)' : 'rgba(44,37,34,0.22)';
          const lw = iw * w * 0.6, lh = Math.max(2, ih * h * 0.07);
          lines(-iw * w / 2 + iw * w * 0.15, -ih * h / 2 + ih * h * 0.22, [lw, lw * 0.7, lw * 0.85], ih * h * 0.2, lh, lc);
        },
      }));
    });
    ctx.restore();
  }

  // ---------------------------------------------------------------- the "Claude" card
  function drawClaudeCard(t) {
    const p = seg(t, 0.95, 1.6);
    if (p <= 0) return;
    const out = seg(t, 16.0, 16.35);
    if (out >= 1) return;
    const b = boardRect(t);
    const sc = kf(t, [[0, 1], [2.0, 1], [3.05, 1.12], [7.12, 1.12], [7.9, 0.95], [12.0, 0.95], [12.7, 0.72], [99, 0.72]]);
    const flip = lerp(Math.PI, 0, E.out(clamp(p * 1.15)));
    const fx = Math.cos(flip);
    const rise = (1 - E.outBack(p)) * 90;
    const rot = lerp(-0.2, -0.035, E.out(p)) + Math.sin(t * 1.7) * 0.006;
    const x = (b[0] + b[2]) / 2, y = b[1] - 4 * sc + rise;
    at(x, y, rot, sc * fx, sc * (1 - E.in(out)), () => {
      paper({
        w: 214, h: 88, r: 8, color: fx < 0 ? C.terracotta : '#FFFCF6', seed: 50, elev: 1.1,
        inner: () => {
          if (fx >= 0) {
            ctx.strokeStyle = 'rgba(194,96,63,0.55)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect(-99, -36, 198, 72, 5); ctx.stroke();
            text(TXT.claudeCard, 0, 3, { font: 'Fraunces', weight: 600, size: 50, color: C.charcoal, maxW: 180 });
          }
        },
      });
      // tape
      const tp = seg(t, 1.5, 1.75);
      if (tp > 0 && fx > 0) {
        ctx.save(); ctx.globalAlpha = tp * 0.85;
        at(0, -46, 0.06, 1, 1, () => {
          ctx.fillStyle = 'rgba(228,207,175,0.9)';
          ctx.fillRect(-38, -12, 76, 24);
          ctx.fillStyle = GRAIN; ctx.fillRect(-38, -12, 76, 24);
        });
        ctx.restore();
      }
    });
  }

  // ---------------------------------------------------------------- workspace items (scene 2)
  const ITEMS = [
    { k: 'doc', x: 285, y: 620, w: 300, h: 360, rot: -0.05 },
    { k: 'sticky', x: 805, y: 565, w: 215, h: 215, rot: 0.07 },
    { k: 'code', x: 770, y: 895, w: 390, h: 250, rot: -0.03 },
    { k: 'chart', x: 285, y: 1035, w: 320, h: 250, rot: 0.045 },
    { k: 'research', x: 805, y: 1220, w: 285, h: 230, rot: -0.05 },
    { k: 'todo', x: 300, y: 1335, w: 235, h: 160, rot: -0.08 },
  ];
  const itemStart = (i) => 3.15 + i * 0.16;
  function itemPose(t, i) {
    const it = ITEMS[i], a = itemStart(i), p = seg(t, a, a + 0.8);
    const c = 7.0 + i * 0.04, q = seg(t, c, c + 0.45);
    if (p <= 0 || q >= 1) return null;
    const O = [540, 900], T = [it.x, it.y];
    const ctrl = [(O[0] + T[0]) / 2 + (T[0] - O[0]) * 0.2, Math.min(O[1], T[1]) - 150];
    let pos = quad(O, ctrl, T, E.out(p));
    let sc = lerp(0.12, 1, E.outBack(p));
    let rot = it.rot + (1 - E.out(p)) * (i % 2 ? 0.6 : -0.6);
    let sy = E.out(clamp(p * 1.6));
    if (q > 0) {
      const bcn = bc(boardRect(t)), e = E.in(q);
      pos = [lerp(pos[0], bcn[0], e), lerp(pos[1], bcn[1], e)];
      sc *= lerp(1, 0.12, e);
      rot += e * (i % 2 ? -0.5 : 0.5);
      sy *= 1 - E.in(clamp(q * 1.3 - 0.3));
    }
    return { x: pos[0], y: pos[1], sc, rot, sy, fold: 1 - sy, alpha: clamp(p * 5) * (1 - seg(q, 0.75, 1)), land: a + 0.8 };
  }
  function drawThreads(t) {
    const pairs = [[0, 2], [0, 3], [1, 2], [2, 4], [3, 5], [4, 5], [0, 1]];
    const fade = 1 - seg(t, 6.95, 7.12);
    if (fade <= 0) return;
    pairs.forEach(([a, b], k) => {
      const f = E.inOut(seg(t, 4.75 + k * 0.07, 5.15 + k * 0.07));
      if (f <= 0) return;
      const A = ITEMS[a], B = ITEMS[b];
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2 + 30;
      ctx.save();
      ctx.globalAlpha = 0.55 * fade;
      ctx.strokeStyle = C.charcoalL; ctx.lineWidth = 3; ctx.setLineDash([10, 9]); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(A.x, A.y);
      const N = 30;
      for (let i = 1; i <= Math.round(N * f); i++) { const [x, y] = quad([A.x, A.y], [mx, my], [B.x, B.y], i / N); ctx.lineTo(x, y); }
      ctx.stroke();
      ctx.restore();
    });
  }
  function pin(x, y, col) {
    ctx.save(); setShadow(0.5); circle(x, y, 9, col); ctx.restore();
    circle(x - 2.5, y - 2.5, 3, 'rgba(255,255,255,0.55)');
  }
  const CODE = [
    [['function ', C.orangeL], ['solve', C.purpleL], ['(task) {', '#EFE6D8']],
    [['  const ', C.orangeL], ['idea', '#EFE6D8'], [' = ', '#A3968C'], ['think', C.purpleL], ['(task);', '#EFE6D8']],
    [['  return ', C.orangeL], ['create', C.purpleL], ['(idea);', '#EFE6D8']],
    [['}', '#EFE6D8']],
  ];
  function drawItem(t, i) {
    const ps = itemPose(t, i);
    if (!ps) return;
    const it = ITEMS[i], w = it.w, h = it.h, since = t - ps.land;
    ctx.save();
    ctx.globalAlpha = ps.alpha;
    at(ps.x, ps.y, ps.rot, ps.sc, ps.sc * Math.max(0.02, ps.sy), () => {
      if (it.k === 'doc') {
        paper({ w, h, r: 6, color: '#FFFDF8', seed: 60, elev: 1, fold: ps.fold, inner: () => {
          const x0 = -w / 2 + 30, y0 = -h / 2 + 34;
          rrect(x0, y0, 160, 18, 9, C.terracotta);
          rrect(x0, y0 + 32, 110, 11, 6, C.pink);
          lines(x0, y0 + 66, [240, 225, 236, 180], 22, 9, 'rgba(44,37,34,0.2)');
          rrect(x0, y0 + 160, 110, 80, 6, C.purpleL);
          lines(x0 + 124, y0 + 166, [110, 96, 104, 70], 20, 9, 'rgba(44,37,34,0.2)');
          lines(x0, y0 + 262, [236, 214], 22, 9, 'rgba(44,37,34,0.2)');
          // folded corner
          ctx.fillStyle = 'rgba(200,170,140,0.55)';
          ctx.beginPath(); ctx.moveTo(w / 2 - 38, -h / 2); ctx.lineTo(w / 2, -h / 2 + 38); ctx.lineTo(w / 2 - 38, -h / 2 + 38); ctx.closePath(); ctx.fill();
        } });
        pin(0, -h / 2 + 14, C.orange);
      } else if (it.k === 'sticky') {
        paper({ w, h, r: 4, color: C.pink, seed: 61, elev: 1, fold: ps.fold, inner: () => {
          ctx.fillStyle = 'rgba(180,100,90,0.18)'; ctx.fillRect(-w / 2, -h / 2, w, 34);
          ctx.strokeStyle = 'rgba(44,37,34,0.72)'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
          for (let r = 0; r < 3; r++) {
            const y = -h / 2 + 70 + r * 36, len = [140, 110, 128][r];
            ctx.beginPath(); ctx.moveTo(-w / 2 + 28, y);
            for (let x = 0; x <= len; x += 6) ctx.lineTo(-w / 2 + 28 + x, y + Math.sin(x * 0.28 + r * 2) * 4 * (0.6 + 0.4 * Math.sin(x * 0.07)));
            ctx.stroke();
          }
          // hand-drawn circle / check
          ctx.strokeStyle = C.terracottaD; ctx.lineWidth = 3.5;
          ctx.beginPath(); ctx.moveTo(w / 2 - 62, -h / 2 + 170); ctx.lineTo(w / 2 - 50, -h / 2 + 182); ctx.lineTo(w / 2 - 28, -h / 2 + 152); ctx.stroke();
        } });
        pin(0, -h / 2 + 16, C.purple);
      } else if (it.k === 'code') {
        paper({ w, h, r: 10, color: C.charcoal, seed: 62, elev: 1.1, dark: true, fold: ps.fold, inner: () => {
          ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(-w / 2, -h / 2, w, 38);
          [C.pink, C.orange, C.purpleL].forEach((c, k) => circle(-w / 2 + 24 + k * 20, -h / 2 + 19, 6, c));
          text('< / >', w / 2 - 44, -h / 2 + 20, { font: 'JetBrains Mono', weight: 500, size: 15, color: 'rgba(255,255,255,0.35)' });
          const chars = Math.floor(Math.max(0, t - 4.55) * 62);
          let n = 0, cx = 0, cy = 0;
          ctx.font = font(20, 'JetBrains Mono', 500);
          ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
          const cw = ctx.measureText('m').width;
          CODE.forEach((ln, r) => {
            let x = -w / 2 + 24;
            const y = -h / 2 + 72 + r * 38;
            text(String(r + 1), -w / 2 + 12, y, { font: 'JetBrains Mono', weight: 500, size: 13, color: 'rgba(255,255,255,0.25)', align: 'left' });
            for (const [s, col] of ln) {
              for (const ch of s) {
                if (n >= chars) break;
                ctx.fillStyle = col; ctx.fillText(ch, x + 4, y);
                x += cw; n++; cx = x; cy = y;
              }
            }
          });
          if (Math.floor(t * 3) % 2 === 0 && t < 7) rrect(cx + 5, cy - 11, 11, 22, 2, C.orangeL);
        } });
      } else if (it.k === 'chart') {
        paper({ w, h, r: 6, color: '#FFFBF3', seed: 63, elev: 1, fold: ps.fold, inner: () => {
          rrect(-w / 2 + 26, -h / 2 + 24, 130, 14, 7, C.charcoalL);
          rrect(-w / 2 + 26, -h / 2 + 46, 80, 9, 5, 'rgba(44,37,34,0.2)');
          const base = h / 2 - 30;
          ctx.fillStyle = 'rgba(44,37,34,0.35)'; ctx.fillRect(-w / 2 + 26, base, w - 52, 3);
          const hs = [0.42, 0.66, 0.52, 0.88, 0.74], cols = [C.pink, C.orange, C.purpleL, C.terracotta, C.orangeL];
          hs.forEach((hh, k) => {
            const g = E.outBack(seg(t, ps.land + 0.05 + k * 0.08, ps.land + 0.5 + k * 0.08));
            const bh = hh * 130 * g, bw = 36, x = -w / 2 + 40 + k * 52;
            rrect(x, base - bh, bw, bh, 4, cols[k]);
          });
        } });
        pin(w / 2 - 26, -h / 2 + 20, C.terracotta);
      } else if (it.k === 'research') {
        paper({ w, h, r: 6, color: '#FFFDF8', seed: 64, elev: 1, fold: ps.fold, inner: () => {
          const x0 = -w / 2 + 24, y0 = -h / 2 + 30;
          rrect(x0, y0, 150, 15, 7, C.purple);
          const sweep = E.inOut(seg(t, 5.85, 6.3));
          if (sweep > 0) rrect(x0 - 4, y0 + 58, 220 * sweep, 20, 6, 'rgba(240,167,124,0.6)');
          lines(x0, y0 + 32, [200, 214, 180, 226, 150, 204, 190], 21, 8, 'rgba(44,37,34,0.2)');
          rrect(w / 2 - 88, h / 2 - 78, 62, 52, 5, C.pink);
          // magnifier
          ctx.save(); ctx.translate(w / 2 - 88, -h / 2 + 96);
          ctx.fillStyle = 'rgba(252,247,238,0.55)'; ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = C.charcoal; ctx.lineWidth = 7; ctx.stroke();
          ctx.lineCap = 'round'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(24, 24); ctx.lineTo(48, 48); ctx.stroke();
          ctx.restore();
        } });
        pin(-w / 2 + 22, -h / 2 + 14, C.pinkD);
      } else if (it.k === 'todo') {
        paper({ w, h, r: 6, color: C.purpleL, seed: 65, elev: 1, fold: ps.fold, inner: () => {
          for (let r = 0; r < 3; r++) {
            const y = -h / 2 + 36 + r * 44, x = -w / 2 + 26;
            ctx.strokeStyle = C.charcoal; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.roundRect(x, y - 12, 24, 24, 4); ctx.stroke();
            rrect(x + 40, y - 5, [140, 116, 128][r], 10, 5, 'rgba(44,37,34,0.35)');
            const ck = E.out(seg(t, 4.85 + r * 0.16, 5.0 + r * 0.16));
            if (ck > 0) {
              ctx.strokeStyle = C.terracottaD; ctx.lineWidth = 4.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
              const P = [[x + 3, y], [x + 11, y + 9], [x + 30, y - 16]];
              ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
              if (ck < 0.4) ctx.lineTo(lerp(P[0][0], P[1][0], ck / 0.4), lerp(P[0][1], P[1][1], ck / 0.4));
              else { ctx.lineTo(P[1][0], P[1][1]); const k = (ck - 0.4) / 0.6; ctx.lineTo(lerp(P[1][0], P[2][0], k), lerp(P[1][1], P[2][1], k)); }
              ctx.stroke();
            }
          }
        } });
      }
    });
    ctx.restore();
  }

  // ---------------------------------------------------------------- tagline (scene 2)
  function drawTagline(t) {
    const tags = TXT.tagline;
    const cols = [['#FFFBF3', C.charcoal], [C.orange, '#FFF8EE'], [C.purple, '#FFF8EE']];
    const rots = [-0.05, 0.03, -0.035];
    tags.forEach((word, i) => {
      const a = 4.7 + i * 0.5, p = seg(t, a, a + 0.45);
      if (p <= 0) return;
      const q = seg(t, 6.85 + i * 0.05, 7.12 + i * 0.05);
      if (q >= 1) return;
      const x = 225 + i * 315, y = 1612 - (1 - E.outBack(p)) * 50;
      const s = lerp(1.25, 1, E.out(p));
      ctx.save();
      ctx.globalAlpha = clamp(p * 4);
      at(x, y, rots[i] + (1 - E.out(p)) * 0.2, s, s * (1 - E.in(q)), () => {
        paper({ w: 270, h: 112, r: 8, color: cols[i][0], seed: 70 + i, elev: 1.2, fold: q, inner: () => {
          text(word, 0, 4, { font: 'Fraunces', weight: 600, size: 58, color: cols[i][1], maxW: 230 });
        } });
      });
      ctx.restore();
    });
  }

  // ---------------------------------------------------------------- desk
  function drawDesk(t) {
    const d = deskState(t);
    if (d.alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = d.alpha;
    const w = d.x1 - d.x0, cx = (d.x0 + d.x1) / 2;
    if (d.front > 2) {
      at(cx, d.y + d.th + d.front / 2 - 4, 0, 1, 1, () => paper({ w: w - 30, h: d.front, r: 6, color: C.terracotta, seed: 80, elev: 1, inner: () => {
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.fillRect(-w / 2 + 30, -d.front / 2 + 20, w - 90, 6);
        ctx.fillStyle = 'rgba(70,25,10,0.16)';
        ctx.fillRect(-w / 2, d.front / 2 - 150, w, 150);
      } }));
    }
    at(cx, d.y + d.th / 2, 0, 1, 1, () => paper({ w, h: d.th, r: Math.min(6, d.th / 2), color: C.charcoal, seed: 81, elev: 1.2, dark: true, inner: () => {
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(-w / 2, -d.th / 2, w, 3);
    } }));
    ctx.restore();
  }

  // ---------------------------------------------------------------- modules (scene 3)
  const CARD_W = 640, CARD_H = 130;
  const CARD_X = [410, 670, 410, 670, 410];
  const CARD_Y = [800, 980, 1160, 1340, 1520];
  const cardStart = (j) => 7.95 + j * 0.78;
  function cardPose(t, j) {
    const a = cardStart(j), p = seg(t, a, a + 0.55);
    const c = 11.98 + (4 - j) * 0.04, q = seg(t, c, c + 0.32);
    if (p <= 0 || q >= 1) return null;
    const from = j === 0 ? bc(HUB3) : [CARD_X[j - 1], CARD_Y[j - 1]];
    const e = E.outSoft(p);
    let x = lerp(from[0], CARD_X[j], e), y = lerp(from[1], CARD_Y[j], e);
    let sy = lerp(0.25, 1, E.outBack(p)), sc = 1;
    let rot = (1 - E.out(p)) * (j % 2 ? 0.12 : -0.12) + (j % 2 ? 0.012 : -0.01);
    if (q > 0) {
      const hc = bc(boardRect(t)), eq = E.in(q);
      x = lerp(x, hc[0], eq); y = lerp(y, hc[1], eq);
      sc = lerp(1, 0.3, eq); sy *= 1 - 0.8 * eq;
    }
    return { x, y, sy, sc, rot, fold: 1 - clamp(sy), alpha: 1 - seg(q, 0.45, 0.95) };
  }
  function drawSpine(t) {
    let end = null;
    for (let j = 0; j < 5; j++) { const ps = cardPose(t, j); if (ps) end = Math.max(end ?? 0, ps.y); }
    if (end === null) return;
    const d = deskState(t);
    const top = d.y + 4;
    if (end <= top) return;
    stitchLine(540, top, 540, end, 14, C.purple, 'rgba(255,255,255,0.55)');
  }
  function drawCards(t) {
    for (let j = 4; j >= 0; j--) {
      const ps = cardPose(t, j);
      if (!ps) continue;
      const last = j === 4;
      ctx.save();
      ctx.globalAlpha = ps.alpha;
      at(ps.x, ps.y, ps.rot, ps.sc, ps.sc * ps.sy, () => {
        paper({ w: CARD_W, h: CARD_H, r: 12, color: last ? C.terracotta : '#FFFBF3', seed: 90 + j, elev: 1.2, fold: ps.fold, inner: () => {
          const bx = -CARD_W / 2 + 64;
          circle(bx, 0, 36, last ? '#FFF6EA' : C.terracotta);
          text(String(j + 1), bx, 3, { font: 'Fraunces', weight: 800, size: 40, color: last ? C.terracotta : '#FFF6EA' });
          text(TXT.modules[j], bx + 58, 3, { font: 'DM Sans', weight: 700, size: 44, color: last ? '#FFF8EE' : C.charcoal, align: 'left', maxW: CARD_W - 150 });
        } });
        // rivets where the spine meets the card
        const sx = 540 - CARD_X[j];
        circle(sx, -CARD_H / 2 + 12, 7, C.purpleD);
        if (j < 4) circle(sx, CARD_H / 2 - 12, 7, C.purpleD);
      });
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- ecosystem (scene 4)
  const ENVS = [
    { k: 'browser', x: 540, y: 455, w: 300, h: 215, sy: 108 },
    { k: 'code', x: 830, y: 760, w: 290, h: 215, sy: 108 },
    { k: 'chat', x: 830, y: 1250, w: 290, h: 215, sy: 108 },
    { k: 'design', x: 540, y: 1555, w: 300, h: 215, sy: 108 },
    { k: 'docs', x: 250, y: 1250, w: 290, h: 215, sy: 104 },
    { k: 'slides', x: 250, y: 760, w: 290, h: 215, sy: 104 },
  ];
  const envStart = (k) => 12.45 + k * 0.1;
  // mascot tour: hop k lands on env k
  const TOUR = ENVS.map((_, k) => { const t0 = 12.72 + k * 0.475; return { t0, t1: t0 + 0.33 }; });
  function envPose(t, k) {
    const e = ENVS[k], a = envStart(k), p = seg(t, a, a + 0.5);
    const f = 16.0 + k * 0.05, q = seg(t, f, f + 0.45);
    if (p <= 0 || q >= 1) return null;
    const hc = bc(boardRect(t));
    const ep = E.out(p);
    let x = lerp(hc[0], e.x, ep), y = lerp(hc[1], e.y, ep);
    let sc = lerp(0.2, 1, E.outBack(p)), sy = E.out(clamp(p * 1.5));
    let rot = (1 - ep) * (k % 2 ? 0.5 : -0.5) + [0.01, -0.02, 0.02, -0.01, 0.03, -0.025][k];
    if (q > 0) {
      const eq = E.in(q);
      x = lerp(x, hc[0], eq); y = lerp(y, hc[1], eq);
      sc *= lerp(1, 0.15, eq); rot += eq * 0.6 * (k % 2 ? 1 : -1);
    }
    return { x, y, sc, sy, rot, fold: 1 - sy, alpha: clamp(p * 5) * (1 - seg(q, 0.7, 1)), grow: E.inOut(seg(t, a + 0.08, a + 0.45)) * (1 - E.in(q)) };
  }
  function drawConnectors(t) {
    const hc = bc(boardRect(t));
    ENVS.forEach((e, k) => {
      const ps = envPose(t, k);
      if (!ps || ps.grow <= 0) return;
      stitchLine(hc[0], hc[1], ps.x, ps.y, 12, C.sand, 'rgba(140,110,80,0.6)', ps.grow);
    });
  }
  function drawEnvs(t) {
    ENVS.forEach((e, k) => {
      const ps = envPose(t, k);
      if (!ps) return;
      const act = seg(t, TOUR[k].t1 - 0.05, TOUR[k].t1 + 0.6);
      ctx.save();
      ctx.globalAlpha = ps.alpha;
      at(ps.x, ps.y, ps.rot, ps.sc, ps.sc * Math.max(0.03, ps.sy), () => ENV_DRAW[e.k](e.w, e.h, act, t, ps.fold));
      ctx.restore();
    });
  }
  const ENV_DRAW = {
    browser(w, h, act, t, fold) {
      at(0, 97, 0, 1, 1, () => { // laptop base
        ctx.save(); setShadow(1);
        ctx.beginPath(); ctx.moveTo(-150, -8); ctx.lineTo(150, -8); ctx.lineTo(172, 8); ctx.quadraticCurveTo(172, 12, 166, 12); ctx.lineTo(-166, 12); ctx.quadraticCurveTo(-172, 12, -172, 8); ctx.closePath();
        ctx.fillStyle = C.charcoalL; ctx.fill(); ctx.restore();
        ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(-150, -8, 300, 3);
        rrect(-30, -8, 60, 6, 3, 'rgba(0,0,0,0.25)');
      });
      at(0, -12, 0, 1, 1, () => paper({ w: 290, h: 202, r: 14, color: C.charcoal, seed: 100, dark: true, elev: 1.1, fold, inner: () => {
        rrect(-133, -89, 266, 170, 6, '#FBF5EA');
        ctx.fillStyle = '#EDE2CF'; ctx.fillRect(-133, -89, 266, 26);
        [C.pink, C.orange, C.purpleL].forEach((c, i) => circle(-120 + i * 13, -76, 4, c));
        rrect(-62, -84, 150, 16, 8, '#FFFDF8');
        const url = 'claude.ai';
        const n = Math.floor(clamp(act * 2.2) * url.length);
        text(url.slice(0, n), -52, -75.5, { size: 11, weight: 500, align: 'left', color: C.charcoalL });
        // chat on the page
        const b1 = E.outBack(seg(act, 0.2, 0.45));
        if (b1 > 0) at(70, -40, 0, b1, b1, () => rrect(-50, -11, 100, 22, 11, C.orangeL));
        [[-110, -18, 150], [-110, -4, 170], [-110, 10, 120]].forEach(([x, y, lw], i) => {
          const g = seg(act, 0.4 + i * 0.12, 0.6 + i * 0.12);
          if (g > 0) rrect(x, y, lw * g, 8, 4, 'rgba(44,37,34,0.28)');
        });
        circle(-120, -14, 0, C.orange);
        rrect(-110, 42, 220, 28, 14, '#FFFFFF', ['rgba(44,37,34,0.2)', 1.5]);
        if (Math.floor(t * 3) % 2 === 0) rrect(-96, 49, 2.5, 14, 1, C.terracotta);
      } }));
    },
    code(w, h, act, t, fold) {
      paper({ w, h, r: 12, color: C.charcoal, seed: 101, dark: true, elev: 1.1, fold, inner: () => {
        ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(-w / 2, -h / 2, w, 32);
        [C.pink, C.orange, C.purpleL].forEach((c, i) => circle(-w / 2 + 20 + i * 17, -h / 2 + 16, 5, c));
        text('$', -w / 2 + 20, -h / 2 + 56, { font: 'JetBrains Mono', weight: 500, size: 19, color: C.orange, align: 'left' });
        text('claude', -w / 2 + 42, -h / 2 + 56, { font: 'JetBrains Mono', weight: 500, size: 19, color: '#F2E9DC', align: 'left' });
        const rows = [[C.purpleL, 150], [C.orangeL, 200], ['rgba(242,233,220,0.45)', 120], [C.orangeL, 170], [C.purpleL, 110], ['rgba(242,233,220,0.45)', 190]];
        rows.forEach(([c, lw], i) => {
          const g = seg(act, 0.1 + i * 0.1, 0.25 + i * 0.1);
          if (g > 0) rrect(-w / 2 + 42 + (i % 3 === 2 ? 20 : 0), -h / 2 + 84 + i * 20, lw * g, 8, 4, c);
          if (g > 0) text('›', -w / 2 + 22, -h / 2 + 88 + i * 20, { font: 'JetBrains Mono', size: 14, weight: 500, color: 'rgba(242,233,220,0.3)', align: 'left' });
        });
      } });
    },
    chat(w, h, act, t, fold) {
      paper({ w, h, r: 12, color: '#FFFBF3', seed: 102, elev: 1.1, fold, inner: () => {
        ctx.fillStyle = C.purpleD; ctx.fillRect(-w / 2, -h / 2, 72, h);
        for (let i = 0; i < 4; i++) {
          text('#', -w / 2 + 14, -h / 2 + 44 + i * 26, { size: 13, weight: 700, color: 'rgba(255,255,255,0.5)', align: 'left' });
          rrect(-w / 2 + 28, -h / 2 + 39 + i * 26, [30, 24, 34, 20][i], 8, 4, i === 1 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)');
        }
        ctx.fillStyle = 'rgba(44,37,34,0.06)'; ctx.fillRect(-w / 2 + 72, -h / 2, w - 72, 30);
        text('# team', -w / 2 + 86, -h / 2 + 16, { size: 13, weight: 700, align: 'left', color: C.charcoalL });
        const msg = (y, col, l1, l2, face) => {
          rrect(-w / 2 + 84, y, 26, 26, 6, col);
          if (face) { rrect(-w / 2 + 90, y + 8, 3.5, 7, 1.5, C.ink); rrect(-w / 2 + 101, y + 8, 3.5, 7, 1.5, C.ink); }
          rrect(-w / 2 + 118, y + 2, l1, 8, 4, 'rgba(44,37,34,0.5)');
          rrect(-w / 2 + 118, y + 15, l2, 8, 4, 'rgba(44,37,34,0.2)');
        };
        msg(-h / 2 + 44, C.pink, 60, 120);
        msg(-h / 2 + 84, C.purpleL, 50, 140);
        const p = E.outBack(seg(act, 0.1, 0.45));
        if (p > 0) {
          ctx.save(); ctx.globalAlpha *= clamp(p * 2);
          ctx.translate(0, (1 - p) * 20);
          rrect(-w / 2 + 78, -h / 2 + 118, w - 90, 40, 8, 'rgba(240,167,124,0.25)');
          msg(-h / 2 + 125, C.mascot, 56, 150 * clamp(seg(act, 0.3, 0.8)), true);
          ctx.restore();
        }
        rrect(-w / 2 + 84, h / 2 - 36, w - 100, 24, 8, '#FFFFFF', ['rgba(44,37,34,0.2)', 1.5]);
      } });
    },
    design(w, h, act, t, fold) {
      paper({ w, h, r: 12, color: '#F3ECE1', seed: 103, elev: 1.1, fold, inner: () => {
        ctx.fillStyle = 'rgba(44,37,34,0.14)';
        for (let x = -w / 2 + 14; x < w / 2; x += 18) for (let y = -h / 2 + 14; y < h / 2; y += 18) ctx.fillRect(x, y, 2, 2);
        ctx.fillStyle = 'rgba(44,37,34,0.08)'; ctx.fillRect(-w / 2, -h / 2, 30, h);
        for (let i = 0; i < 4; i++) rrect(-w / 2 + 8, -h / 2 + 18 + i * 26, 14, 14, 3, 'rgba(44,37,34,0.3)');
        // phone frame artboard
        rrect(-w / 2 + 48, -h / 2 + 22, 96, 170, 12, '#FFFFFF', ['rgba(44,37,34,0.35)', 2]);
        rrect(-w / 2 + 58, -h / 2 + 40, 76, 40, 6, C.pinkL);
        lines(-w / 2 + 58, -h / 2 + 94, [70, 52, 62], 16, 7, 'rgba(44,37,34,0.2)');
        rrect(-w / 2 + 58, -h / 2 + 154, 76, 22, 11, C.terracotta);
        const e = E.inOut(seg(act, 0.05, 0.5));
        const sh = [
          { a: [60, -50], b: [40, -48], d: (x, y) => circle(x, y, 26, C.orange) },
          { a: [110, 30], b: [80, 22], d: (x, y) => rrect(x - 40, y - 22, 80, 44, 8, C.purpleL) },
          { a: [20, 60], b: [0, 70], d: (x, y) => { ctx.beginPath(); ctx.moveTo(x, y - 24); ctx.lineTo(x + 26, y + 20); ctx.lineTo(x - 26, y + 20); ctx.closePath(); ctx.fillStyle = C.pink; ctx.fill(); } },
        ];
        sh.forEach((s) => s.d(lerp(s.a[0], s.b[0], e), lerp(s.a[1], s.b[1], e)));
        const sel = seg(act, 0.35, 0.55);
        if (sel > 0) {
          ctx.save(); ctx.globalAlpha *= sel;
          ctx.strokeStyle = C.purple; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
          ctx.strokeRect(10, -80, 60, 60); ctx.setLineDash([]);
          for (const [x, y] of [[10, -80], [70, -80], [10, -20], [70, -20]]) { ctx.fillStyle = '#fff'; ctx.fillRect(x - 4, y - 4, 8, 8); ctx.strokeRect(x - 4, y - 4, 8, 8); }
          ctx.restore();
        }
        // cursor
        const cxp = lerp(120, 66, E.inOut(seg(act, 0.1, 0.45))), cyp = lerp(90, -24, E.inOut(seg(act, 0.1, 0.45)));
        ctx.save(); ctx.translate(cxp, cyp);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 24); ctx.lineTo(6, 18); ctx.lineTo(11, 28); ctx.lineTo(15, 26); ctx.lineTo(10, 16); ctx.lineTo(18, 16); ctx.closePath();
        ctx.fillStyle = C.charcoal; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
      } });
    },
    docs(w, h, act, t, fold) {
      const f = E.outBack(seg(act, 0.0, 0.45));
      // spreadsheet
      at(lerp(20, 62, f), lerp(6, 10, f), lerp(0.02, 0.12, f), 1, 1, () => paper({ w: 160, h: 196, r: 6, color: '#FFFDF8', seed: 104, elev: 1, fold, inner: () => {
        ctx.fillStyle = C.terracotta; ctx.fillRect(-80, -98, 160, 26);
        rrect(-66, -91, 12, 12, 2, 'rgba(255,255,255,0.8)');
        ctx.strokeStyle = 'rgba(44,37,34,0.25)'; ctx.lineWidth = 1.2;
        for (let i = 0; i <= 7; i++) { ctx.beginPath(); ctx.moveTo(-68, -60 + i * 20); ctx.lineTo(68, -60 + i * 20); ctx.stroke(); }
        for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(-68 + i * 34, -60); ctx.lineTo(-68 + i * 34, 80); ctx.stroke(); }
        [[1, 1, C.orangeL], [2, 3, C.pink], [3, 2, C.orangeL], [0, 5, C.purpleL], [2, 6, C.pink]].forEach(([c, r, col]) => { ctx.fillStyle = col; ctx.fillRect(-67 + c * 34, -59 + r * 20, 32, 18); });
      } }));
      // document
      at(lerp(-10, -58, f), lerp(0, -6, f), lerp(-0.02, -0.1, f), 1, 1, () => paper({ w: 160, h: 200, r: 6, color: '#FFFDF8', seed: 105, elev: 1.1, fold, inner: () => {
        ctx.fillStyle = C.purple; ctx.fillRect(-80, -100, 160, 26);
        rrect(-66, -93, 12, 12, 2, 'rgba(255,255,255,0.8)');
        rrect(-60, -56, 100, 12, 6, C.charcoalL);
        lines(-60, -30, [120, 112, 118, 90, 116, 104, 70], 18, 7, 'rgba(44,37,34,0.22)');
      } }));
    },
    slides(w, h, act, t, fold) {
      const f = E.outBack(seg(act, 0.0, 0.45));
      at(lerp(-20, -48, f), lerp(-20, -34, f), lerp(-0.02, -0.08, f), 1, 1, () => paper({ w: 210, h: 132, r: 6, color: '#FFFDF8', seed: 106, elev: 1, fold, inner: () => {
        ctx.fillStyle = C.orange; ctx.fillRect(-105, -66, 210, 22);
        rrect(-92, -61, 12, 12, 2, 'rgba(255,255,255,0.8)');
        rrect(-86, -30, 96, 12, 6, C.charcoalL);
        lines(-86, -8, [70, 60, 76], 16, 6, 'rgba(44,37,34,0.22)');
        [[0.5, C.pink], [0.8, C.terracotta], [0.62, C.purpleL]].forEach(([hh, c], i) => rrect(30 + i * 20, 50 - hh * 70, 14, hh * 70, 3, c));
      } }));
      // email envelope
      at(lerp(40, 70, f), lerp(40, 50, f), lerp(0.03, 0.1, f), 1, 1, () => {
        const o = E.inOut(seg(act, 0.25, 0.6));
        const lift = E.outBack(seg(act, 0.45, 0.85)) * 40;
        // letter
        if (lift > 0) at(0, -lift, 0, 1, 1, () => paper({ w: 116, h: 80, r: 4, color: '#FFFDF8', seed: 108, elev: 0.5, inner: () => lines(-44, -24, [80, 64, 72], 14, 6, 'rgba(44,37,34,0.25)') }));
        paper({ w: 150, h: 100, r: 6, color: C.pink, seed: 107, elev: 1, fold, inner: () => {
          ctx.strokeStyle = 'rgba(120,60,50,0.45)'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-75, 50); ctx.lineTo(-10, 0); ctx.moveTo(75, 50); ctx.lineTo(10, 0); ctx.stroke();
        } });
        // flap
        ctx.save();
        ctx.translate(0, -50);
        ctx.scale(1, Math.cos(o * Math.PI));
        ctx.beginPath(); ctx.moveTo(-75, 0); ctx.lineTo(75, 0); ctx.lineTo(0, 56); ctx.closePath();
        ctx.fillStyle = o < 0.5 ? C.pinkD : C.pinkL; ctx.fill();
        ctx.strokeStyle = 'rgba(120,60,50,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.restore();
      });
    },
  };

  // ---------------------------------------------------------------- finale title
  function drawTitle(t, b) {
    const p0 = seg(t, 17.1, 18.0);
    if (p0 <= 0) return;
    const [cx, cy] = bc(b);
    const [l1, l2] = TXT.title;
    ctx.save();
    ctx.letterSpacing = '6px';
    let size = 140;
    ctx.font = font(size, 'Fraunces', 800);
    const maxW = (b[2] - b[0]) - 110;
    const wmax = Math.max(ctx.measureText(l1).width, ctx.measureText(l2).width);
    if (wmax > maxW) size *= maxW / wmax;
    ctx.font = font(size, 'Fraunces', 800);
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    let k = 0;
    [[l1, cy - 28, C.charcoal], [l2, cy - 28 + size * 1.0, C.terracotta]].forEach(([str, y, col]) => {
      const total = ctx.measureText(str).width;
      let x = cx - total / 2 + 3;
      for (const ch of str) {
        const cw = ctx.measureText(ch).width;
        const a = 17.1 + k * 0.055, p = seg(t, a, a + 0.42);
        if (p > 0) {
          const e = E.outBack(p);
          ctx.save();
          ctx.globalAlpha = clamp(p * 3);
          ctx.translate(x + cw / 2, y + (1 - e) * 46);
          ctx.rotate((1 - E.out(p)) * (k % 2 ? 0.25 : -0.25));
          ctx.scale(lerp(0.6, 1, e), lerp(0.6, 1, e));
          ctx.fillStyle = 'rgba(80,40,20,0.14)';
          ctx.fillText(ch, -cw / 2 + 2, 4);
          ctx.fillStyle = col;
          ctx.fillText(ch, -cw / 2, 0);
          ctx.restore();
        }
        x += cw; k++;
      }
    });
    ctx.restore();
  }
  function drawSubtitle(t) {
    const p = seg(t, 17.75, 18.3);
    if (p <= 0) return;
    const b = boardRect(t);
    const y = b[3] + 100 + (1 - E.out(p)) * 40;
    ctx.save();
    ctx.globalAlpha = clamp(p * 3);
    at(540, y, -0.015, 1, Math.max(0.05, E.outBack(p)), () => paper({ w: 760, h: 96, r: 8, color: C.pinkL, seed: 120, elev: 1.1, inner: () => {
      text(TXT.subtitle, 0, 3, { font: 'DM Sans', weight: 700, size: 44, color: C.charcoal, maxW: 700 });
    } }));
    ctx.restore();
  }
  function drawDecor(t) {
    const items = [
      [150, 640, 0, C.orange], [930, 610, 1, C.purpleL], [925, 1470, 0, C.pink], [165, 1475, 2, C.terracotta],
    ];
    items.forEach(([x, y, kind, col], i) => {
      const p = seg(t, 17.5 + i * 0.1, 17.95 + i * 0.1);
      if (p <= 0) return;
      const e = E.outBack(p);
      at(x, y + Math.sin(t * 1.3 + i) * 5, Math.sin(t * 0.8 + i) * 0.2 + i, e, e, () => {
        ctx.save(); setShadow(0.6);
        ctx.fillStyle = col; ctx.beginPath();
        if (kind === 0) ctx.arc(0, 0, 18, 0, Math.PI * 2);
        else if (kind === 1) { ctx.moveTo(0, -22); ctx.lineTo(20, 14); ctx.lineTo(-20, 14); ctx.closePath(); }
        else ctx.roundRect(-16, -16, 32, 32, 4);
        ctx.fill(); ctx.restore();
      });
    });
  }

  // ---------------------------------------------------------------- mascot choreography
  function mascotState(t) {
    const m = { x: 540, y: 1480, s: 0.9, lookX: 0, lookY: 0, blink: blinkAt(t), surprise: 0, armL: 0, armR: 0, walkPhase: 0, walkAmt: 0, squash: 0, air: 0, tilt: 0 };
    const breathe = 0.012 * Math.sin(t * 2 * Math.PI * 0.7);
    const idleArms = 0.05 * Math.sin(t * 2.4);
    if (t < 7.15) {
      // scenes 1-2: on the desk
      const d = deskState(t);
      const wk = walkSeq(t, 335, [
        { t0: 2.15, t1: 3.0, x: 540 }, { t0: 4.35, t1: 4.75, x: 430 }, { t0: 5.3, t1: 5.75, x: 655 }, { t0: 6.35, t1: 6.8, x: 540 },
      ]);
      m.x = wk.x; m.y = d.y; m.walkAmt = wk.amt; m.walkPhase = wk.phase;
      const j1 = jump(t, 1.4, 1.68, 24), j2 = jump(t, 3.25, 3.85, 75);
      m.air = j1.air + j2.air; m.y -= m.air;
      m.squash = j1.squash + j2.squash + (wk.amt > 0 ? 0 : breathe) + 0.08 * bell(seg(t, 6.85, 7.05));
      const look = kf(t, [
        [0, [0.75, -0.25]], [0.95, [0.75, -0.25]], [1.15, [0.75, -1]], [1.95, [0.75, -1]], [2.1, [-0.5, -0.9]], [2.25, [0.9, -0.2]],
        [2.95, [0.9, -0.2]], [3.1, [0, 0]], [3.25, [0, -1]], [3.95, [0, -1]], [4.08, [-1, -0.7]], [4.22, [1, -0.7]],
        [4.38, [-1, 0.2]], [4.75, [-0.9, 0.6]], [5.28, [-0.9, 0.6]], [5.4, [0.7, -1]], [5.62, [0.8, 0]], [5.78, [0.9, 0.3]],
        [6.33, [0.9, 0.3]], [6.45, [-0.7, 0]], [6.8, [0, 0.05]],
      ]);
      m.lookX = look[0]; m.lookY = look[1];
      m.surprise = kf(t, [[1.3, 0], [1.4, 0.55], [1.75, 0.55], [1.95, 0], [3.13, 0], [3.26, 1], [3.95, 1], [4.3, 0]]);
      const raise = kf(t, [[1.35, 0], [1.45, 0.35], [1.8, 0.35], [2.0, 0], [3.12, 0], [3.26, 1.0 * Math.min(1.3, SUR)], [3.9, 1.0 * Math.min(1.3, SUR)], [4.25, 0]]);
      const work = seg(t, 4.78, 4.88) * (1 - seg(t, 5.22, 5.3)) + seg(t, 5.8, 5.9) * (1 - seg(t, 6.28, 6.35));
      m.armL = raise + idleArms + work * (0.35 + 0.3 * Math.sin(t * 30));
      m.armR = raise - idleArms + work * (0.35 + 0.3 * Math.sin(t * 30 + Math.PI));
      m.tilt = work * 0.03 * Math.sin(t * 15) + wk.amt * wk.dir * 0.03;
      return m;
    }
    if (t < 12.0) {
      // ride the desk up to the hub, then hop down the module stairs
      const d = deskState(t);
      const rideS = lerp(0.9, 0.42, E.inOut(seg(t, 7.15, 7.9)));
      m.s = rideS;
      const hops = CARD_X.map((cx, j) => ({
        t0: cardStart(j) + 0.3, t1: cardStart(j) + 0.72,
        x: j % 2 ? 880 : 200, y: CARD_Y[j] - CARD_H / 2, h: j === 0 ? 110 : 120,
      }));
      const hs = hopSeq(t, [(tt) => (deskState(tt).x0 + deskState(tt).x1) / 2, (tt) => deskState(tt).y], hops);
      m.x = hs.x; m.y = hs.y; m.air = hs.air; m.squash = hs.squash + (hs.inAir ? 0 : breathe);
      void d;
      // looks
      let li = -1;
      for (let j = 0; j < 5; j++) if (t >= hops[j].t1) li = j;
      if (hs.inAir) { m.lookX = hs.dir; m.lookY = 0.6; m.armL = m.armR = 0.45; }
      else if (li >= 0) {
        const dirToLabel = li % 2 ? -0.7 : 0.7;
        m.lookX = dirToLabel; m.lookY = 0.75;
        const nextT = li < 4 ? hops[li + 1].t0 : 99;
        if (t > nextT - 0.2) { m.lookX = li % 2 ? -1 : 1; m.lookY = 0.9; }
        m.armL = idleArms; m.armR = -idleArms;
      } else {
        m.lookX = kf(t, [[7.2, 0], [7.9, 0], [8.1, -0.8]]); m.lookY = kf(t, [[7.2, -0.2], [7.9, 0.4], [8.1, 0.9]]);
        m.armL = idleArms; m.armR = -idleArms;
      }
      // celebrate on the last card
      const cel = seg(t, 11.65, 11.75) * (1 - seg(t, 11.95, 12.1));
      if (cel > 0) {
        const j = jump(t, 11.72, 11.98, 30);
        m.air += j.air; m.y -= j.air; m.squash += j.squash;
        m.armL += cel * 0.9; m.armR += cel * 0.9; m.lookX = 0; m.lookY = -0.2 * cel;
      }
      return m;
    }
    if (t < 16.0) {
      m.s = 0.42;
      const hops = [
        { t0: 12.1, t1: 12.55, x: (tt) => (deskState(tt).x0 + deskState(tt).x1) / 2, y: (tt) => deskState(tt).y, h: 150 },
        ...ENVS.map((e, k) => ({ t0: TOUR[k].t0, t1: TOUR[k].t1, x: e.x + (k === 0 ? 70 : 0), y: e.y + e.sy, h: 90 })),
      ];
      const hs = hopSeq(t, [200, CARD_Y[4] - CARD_H / 2], hops);
      m.x = hs.x; m.y = hs.y; m.air = hs.air; m.squash = hs.squash + (hs.inAir ? 0 : breathe);
      if (hs.inAir) { m.lookX = hs.dir; m.lookY = 0.3; m.armL = m.armR = 0.5; }
      else {
        m.lookX = 0; m.lookY = -1; // look up at the environment
        const since = t - hs.lastLand;
        const work = seg(since, 0.02, 0.08) * (1 - seg(since, 0.12, 0.16)) * (hs.lastLand > 12.6 ? 1 : 0);
        m.armL = idleArms + work * (0.3 + 0.3 * Math.sin(t * 34));
        m.armR = -idleArms + work * (0.3 + 0.3 * Math.sin(t * 34 + Math.PI));
        if (hs.lastLand > 15.4) { // last stop — linger
          m.armL = idleArms + 0.3 * seg(since, 0.1, 0.2) * (0.5 + 0.5 * Math.sin(t * 26));
          m.armR = -idleArms + 0.3 * seg(since, 0.1, 0.2) * (0.5 + 0.5 * Math.sin(t * 26 + Math.PI));
          m.lookX = kf(since, [[0.2, 0], [0.35, 0.8]]); m.lookY = kf(since, [[0.2, -1], [0.35, 0.3]]);
        }
        if (hs.lastLand < 12.7 && hs.lastLand > 12) { m.lookX = kf(t, [[12.55, 0], [12.62, -0.4]]); m.lookY = -0.7; }
      }
      return m;
    }
    // finale
    const hs = hopSeq(t, [ENVS[5].x, ENVS[5].y + ENVS[5].sy], [
      { t0: 16.05, t1: 16.6, x: (tt) => (boardRect(tt)[0] + boardRect(tt)[2]) / 2, y: (tt) => boardRect(tt)[1], h: 170 },
    ]);
    m.s = lerp(0.42, 1.0, E.inOut(seg(t, 16.45, 17.15)));
    m.x = hs.x; m.y = hs.y; m.air = hs.air;
    const settle = jump(t, 17.1, 17.1, 0);
    m.squash = hs.squash + settle.squash * 0 + (hs.inAir ? 0 : breathe) + 0.1 * Math.sin(Math.PI * seg(t, 17.1, 17.4)) * (1 - seg(t, 17.1, 17.4));
    if (hs.inAir) { m.lookX = hs.dir; m.lookY = 0.3; m.armL = m.armR = 0.5; }
    else {
      const look = kf(t, [[16.6, [0, 0]], [17.25, [0, 0]], [17.4, [-0.6, 1]], [17.8, [0.6, 1]], [18.15, [0, 0.05]], [99, [0, 0.05]]]);
      m.lookX = look[0]; m.lookY = look[1];
      const wave = seg(t, 18.25, 18.4) * (1 - seg(t, 18.95, 19.15));
      m.armL = idleArms;
      m.armR = -idleArms + wave * (0.55 + 0.2 * Math.sin((t - 18.25) * 16));
    }
    return m;
  }

  // ---------------------------------------------------------------- frame
  function camera(t) {
    return kf(t, [
      [0, [560, 1190, 1.27]], [1.9, [556, 1180, 1.25], E.sine], [3.05, [540, 960, 1.0], E.inOut],
      [16.2, [540, 960, 1.0]], [20, [540, 962, 1.025], E.sine],
    ]);
  }
  function renderFrame(tReal) {
    const t = toBase(tReal);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.shadowColor = 'transparent';
    const cam = camera(t);
    drawBackground(t, cam);
    ctx.save();
    ctx.translate(540, 960); ctx.scale(cam[2], cam[2]); ctx.translate(-cam[0], -cam[1]);
    drawConnectors(t);
    drawSpine(t);
    drawCards(t);
    drawEnvs(t);
    drawBoard(t);
    drawClaudeCard(t);
    drawThreads(t);
    for (let i = 0; i < ITEMS.length; i++) drawItem(t, i);
    drawDesk(t);
    drawTagline(t);
    drawSubtitle(t);
    drawDecor(t);
    drawMascot(mascotState(t));
    ctx.restore();
  }

  window.ANIM = {
    duration: DURATION,
    fps: CFG.fps,
    ready: (async () => {
      await Promise.all([
        document.fonts.load('600 50px "Fraunces"'), document.fonts.load('800 50px "Fraunces"'),
        document.fonts.load('500 20px "DM Sans"'), document.fonts.load('700 20px "DM Sans"'),
        document.fonts.load('500 20px "JetBrains Mono"'),
      ]);
      await document.fonts.ready;
      GRAIN = makeGrain(1, false);
      GRAIN_DARK = makeGrain(2, true);
      return true;
    })(),
    render: renderFrame,
  };

  // live preview when opened directly in a browser
  if (!window.ANIM_CONFIG) {
    window.ANIM.ready.then(() => {
      const t0 = performance.now();
      const loop = () => { renderFrame(((performance.now() - t0) / 1000) % DURATION); requestAnimationFrame(loop); };
      loop();
    });
  }
})();

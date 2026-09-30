// Score + SFX for the Kuper AI brag video. 112 BPM, A minor, one shared reverb. -> audio.wav (48k stereo)
import fs from 'fs';
const SR = 48000, DUR = 20.4, N = Math.round(SR * DUR);
const music = [new Float32Array(N), new Float32Array(N)];
const sfx = [new Float32Array(N), new Float32Array(N)];
const send = [new Float32Array(N), new Float32Array(N)];
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 * 2 - 1;
function add(bus, i, l, r, rev = 0) { if (i < 0 || i >= N) return; bus[0][i] += l; bus[1][i] += r; send[0][i] += l * rev; send[1][i] += r * rev; }

const BEAT = 60 / 112, T0 = 3.0 - 6 * BEAT; // grid lands a downbeat on the reveal
const beatT = k => T0 + k * BEAT;

// ── pad: detuned saws, one-pole lowpass, chord crossfades, sidechain from kick ──
const chords = [[57, 60, 64, 67, 71], [53, 57, 60, 64, 67], [48, 55, 60, 64, 67], [55, 59, 62, 67, 71]]; // Am9 Fmaj9 Cadd9 G(add6)
const BAR = 4 * BEAT;
const duck = t => { if (t < 3.0 || t > 17.35) return 1; const ph = ((t - T0) % BEAT) / BEAT; return 0.62 + 0.38 * Math.min(1, ph * 2.2); };
{
  const phases = {}; let lp = [0, 0];
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const bar = Math.floor((t - T0) / BAR), within = ((t - T0) % BAR + BAR) % BAR;
    const ci = ((bar % 4) + 4) % 4, prev = (((bar - 1) % 4) + 4) % 4;
    const xf = Math.min(1, within / 0.35);
    let final = t >= 17.8; // outro holds Am9
    let L = 0, R = 0;
    const voice = (notes, g) => {
      notes.forEach((m, j) => {
        for (let d = -1; d <= 1; d++) {
          const key = m + ':' + d; const f = mtof(m) * Math.pow(2, d * 7 / 1200);
          phases[key] = ((phases[key] || (j * .13 + d * .37)) + f / SR) % 1;
          const s = (phases[key] * 2 - 1) * g;
          if (d < 0) L += s; else if (d > 0) R += s; else { L += s * .5; R += s * .5; }
        }
      });
    };
    if (final) voice(chords[0].concat([76]), 1); else { voice(chords[ci], xf); if (xf < 1) voice(chords[prev], 1 - xf); }
    // cutoff opens over the piece
    const cut = t < 3 ? 500 + 300 * t : t < 17.8 ? 1400 + 500 * Math.sin(t * .4) : 2200 * Math.exp(-(t - 17.8) * .5) + 600;
    const a = 1 - Math.exp(-2 * Math.PI * cut / SR);
    lp[0] += a * (L - lp[0]); lp[1] += a * (R - lp[1]);
    let env = Math.min(1, t / 2.2) * duck(t);
    if (t > 17.35 && t < 17.8) env *= 0.55 + 0.45 * Math.cos((t - 17.35) / .45 * Math.PI) ** 2;
    if (t > 18.6) env *= Math.max(0, 1 - (t - 18.6) / 1.8) ** 1.3;
    const g = 0.032 * env;
    add(music, i, lp[0] * g, lp[1] * g, 0.55);
  }
}
// ── kick ──
function kick(t0, g) { const s0 = Math.round(t0 * SR); let ph = 0; for (let i = 0; i < SR * .4; i++) { const t = i / SR; const f = 45 + 80 * Math.exp(-t * 28); ph += f / SR; const v = Math.sin(2 * Math.PI * ph) * Math.exp(-t * 9) * g; add(music, s0 + i, v, v, 0.05); } }
// ── hat ──
function hat(t0, g, len = .035) { const s0 = Math.round(t0 * SR); let p = 0; for (let i = 0; i < SR * len * 3; i++) { const n = rnd(); const v = (n - p) * Math.exp(-i / SR / len) * g; p = n; add(music, s0 + i, v * .8, v, 0.15); } }
// ── clap (soft) ──
function clap(t0, g) { const s0 = Math.round(t0 * SR); let b1 = 0, b2 = 0; for (let i = 0; i < SR * .25; i++) { const t = i / SR; const n = rnd(); b1 += .35 * (n - b1); b2 += .35 * (b1 - b2); const bp = b1 - b2; const e = (t < .012 ? 1 : t < .024 ? .7 : 1) * Math.exp(-t * 18); add(music, s0 + i, bp * e * g, bp * e * g, 0.4); } }
// ── bass ──
function bass(t0, m, len, g) { const s0 = Math.round(t0 * SR), f = mtof(m); let ph = 0; for (let i = 0; i < SR * len; i++) { const t = i / SR; ph += f / SR; const e = Math.min(1, t / .01) * Math.exp(-t * 2.2) * Math.min(1, (len - t) / .05); const v = (Math.sin(2 * Math.PI * ph) + .25 * Math.sin(4 * Math.PI * ph)) * e * g; add(music, s0 + i, v, v, 0.03); } }
const roots = [45, 41, 36, 43];
for (let k = 0; ; k++) {
  const t = beatT(k); if (t > 17.36) break; if (t < -0.01) continue;
  const bar = Math.floor(k / 4), inBar = k % 4;
  if (t >= 2.99) kick(t, .3);
  if (t >= 6.4) { hat(t + BEAT / 2, .028); if (inBar === 1 || inBar === 3) clap(t, .035); }
  if (t >= 6.4 && t < 15.2 && k % 2 === 1) hat(t + BEAT * .75, .014);
  if (t >= 2.99 && (inBar === 0 || inBar === 2)) bass(t, roots[((bar % 4) + 4) % 4], BEAT * 1.6, .16);
}
// ── SFX (in key, same reverb) ──
function pluck(t0, m, g, pan = 0, rev = .45, dec = 7) { const s0 = Math.round(t0 * SR), f = mtof(m); let ph = 0; for (let i = 0; i < SR * .9; i++) { const t = i / SR; ph += f * (1 + .02 * Math.exp(-t * 60)) / SR; const e = Math.min(1, t / .003) * Math.exp(-t * dec); const v = (Math.sin(2 * Math.PI * ph) + .18 * Math.sin(6 * Math.PI * ph) * Math.exp(-t * 20)) * e * g; add(sfx, s0 + i, 1.5 * v * (1 - pan), 1.5 * v * (1 + pan), rev); } }
function tick(t0, g) { const s0 = Math.round(t0 * SR); let b1 = 0, b2 = 0; for (let i = 0; i < SR * .03; i++) { const t = i / SR; const n = rnd(); b1 += .6 * (n - b1); b2 += .6 * (b1 - b2); const v = (b1 - b2) * Math.exp(-t * 260) * g; add(sfx, s0 + i, v, v, .12); } }
function whoosh(t0, len, g, up = true) { const s0 = Math.round(t0 * SR); let lp = 0; for (let i = 0; i < SR * len; i++) { const t = i / SR, k = t / len; const env = Math.sin(Math.PI * k) ** 2; const c = up ? 300 + 2500 * k : 2800 - 2500 * k; const a = 1 - Math.exp(-2 * Math.PI * c / SR); lp += a * (rnd() - lp); const v = lp * env * g; add(sfx, s0 + i, v * (1 - .5 * k), v * (.5 + .5 * k), .5); } }
function swell(t0, len, m, g) { const s0 = Math.round(t0 * SR); let ph = 0, ph2 = 0; for (let i = 0; i < SR * len; i++) { const t = i / SR, k = t / len; ph += mtof(m) / SR; ph2 += mtof(m + 7) / SR; const e = Math.pow(k, 2) * (1 - Math.pow(k, 8)); const v = (Math.sin(2 * Math.PI * ph) + .6 * Math.sin(2 * Math.PI * ph2)) * e * g; add(sfx, s0 + i, v, v, .6); } }
function boom(t0, g) { const s0 = Math.round(t0 * SR); let ph = 0; for (let i = 0; i < SR * 1.6; i++) { const t = i / SR; ph += (55 + 30 * Math.exp(-t * 6)) / SR; const v = Math.sin(2 * Math.PI * ph) * Math.exp(-t * 2.2) * g; add(sfx, s0 + i, v, v, .3); } }

swell(0.0, 1.0, 57, .05); whoosh(0.0, 1.0, .05);         // orb is born
pluck(1.0, 76, .11, -.1); pluck(1.05, 81, .07, .1);      // hook bubble pop
whoosh(3.0, 1.4, .05, false);                            // orb travels to its corner
pluck(4.5, 84, .05, .3);                                 // site tooltip
tick(6.45, .22); pluck(6.5, 81, .09); pluck(6.56, 88, .04, .2); // click orb + chat opens
pluck(6.62, 76, .05, -.2);                               // greeting
tick(8.58, .2); pluck(8.62, 84, .07, .25);               // chip -> sent
pluck(10.35, 81, .07, -.2); pluck(10.41, 76, .05, -.2);  // answer arrives
pluck(10.95, 79, .05, .1);                               // lead card
for (let k = 0; k < 5; k++) tick(11.95 + k * .08, .06);  // typing name
for (let k = 0; k < 16; k++) tick(12.6 + k * .044, .045);// typing phone
tick(11.87, .15); tick(12.52, .15); tick(13.5, .2);
[72, 76, 79, 84].forEach((m, j) => pluck(14.0 + j * .07, m + 12, .06, j % 2 ? .25 : -.25, .6)); // thanks: sparkle arpeggio
whoosh(15.2, .8, .04); pluck(16.225, 76, .05, .2, .6, 4); pluck(17.475, 76, .04, .2, .6, 4); // WhatsApp pulse bells
whoosh(17.2, .7, .05);                                   // dip to outro
boom(17.9, .2); pluck(17.9, 69, .06, 0, .7, 3); pluck(17.95, 76, .05, -.2, .7, 3);
pluck(18.6, 88, .045, .15, .7, 4);                       // logo

// ── reverb (Schroeder/Freeverb-ish) on the shared send ──
function reverb(inp) {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356].map(d => ({ d: Math.round(d * SR / 44100), b: null, i: 0, lp: 0 }));
  const aps = [556, 441, 341].map(d => ({ d: Math.round(d * SR / 44100), b: null, i: 0 }));
  combs.forEach(c => c.b = new Float32Array(c.d)); aps.forEach(a => a.b = new Float32Array(a.d));
  const out = new Float32Array(N);
  for (let n = 0; n < N; n++) {
    let s = 0; const x = inp[n] * .3;
    for (const c of combs) { const y = c.b[c.i]; c.lp = y * .75 + c.lp * .25; c.b[c.i] = x + c.lp * .84; c.i = (c.i + 1) % c.d; s += y; }
    for (const a of aps) { const y = a.b[a.i]; const v = -s + y; a.b[a.i] = s + y * .5; a.i = (a.i + 1) % a.d; s = v; }
    out[n] = s;
  }
  return out;
}
const rvL = reverb(send[0]); seed = 99; const rvR = (() => { const tmp = new Float32Array(N); for (let i = 23; i < N; i++) tmp[i] = send[1][i - 23]; return reverb(tmp); })();
// ── mix ──
const out = [new Float32Array(N), new Float32Array(N)]; let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR; const fadeOut = t > DUR - .4 ? (DUR - t) / .4 : 1; const fadeIn = Math.min(1, t / .02);
  for (let c = 0; c < 2; c++) { const rv = c ? rvR[i] : rvL[i]; let v = (music[c][i] + sfx[c][i] + rv * .35) * fadeOut * fadeIn; v = Math.tanh(v * 1.4) / 1.4; out[c][i] = v; peak = Math.max(peak, Math.abs(v)); }
}
const g = 0.89 / peak; // -1 dBFS
const buf = Buffer.alloc(44 + N * 4); const w = (o, s) => buf.write(s, o);
w(0, 'RIFF'); buf.writeUInt32LE(36 + N * 4, 4); w(8, 'WAVE'); w(12, 'fmt '); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); w(36, 'data'); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) for (let c = 0; c < 2; c++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, out[c][i] * g)) * 32767), 44 + i * 4 + c * 2);
fs.writeFileSync('audio.wav', buf); console.log('audio.wav peak', peak.toFixed(3));

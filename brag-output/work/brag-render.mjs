// node brag-render.mjs --stills 1,2.5 | --video [--workers N]
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path'; import { spawn } from 'child_process';
import ffmpeg from 'ffmpeg-static';
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const FPS = 30, DUR = 20.4, DIR = path.resolve('.');
const url = 'file://' + path.join(DIR, 'comp/index.html');
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--force-color-profile=srgb', '--allow-file-access-from-files'] });
async function page() {
  const p = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', e => console.error('pageerror', e.message));
  p.on('console', m => { if (m.type() === 'error') console.error('console', m.text()); });
  await p.goto(url); await p.evaluate(() => window.ready); return p;
}
const shot = async (p, t, file) => { await p.evaluate(tt => window.seek(tt), t); await p.screenshot({ path: file, type: 'png' }); };
if (opt('stills')) {
  const p = await page(); fs.mkdirSync('stills', { recursive: true });
  for (const t of String(opt('stills')).split(',').map(Number)) { const f = `stills/s_${t.toFixed(2)}.png`; await shot(p, t, f); console.log(f); }
} else if (opt('video')) {
  const N = Math.round(DUR * FPS); const fd = 'frames'; fs.rmSync(fd, { recursive: true, force: true }); fs.mkdirSync(fd);
  const W = Number(opt('workers', 3)); const pages = await Promise.all(Array.from({ length: W }, page));
  let next = 0, done = 0; const t0 = Date.now();
  await Promise.all(pages.map(async p => { while (next < N) { const i = next++; await shot(p, i / FPS, `${fd}/f_${String(i).padStart(5, '0')}.png`); if (++done % 60 === 0) console.log(done, '/', N, ((Date.now() - t0) / 1000 | 0) + 's'); } }));
  console.log('frames done', (Date.now() - t0) / 1000);
  await new Promise((res, rej) => { const pr = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${fd}/f_%05d.png`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', 'silent.mp4'], { stdio: 'inherit' }); pr.on('exit', c => c ? rej(c) : res()); });
  console.log('wrote silent.mp4');
}
await browser.close();

// node brag-render.mjs --stills 1,2.5  |  --video
// Serves work/ over HTTP (the iframe must be same-origin) and renders frames in time order.
import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path'; import { spawn } from 'child_process';
import ffmpeg from 'ffmpeg-static';
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const FPS = 30, DUR = 21.5, ROOT = path.resolve('.');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/comp/index.html`;
const browser = await chromium.launch({ args: ['--force-color-profile=srgb'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, colorScheme: 'light' });
page.on('pageerror', e => console.error('pageerror', e.message));
page.on('console', m => { if (m.type() === 'error') console.error('console', m.text()); });
await page.goto(url); await page.evaluate(() => window.ready);
const shot = async (t, file) => { await page.evaluate(tt => window.seek(tt), t); await page.screenshot({ path: file, type: 'png' }); };
if (opt('stills')) {
  fs.mkdirSync('stills', { recursive: true });
  for (const t of String(opt('stills')).split(',').map(Number)) { const f = `stills/s_${t.toFixed(2)}.png`; await shot(t, f); console.log(f); }
} else if (opt('video')) {
  const N = Math.round(DUR * FPS); const fd = 'frames'; fs.rmSync(fd, { recursive: true, force: true }); fs.mkdirSync(fd);
  const t0 = Date.now();
  for (let i = 0; i < N; i++) { await shot(i / FPS, `${fd}/f_${String(i).padStart(5, '0')}.png`); if ((i + 1) % 90 === 0) console.log(i + 1, '/', N, ((Date.now() - t0) / 1000 | 0) + 's'); }
  await new Promise((res, rej) => { const p = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${fd}/f_%05d.png`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', 'silent.mp4'], { stdio: 'inherit' }); p.on('exit', c => c ? rej(c) : res()); });
  console.log('wrote silent.mp4');
}
await browser.close(); server.close();

// Local Math Trail demo: real index.html, fictional student "Demo", no network writes.
// Serves only files under MATH_TRAIL_DIR; never touches ~/.math-trail/backups.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const root = path.resolve(process.env.MATH_TRAIL_DIR || path.join(process.env.HOME, 'code/Products/business-apps/math-trail'));
const PORT = Number(process.env.PORT) || 4321;
const day = (n) => { const d = new Date('2026-10-22T15:00:00Z'); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0,10); };
const done = {}, log = [], daily = {};
let xp = 0, pts = 0;
for (let i = 0; i < 38; i++) {
  const date = day(Math.floor((37 - i) / 2)); const c = 7 + (i * 7) % 4; const p = c >= 9;
  const e = { c, p, xp: c * 10 + (p ? 20 : 0), pts: c + (p ? 2 : 0), date, ts: Date.parse(date + 'T21:00:00Z') + i * 60000 };
  done[i] = e; xp += e.xp; pts += e.pts;
  log.unshift({ t:'lesson', gi:i, ...e });
  daily[date] = { n:(daily[date]?.n||0)+1, xp:(daily[date]?.xp||0)+e.xp, c:(daily[date]?.c||0)+c };
}
const state = { xp, pts, redeemed:0, done, today:{ date:day(0), n:2 }, streak:{ cur:9, best:12, last:day(0) }, daily, log:log.slice(0,31),
  videos:{}, mistakes:[], bonus:{ date:day(0), c:0 }, firstDay:day(19), penaltyUpTo:day(1), profile:{ name:'Demo', avatar:'⭐', created:day(20) },
  rev: Date.now(), coach:{ m:{ 'g8-1':100, 'g8-2':92, 'g8-3':64 }, sessions:14, qa:212, qc:171 } };
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const json = (o, s=200) => { res.writeHead(s, {'Content-Type':'application/json'}); res.end(JSON.stringify(o)); };
  if (url.pathname === '/api/login') return json({ ok:true, role:'student', username:'demo', name:'Demo' });
  if (url.pathname === '/api/state') { if (req.method === 'GET') return json({ state, username:'demo', role:'student' }); req.resume(); return json({ ok:true }); }
  if (url.pathname.startsWith('/api/')) return json({}, 404);
  const file = url.pathname === '/' ? '/index.html' : url.pathname; const full = path.join(root, file);
  if (!full.startsWith(root + path.sep) || !fs.existsSync(full)) { res.writeHead(404); return res.end('not found'); }
  const type = full.endsWith('.html') ? 'text/html' : full.endsWith('.js') ? 'text/javascript' : full.endsWith('.json') ? 'application/json' : full.endsWith('.png') ? 'image/png' : 'application/octet-stream';
  res.writeHead(200, {'Content-Type':type, 'Cache-Control':'no-store'}); res.end(fs.readFileSync(full));
}).listen(PORT, '127.0.0.1', () => console.log('math trail demo on http://127.0.0.1:' + PORT));

// Trust Course Studio orchestrator: one local process. Serves the UI, a small REST API for reads and
// uploads, and a WebSocket that carries stage events out and gate decisions back. The API key lives in
// this process's environment only; it never reaches the UI bundle or any output.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { WebSocketServer } from 'ws';
import { settings, UI_DIST, KIT, FIXTURES, STUDIO } from './config.js';
import { Run, bus } from './run.js';
import { pipelineFor, recover } from './pipeline.js';
import { snapshot, summary } from './state.js';
import { catalogue } from './patterns/select.js';
import { embed } from './patterns/embed.js';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.gz': 'application/gzip', '.svg': 'image/svg+xml' };

function send(res, code, body, type = 'application/json') {
  const data = type === 'application/json' ? JSON.stringify(body) : body;
  res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(data);
}
function sendFile(res, f, extra = {}) {
  if (!fs.existsSync(f) || !fs.statSync(f).isFile()) return send(res, 404, { error: 'not found' });
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store', ...extra });
  fs.createReadStream(f).pipe(res);
}
function body(req, limit = 200 << 20) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on('data', c => { n += c.length; if (n > limit) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
const json = async req => { const b = await body(req, 2 << 20); return b.length ? JSON.parse(b.toString('utf8')) : {}; };
function getRun(id) { const r = new Run(id); if (!r.exists()) throw Object.assign(new Error('no such run'), { code: 404 }); return r; }
function inside(base, rel) { const f = path.resolve(base, rel); return f.startsWith(path.resolve(base) + path.sep) ? f : null; }

function lanUrls(port) {
  return Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => `http://${i.address}:${port}`);
}

/** Patterns used across every run: the demand signal for the pattern designer. */
function usage() {
  const out = {};
  for (const run of Run.list()) {
    const p = run.readJSON('patterns.json', { slots: {} });
    for (const s of Object.values(p.slots || {})) {
      for (const c of s.candidates || []) (out[c.n] ||= { proposed: 0, accepted: [], kept: 0 }).proposed++;
      if (s.decision === 'accepted') out[s.accepted].accepted.push({ run: run.id, title: run.meta().title, lesson: s.lesson, step: s.step });
      if (s.decision === 'kept') for (const c of s.candidates || []) out[c.n].kept++;
    }
  }
  return out;
}

async function route(req, res) {
  const u = new URL(req.url, 'http://x');
  const parts = u.pathname.split('/').filter(Boolean);
  const M = req.method;

  if (parts[0] === 'fonts') return sendFile(res, inside(path.join(KIT, 'eval/fonts'), parts.slice(1).join('/')) || '');
  if (parts[0] !== 'api') {
    const f = path.join(UI_DIST, 'index.html');
    if (!fs.existsSync(f)) return send(res, 200, '<p style="font:16px system-ui;padding:2em">UI not built. Run <code>npm run build</code> or <code>npm run dev</code>.</p>', 'text/html');
    return sendFile(res, f);
  }
  const [, a, id, b, c] = parts;

  if (a === 'health') return send(res, 200, { ok: true, mode: settings.agents, models: settings.models, concurrency: settings.concurrency, lan: settings.host === '0.0.0.0' ? lanUrls(settings.port) : [], catalogue: catalogue().version, patterns: catalogue().patterns.length });
  if (a === 'catalogue') return send(res, 200, { ...catalogue(), usage: usage() });
  if (a === 'patterns' && id && b === 'embed') {
    const e = embed(Number(id), JSON.parse(u.searchParams.get('vars') || '{}'), u.searchParams.get('theme') || 'light');
    return e ? send(res, 200, e) : send(res, 404, { error: 'no such pattern' });
  }
  if (a === 'runs' && !id && M === 'GET') return send(res, 200, Run.list().map(r => summary(r, pipelineFor(r))).sort((x, y) => (y.updated || '').localeCompare(x.updated || '')));
  if (a === 'runs' && !id && M === 'POST') {
    const j = await json(req);
    if (!j.title?.trim()) return send(res, 400, { error: 'A course needs a title.' });
    const run = Run.create({ title: j.title.trim(), domain: j.domain || 'mixed', learner: j.learner, author: j.author });
    return send(res, 200, { id: run.id });
  }
  if (a !== 'runs' || !id) return send(res, 404, { error: 'unknown endpoint' });
  const run = getRun(id); const pl = pipelineFor(run);

  if (!b && M === 'GET') return send(res, 200, snapshot(run, pl));
  if (b === 'source' && M === 'POST') {
    const name = path.basename(u.searchParams.get('name') || 'source.md').replace(/[^\w.\- ]+/g, '_');
    const buf = await body(req);
    fs.mkdirSync(path.join(run.studio, 'source'), { recursive: true });
    fs.writeFileSync(path.join(run.studio, 'source', name), buf);
    run.log('source.added', { stage: 'intake', name, bytes: buf.length });
    return send(res, 200, { ok: true, name });
  }
  if (b === 'source' && M === 'DELETE') {
    const name = path.basename(u.searchParams.get('name') || '');
    fs.rmSync(path.join(run.studio, 'source', name), { force: true });
    run.log('source.removed', { stage: 'intake', name });
    return send(res, 200, { ok: true });
  }
  if (b === 'sample' && M === 'POST') {
    fs.mkdirSync(path.join(run.studio, 'source'), { recursive: true });
    fs.copyFileSync(path.join(FIXTURES, 'cissp/source.md'), path.join(run.studio, 'source', 'cissp-deck-excerpt.md'));
    run.log('source.added', { stage: 'intake', name: 'cissp-deck-excerpt.md', sample: true });
    return send(res, 200, { ok: true });
  }
  if (b === 'sources' && M === 'GET') {
    const d = path.join(run.studio, 'source');
    return send(res, 200, fs.existsSync(d) ? fs.readdirSync(d).map(n => ({ name: n, bytes: fs.statSync(path.join(d, n)).size })) : []);
  }
  if (b === 'start' && M === 'POST') { pl.go(); return send(res, 200, { ok: true }); }
  if (b === 'retry' && c && M === 'POST') { pl.retry(c); return send(res, 200, { ok: true }); }
  if (b === 'file' && M === 'GET') {
    const f = inside(run.dir, u.searchParams.get('path') || '');
    if (!f || f.includes(`${path.sep}.git${path.sep}`)) return send(res, 403, { error: 'outside the run' });
    // course HTML is served sandboxed: scripts run, but with no access to the studio's origin
    return sendFile(res, f, f.endsWith('.html') ? { 'content-security-policy': "sandbox allow-scripts allow-modals; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src data:; frame-src 'self' about: data:" } : {});
  }
  if (b === 'preview' && M === 'GET') {
    try {
      const out = path.join(run.dir, 'dist', 'preview.html');
      execFileSync('python3', ['-c', `import build; build.build(out=${JSON.stringify(out)})`], { cwd: run.dir });
      return sendFile(res, out, { 'content-security-policy': "sandbox allow-scripts allow-same-origin allow-modals; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src data:; frame-src 'self' about: data:" });
    } catch (e) { return send(res, 500, `<p style="font:16px system-ui;padding:2em">Preview build failed: ${String(e.message).slice(0, 400)}</p>`, 'text/html'); }
  }
  if (b === 'download' && M === 'GET') {
    const which = c === 'source' ? `${run.id}-source.tar.gz` : c === 'note' ? 'build-note.md' : 'index.html';
    return sendFile(res, path.join(run.studio, 'publish', which), { 'content-disposition': `attachment; filename="${which === 'index.html' ? run.id + '.html' : which}"` });
  }
  if (b === 'report' && M === 'GET') return sendFile(res, path.join(run.studio, 'report.md'));
  if (b === 'artifact' && M === 'POST') { const j = await json(req); run.setMeta({ artifactUrl: j.url || null }); run.log('artifact.url', { stage: 'gate-publish', url: j.url }); return send(res, 200, { ok: true }); }
  return command(run, pl, b, M === 'POST' ? await json(req) : {}, c).then(r => send(res, 200, r), e => send(res, e.code || 400, { error: e.message }));
}

/** Commands are shared by REST and the WebSocket. */
async function command(run, pl, cmd, j, arg) {
  switch (cmd) {
    case 'scope': pl.answerScope({ learner: j.learner || '', size: j.size === 'whole' ? 'whole' : 'pilot', pilotCount: Math.max(3, Math.min(5, Number(j.pilotCount) || 3)), incidents: j.incidents === 'imagined' ? 'imagined' : 'cited', useFile: j.useFile !== false }); return { ok: true };
    case 'gate': await pl.decide(arg || j.gate, j.decision, { notes: j.notes, by: j.by }); return { ok: true };
    case 'design': pl.editDesign(j); return { ok: true };
    case 'patterns': return { ok: true, slot: await pl.patternDecision(decodeURIComponent(arg || j.key), j.decision, j.n) };
    case 'repropose': return { ok: true, patterns: pl.reproposePatterns() };
    case 'attest': {
      // a person confirms a NOTES URL this machine could not reach; logged with who and when
      const a = run.readJSON('url-attest.json', {});
      for (const url of [].concat(j.urls || j.url || [])) a[url] = { by: j.by || 'author', t: new Date().toISOString() };
      run.writeJSON('url-attest.json', a);
      run.log('url.attested', { stage: 'factbase', urls: [].concat(j.urls || j.url || []), by: j.by || 'author' });
      return { ok: true };
    }
    case 'presence': if (j.gate && j.seconds > 0 && j.seconds <= 120) run.log('human.time', { stage: 'gate-' + j.gate, gate: j.gate, seconds: Math.round(j.seconds) }); return { ok: true };
    default: throw Object.assign(new Error('unknown command ' + cmd), { code: 404 });
  }
}

export function start({ port = settings.port, host = settings.host } = {}) {
  recover(Run.list());
  const server = http.createServer((req, res) => route(req, res).catch(e => send(res, e.code || 500, { error: e.message })));
  const wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', ws => {
    ws.send(JSON.stringify({ type: 'hello', mode: settings.agents }));
    ws.on('message', async raw => {
      let m; try { m = JSON.parse(raw); } catch { return; }
      try {
        const run = getRun(m.run); const pl = pipelineFor(run);
        const r = await command(run, pl, m.cmd, m.data || {}, m.arg);
        ws.send(JSON.stringify({ type: 'ack', id: m.id, ok: true, result: r }));
      } catch (e) { ws.send(JSON.stringify({ type: 'ack', id: m.id, ok: false, error: e.message })); }
    });
  });
  // stage.started, gate.waiting, lesson.check, round.scored ... go to every client
  bus.on('event', ev => {
    const msg = JSON.stringify({ type: 'event', ev });
    for (const c of wss.clients) if (c.readyState === 1) c.send(msg);
  });
  return new Promise(resolve => server.listen(port, host, () => {
    const where = host === '0.0.0.0' ? lanUrls(port).concat(`http://localhost:${port}`) : [`http://${host}:${port}`];
    console.log(`Trust Course Studio on ${where.join('  ')}  ·  agents: ${settings.agents}${settings.agents === 'mock' ? ' (no API key found; fixture agents)' : ''}`);
    resolve(server);
  }));
}

if (import.meta.url === `file://${process.argv[1]}`) start();
export { STUDIO };

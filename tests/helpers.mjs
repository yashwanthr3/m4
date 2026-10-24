// Shared helpers: start an orchestrator in a child process against a scratch runs folder, drive it over REST.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { activate } from '../scripts/venv.mjs';

/** The repo's .venv python (or python3 on PATH); also puts .venv first on PATH for child processes. */
export const PYTHON = activate();

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const sleep = ms => new Promise(r => setTimeout(r, ms));

export function scratch(name) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), `tcs-${name}-`));
  return d;
}

let nextPort = 4500 + Math.floor(Math.random() * 300);
export async function studio({ runs, env = {} }) {
  const port = nextPort++;
  const child = spawn('node', [path.join(ROOT, 'apps/orchestrator/src/server.js')], {
    env: { ...process.env, STUDIO_RUNS: runs, STUDIO_AGENTS: 'mock', STUDIO_URL_CHECK: 'warn', PORT: String(port), HOST: '127.0.0.1', ...env },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let log = '';
  child.stdout.on('data', d => { log += d; });
  child.stderr.on('data', d => { log += d; });
  const B = `http://127.0.0.1:${port}/api`;
  for (let i = 0; i < 100; i++) { try { await fetch(B + '/health'); break; } catch { await sleep(100); } }
  const get = p => fetch(B + p).then(r => r.json());
  const post = (p, j) => fetch(B + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(j || {}) }).then(r => r.json());
  async function until(id, pred, what, secs = 900) {
    for (let i = 0; i < secs * 2; i++) {
      const s = await get('/runs/' + id);
      if (pred(s)) return s;
      const bad = s.stages?.find(x => ['blocked', 'failed'].includes(x.status));
      if (bad) throw new Error(`${what}: stage ${bad.id} ${bad.status}: ${bad.detail}`);
      await sleep(500);
    }
    throw new Error('timeout waiting for ' + what + '\n' + log.slice(-2000));
  }
  return { child, port, get, post, until, log: () => log, stop: () => new Promise(r => { child.once('exit', r); child.kill('SIGKILL'); }) };
}

export const stage = (s, id) => s.stages.find(x => x.id === id);

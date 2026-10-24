// Orchestrator -> eval worker. One call per suite: `evals run <suite> --course <dir> --ids ... --json`.
import { spawn } from 'node:child_process';
import { WORKER, PYTHON } from './config.js';

export function runEval(suite, { course, ids, label, extra = [], timeoutMs = 60 * 60 * 1000 } = {}) {
  const args = [WORKER, 'run', suite, '--json'];
  if (course) args.push('--course', course);
  if (ids?.length) args.push('--ids', ...ids);
  if (label) args.push('--label', label);
  args.push(...extra);
  return new Promise((resolve) => {
    const p = spawn(PYTHON, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    const timer = setTimeout(() => p.kill('SIGKILL'), timeoutMs);
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { err += d; });
    p.on('close', () => {
      clearTimeout(timer);
      const line = out.trim().split('\n').pop() || '';
      try { resolve(JSON.parse(line)); } catch { resolve({ ok: false, suite, error: (err || out).slice(-800) || 'no output' }); }
    });
  });
}

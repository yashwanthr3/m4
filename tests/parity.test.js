// Parity: the vendored kit is byte-for-byte, the patch applies cleanly, and the kit's own smoke test on
// examples/cissp passes both pristine and patched (the pattern block changes nothing for lessons without one).
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { ROOT, PYTHON } from './helpers.mjs';

const worker = (...a) => JSON.parse(execFileSync(PYTHON, [path.join(ROOT, 'workers/evals/evals.py'), 'run', ...a, '--json'], { encoding: 'utf8', maxBuffer: 32 << 20 }).trim().split('\n').pop());

test('vendored files match the lock and the patch applies', () => {
  const out = execFileSync('node', [path.join(ROOT, 'scripts/vendor.mjs'), 'check'], { encoding: 'utf8' });
  assert.match(out, /vendor OK/);
  assert.match(out, /applies cleanly/);
});

test('kit smoke on examples/cissp passes, pristine', { timeout: 600000 }, () => {
  const r = worker('smoke', '--pristine');
  assert.equal(r.ok, true, JSON.stringify(r.steps, null, 1));
});

test('kit smoke on examples/cissp passes, with the pattern-block patch', { timeout: 600000 }, () => {
  const r = worker('smoke');
  assert.equal(r.patched, true);
  assert.equal(r.ok, true, JSON.stringify(r.steps, null, 1));
  assert.deepEqual(r.steps.suite.lessons, { ch04: true, ch05: true, cp2: true, ch15: true });
});

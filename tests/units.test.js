// Fast unit tests: role write permissions, pattern eligibility and exclusion, theme map parity, scores.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';
import { canWrite, bashAllowed } from '../apps/orchestrator/src/agents/index.js';
import { eligibleSlots, select, proposeAll } from '../apps/orchestrator/src/patterns/select.js';
import { PATTERN_MAP } from '../vendor/patterns/themes.mjs';
import { learners } from '../apps/orchestrator/src/scores.js';

test('one hand on the engine: no role can write engine, eval scripts, tools or build.py', () => {
  for (const role of ['research', 'design', 'exemplar', 'author', 'review', 'taste', 'learner', 'fixer', 'factcheck', 'panel']) {
    for (const f of ['engine/engine.js', 'engine/engine.css', 'eval/static_eval.py', 'tools/suite.sh', 'build.py', 'patterns/901.html', '../escape.js']) {
      assert.equal(canWrite(role, f), false, `${role} must not write ${f}`);
    }
  }
  assert.equal(canWrite('author', 'lessons/ch04.js', ['ch04']), true);
  assert.equal(canWrite('author', 'lessons/ch05.js', ['ch04']), false, 'authors write only their own lessons');
  assert.equal(canWrite('learner', 'lessons/ch04.js'), false, 'learners edit nothing but their logs');
  assert.equal(canWrite('panel', 'lessons/ch04.js'), false, 'the final panel edits nothing');
  assert.equal(bashAllowed('python3 eval/static_eval.py ch04'), true);
  assert.equal(bashAllowed("sed -i 's/a/b/' engine/engine.js"), false);
  assert.equal(bashAllowed('echo x > build.py'), false);
});

test('theme map in the engine patch matches vendor/patterns/themes.mjs', () => {
  const diff = fs.readFileSync(path.join(ROOT, 'vendor/patches/pattern-block.diff'), 'utf8');
  const m = diff.match(/const PATTERN_MAP=(\{[^}]+\})/);
  assert.ok(m, 'PATTERN_MAP not found in the patch');
  assert.deepEqual(JSON.parse(m[1].replace(/'/g, '"')), PATTERN_MAP);
});

const lesson = {
  id: 'x1', kind: 'chapter', steps: [
    { blocks: [{ type: 'text', html: 'hook' }] },
    { imagined: true, blocks: [{ type: 'choice', id: 'a', prompt: 'Pause before you send?', options: [] }] },
    { imagined: true, blocks: [{ type: 'stop', id: 's', nodes: [] }] },
    { imagined: true, blocks: [{ type: 'toolkit', id: 't', answer: [1] }] },
    { blocks: [{ type: 'choice', id: 'b', prompt: 'Real record', options: [] }] },
    { imagined: true, blocks: [{ type: 'runaway', id: 'r' }] }
  ]
};

test('patterns go only on imagined steps without the stop chain or toolkit, never on the only signature sim', () => {
  const slots = eligibleSlots(lesson, { lessons: [{ id: 'x1', signature: 'runaway' }] });
  assert.deepEqual(slots.map(s => s.step), [1], 'step 1 only: 2 is a stop, 3 a toolkit, 4 is not imagined, 5 is the only runaway');
});

test('selection: at most two candidates, never a pattern already used', () => {
  const slot = eligibleSlots(lesson, {})[0];
  const c = select(slot, { domain: 'cyber', audience: ['everyone'], used: new Set() });
  assert.ok(c.length <= 2 && c.length > 0);
  const c2 = select(slot, { domain: 'cyber', audience: ['everyone'], used: new Set(c.map(x => x.n)) });
  assert.ok(c2.every(x => !c.some(y => y.n === x.n)));
  const p = proposeAll({ x1: lesson }, { domain: 'cyber', audience: ['everyone'] }, { slots: { 'x1:1': { decision: 'accepted', accepted: 902, candidates: [] } } });
  assert.equal(p.slots['x1:1'].decision, 'accepted', 'an accepted slot is kept on re-proposal');
});

test('learner aggregation counts quits, understood and per-dimension means', () => {
  const d = fs.mkdtempSync(path.join(ROOT, 'runs', '.t-'));
  try {
    fs.writeFileSync(path.join(d, 'lx-ana-1.json'), JSON.stringify({ ch01: { scores: [4, 4, 4, 4, 4, 4, 4], steps: [{ understood: 2, motivation: 4 }, { understood: 1, motivation: 2, quit: true }] } }));
    fs.writeFileSync(path.join(d, 'lx-bo-1.json'), JSON.stringify({ ch01: { scores: [5, 5, 5, 5, 5, 5, 5], steps: [{ understood: 2, motivation: 5 }] } }));
    const a = learners(d);
    assert.equal(a.mean, 4.5); assert.equal(a.quits, 1); assert.equal(a.low, 1); assert.equal(a.understood, 67); assert.equal(a.by, 'simulated learners');
  } finally { fs.rmSync(d, { recursive: true, force: true }); }
});

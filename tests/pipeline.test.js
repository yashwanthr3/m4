// End-to-end on the bundled sample with mock agents and the REAL kit evals:
//  - a pilot reaches each gate in order, and no author starts before gate 2;
//  - a library pattern accepted into an imagined step passes static, e2e, overlap and the pattern contract,
//    and works as a gate inside the lesson at phone and desktop widths;
//  - killing the orchestrator during authoring loses no approved gate and re-runs only unfinished lessons;
//  - publish produces dist, the source tar.gz and a build note that labels simulated learners.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, PYTHON, scratch, studio, stage, sleep } from './helpers.mjs';

test('pilot: gates in order, pattern slot, resume after a crash, publish', { timeout: 1800000 }, async t => {
  const runs = scratch('pipeline');
  const env = { STUDIO_CONCURRENCY: '1', STUDIO_LESSONS_PER_AGENT: '1' };
  let s1 = await studio({ runs, env });
  const { id } = await s1.post('/runs', { title: 'Pilot test', domain: 'cyber' });
  await s1.post(`/runs/${id}/sample`);
  await s1.post(`/runs/${id}/start`);
  let s = await s1.until(id, s => stage(s, 'intake').waitingFor === 'scope', 'scope question');
  assert.equal(s.classify.kind, 'concept-only', 'the deck sample is classified concept-only');
  assert.equal(s.classify.mismatch, false);
  await s1.post(`/runs/${id}/scope`, { learner: 'CISSP candidates', size: 'pilot', pilotCount: 4, incidents: 'cited' });

  s = await s1.until(id, s => stage(s, 'gate-design').status === 'waiting', 'gate 1');
  assert.equal(s.config.ok, true, 'config_check prints config OK');
  assert.equal(s.factbase.quotes.ok, true, 'every src quotation is verbatim in the raw source');
  await s1.post(`/runs/${id}/design`, { lesson: 'ch05', fields: { device: 'The FOI response workbook, as published' } });
  await s1.post(`/runs/${id}/gate/design`, { decision: 'approve', by: 'test' });

  s = await s1.until(id, s => stage(s, 'gate-exemplar').status === 'waiting', 'gate 2');
  assert.equal(s.exemplar.pass, true);
  assert.ok(s.exemplar.shots.some(f => f.includes('phone-dark')) && s.exemplar.shots.some(f => f.includes('desktop-light')));
  assert.equal(s.agents.filter(a => a.role === 'author').length, 0, 'no author before gate 2');
  assert.match(fs.readFileSync(path.join(runs, id, 'DESIGN.md'), 'utf8'), /as published/, 'gate-1 edits reach DESIGN.md');
  await s1.post(`/runs/${id}/gate/exemplar`, { decision: 'approve', by: 'test' });

  // crash during authoring, after the first lesson is recorded
  await s1.until(id, s => s.log.some(e => e.type === 'lesson.authored' && e.stage === 'author'), 'first authored lesson');
  await s1.stop();
  const before = execFileSync('git', ['log', '--oneline'], { cwd: path.join(runs, id), encoding: 'utf8' });
  assert.match(before, /Gate 1 approved/); assert.match(before, /Gate 2 approved/);
  const authoredBefore = new Set(fs.readFileSync(path.join(runs, id, 'studio/events.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)).filter(e => e.type === 'lesson.authored' && e.stage === 'author').map(e => e.id));

  const s2 = await studio({ runs, env });
  s = await s2.get(`/runs/${id}`);
  assert.equal(stage(s, 'author').status, 'interrupted');
  assert.equal(stage(s, 'gate-design').status, 'done', 'gate 1 survives the crash');
  assert.equal(stage(s, 'gate-exemplar').status, 'done', 'gate 2 survives the crash');
  const markT = new Date().toISOString();
  await s2.post(`/runs/${id}/retry/author`);
  s = await s2.until(id, s => stage(s, 'author').status === 'done', 'authoring resumed');
  const rerun = s.agents.filter(a => a.role === 'author' && a.started > markT).flatMap(a => a.ids);
  for (const lid of authoredBefore) assert.ok(!rerun.includes(lid), `${lid} was not re-authored`);

  // accept a library pattern into an imagined step
  const slots = s.patterns.slots;
  const key = Object.keys(slots).find(k => k.startsWith('ch15:'));
  assert.ok(key, 'ch15 has an eligible imagined step');
  assert.ok(Object.values(slots).every(x => !['stop', 'toolkit'].includes(x.type)));
  const n = slots[key].candidates[0].n;
  const acc = await s2.post(`/runs/${id}/patterns/${encodeURIComponent(key)}`, { decision: 'accept', n });
  assert.equal(acc.slot.decision, 'accepted');
  const dup = Object.keys(slots).find(k => k !== key && slots[k].candidates.some(c => c.n === n));
  if (dup) {
    const r = await s2.post(`/runs/${id}/patterns/${encodeURIComponent(dup)}`, { decision: 'accept', n });
    assert.match(r.error || '', /never appears twice/);
  }

  s = await s2.until(id, s => stage(s, 'gate-publish').status === 'waiting', 'gate 3', 1500);
  for (const l of s.lessons) assert.equal(l.status, 'passing', `${l.id} passes all four suites`);
  assert.equal(s.patternContract.ok, true, 'pattern autoplay 4 of 4');
  assert.equal(s.patternContract.patterns[String(n)].passed, 4);
  assert.deepEqual(s.publish.blocks, []);
  assert.ok(s.lx.rounds.length >= 1 && s.lx.rounds.length <= 3);
  const pb = JSON.parse(execFileSync(PYTHON, [path.join(ROOT, 'tests/pattern_block.py'), path.join(runs, id), 'ch15'], { encoding: 'utf8' }).trim());
  assert.equal(pb.ok, true, JSON.stringify(pb));

  await s2.post(`/runs/${id}/gate/publish`, { decision: 'approve', by: 'test' });
  s = await s2.until(id, s => stage(s, 'gate-publish').status === 'done', 'published');
  const pub = path.join(runs, id, 'studio/publish');
  assert.ok(fs.existsSync(path.join(pub, 'index.html')));
  assert.ok(fs.existsSync(path.join(pub, `${id}-source.tar.gz`)));
  const note = fs.readFileSync(path.join(pub, 'build-note.md'), 'utf8');
  assert.match(note, /Simulated learners \(not real ones\)/);
  assert.match(note, new RegExp(`#${n} in ch15`), 'provenance names the pattern, lesson and step');
  const log = execFileSync('git', ['log', '--oneline'], { cwd: path.join(runs, id), encoding: 'utf8' });
  assert.match(log, /Gate 3 approved/);
  assert.match(execFileSync('git', ['tag'], { cwd: path.join(runs, id), encoding: 'utf8' }), /snap-review/);
  await s2.stop();
  fs.rmSync(runs, { recursive: true, force: true });
});

test('publish is refused while a lesson fails', { timeout: 120000 }, async () => {
  const { hardBlocks } = await import('../apps/orchestrator/src/stages/publish.js');
  const fake = { lessonIds: () => ['a', 'b'], readJSON: (n, d) => n === 'results/suite.json' ? { lessons: { a: { pass: true }, b: { pass: false } } } : d, studio: '/nonexistent' };
  assert.match(hardBlocks(fake).join(' '), /b not passing/);
  await sleep(1);
});

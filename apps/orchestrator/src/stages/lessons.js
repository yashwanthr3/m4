// Stage 5 · Exemplar (the lead-quality first lesson, highest effort, checked and captured before gate 2)
// Stage 7 · Author lessons (one agent per 5 or 6 lessons, all at once; engine needs collected; pattern
//           slots proposed for every imagined step)
// Stage 8 · Automated suite (hard gate: static, e2e phone + desktop, taste K1-K5, overlap O1-O4,
//           pattern contract; lx_auto sets minutes)
import fs from 'node:fs';
import { runAgent, lastJSON } from '../agents/index.js';
import { runEval } from '../evals.js';
import { settings } from '../config.js';
import { readLessons } from '../lessons.js';
import { proposeAll } from '../patterns/select.js';
import { automated, chunk, pool, design, lessonBrief, editRound, problemsOf } from './common.js';

export function exemplarId(run) {
  const d = design(run);
  return d.exemplar || (d.lessons || []).find(l => l.kind === 'chapter')?.id || run.lessonIds()[0];
}

const READ_FIRST = 'Read AUTHORING.md, DESIGN.md, course.json, examples/ch01-exemplar.js and examples/cissp/lessons/ch15.js, eval/RUBRIC.md, eval/TASTE.md and eval/LX.md first.';

export async function exemplar(run, { notes } = {}) {
  const id = exemplarId(run);
  const prompt = `You are the lead. Write the exemplar lesson lessons/${id}.js: the lesson every other author will match.\n${READ_FIRST}\n${lessonBrief(run, id)}\n` +
    'Match examples/ch01-exemplar.js and examples/cissp/lessons/ch15.js in density, voice and craft. Run static_eval, e2e, taste_auto, overlap and lx_auto on it and fix until all pass.' +
    (notes ? `\nThe author asked for these changes at the exemplar sign-off:\n${notes}` : '');
  if (notes) fs.rmSync(run.p('lessons', id + '.js'), { force: true, recursive: false });
  const a = await runAgent(run, { stage: 'exemplar', role: 'exemplar', label: 'lead-exemplar', ids: [id], briefs: ['briefs/AUTHOR_BRIEF.md'], prompt });
  let checks = await automated(run, [id], 'exemplar');
  for (let k = 1; !checks.ok && k < settings.exemplarAttempts; k++) {
    const probs = problemsOf(checks.lessons[id] || {}).map(p => `${p.check}: ${p.text}`).join('\n');
    await runAgent(run, { stage: 'exemplar', role: 'exemplar', label: `lead-exemplar-fix${k}`, ids: [id], resume: a.session, prompt: `The automated suite still fails on ${id}:\n${probs}\nFix the lesson data until every check passes.` });
    checks = await automated(run, [id], 'exemplar');
  }
  const lx = await runEval('lx', { course: run.dir, extra: ['--apply-minutes'] });
  const cap = await runEval('capture', { course: run.dir, ids: [id], label: 'exemplar' });
  run.writeJSON('results/exemplar.json', { by: 'automated', id, pass: checks.ok, problems: problemsOf(checks.lessons[id] || {}), lx: lx.lessons?.[id] || null, shots: cap.shots?.[id] || [] });
  run.log('exemplar.ready', { stage: 'exemplar', id, pass: checks.ok, shots: (cap.shots?.[id] || []).length });
  if (!checks.ok) return { status: 'blocked', detail: `The exemplar ${id} still fails the automated suite.` };
  run.log('lesson.authored', { stage: 'exemplar', id, by: 'lead-exemplar' });
  return { status: 'done', detail: `${id} passes all four suites; ${(cap.shots?.[id] || []).length} screens captured` };
}

function authoredIds(run) {
  return new Set(run.events().filter(e => e.type === 'lesson.authored').map(e => e.id));
}

export async function author(run) {
  const ex = exemplarId(run);
  const done = authoredIds(run);
  const todo = run.lessonIds().filter(id => id !== ex && !done.has(id));
  const groups = chunk(todo, settings.lessonsPerAgent);
  const needs = run.readJSON('engine-needs.json', []);
  await pool(settings.concurrency, groups.map((ids, k) => async () => {
    const label = `author-${ids[0]}`;
    const r = await runAgent(run, {
      stage: 'author', role: 'author', label, ids, briefs: ['briefs/AUTHOR_BRIEF.md'],
      prompt: `Your author name is ${label}. Your lessons: ${ids.join(', ')}.\n${READ_FIRST} This course's exemplar is lessons/${ex}.js.\n` +
        ids.map(id => lessonBrief(run, id)).join('\n') +
        '\nSteps marked imagined:true may later receive a library pattern; write them as normal kit blocks.\n' +
        'End your reply with one fenced json block: {"engine_needs":["need: evidence"], "src_doubts":["..."]}'
    });
    const j = lastJSON(r.text) || {};
    for (const n of j.engine_needs || []) needs.push({ by: label, need: n });
    for (const n of j.src_doubts || []) needs.push({ by: label, need: n, kind: 'source question' });
    const parsed = readLessons(run, ids);
    for (const id of ids) {
      if (parsed[id] && !parsed[id].__error) run.log('lesson.authored', { stage: 'author', id, by: label });
      else run.log('lesson.failed', { stage: 'author', id, by: label, error: parsed[id]?.__error || 'no lesson file' });
    }
  }));
  run.writeJSON('engine-needs.json', needs);
  const missing = run.lessonIds().filter(id => !authoredIds(run).has(id));
  if (missing.length) return { status: 'blocked', detail: `Not authored: ${missing.join(', ')}. Retry re-runs only these.` };
  proposePatterns(run);
  return { status: 'done', detail: `${run.lessonIds().length} lessons authored; ${needs.length} engine needs collected` };
}

export function proposePatterns(run) {
  const lessons = readLessons(run, run.lessonIds());
  const prev = run.readJSON('patterns.json', {});
  const p = proposeAll(lessons, design(run), prev);
  run.writeJSON('patterns.json', p);
  run.log('patterns.proposed', { stage: 'author', slots: Object.keys(p.slots).length, catalogue: p.catalogue });
  return p;
}

export async function suite(run) {
  const ids = run.lessonIds();
  let res = await automated(run, ids, 'suite');
  let pat = await patternContract(run);
  for (let k = 1; (!res.ok) && k <= 2; k++) {
    // an edit round like any other: snapshot, fix, diff, fact re-check
    await editRound(run, `suite-fix-${k}`, 'suite', () => pool(settings.concurrency, chunk(res.failing, settings.lessonsPerAgent).map(part => () => runAgent(run, {
      stage: 'suite', role: 'author', label: `suite-fix${k}-${part[0]}`, ids: part, briefs: ['briefs/AUTHOR_BRIEF.md'],
      prompt: `The automated suite fails on ${part.join(', ')}. Fix the lesson data only, then rerun the evals.\n` +
        part.map(id => `${id}:\n` + problemsOf(res.lessons[id] || {}).map(p => `  ${p.check}: ${p.text}`).join('\n')).join('\n')
    }))));
    const again = await automated(run, res.failing, 'suite');
    res = { ...again, ok: again.ok, failing: again.failing, lessons: { ...res.lessons, ...again.lessons } };
  }
  const lx = await runEval('lx', { course: run.dir, extra: ['--apply-minutes'] });
  run.writeJSON('results/lx_auto.json', { by: 'automated', ...lx });
  run.log('lx.auto', { stage: 'suite', summary: lx.summary, applied: lx.applied_minutes });
  if (!res.ok) return { status: 'blocked', detail: `${res.failing.length} lessons fail: ${res.failing.join(', ')}. They cannot go to review.` };
  if (!pat.ok) return { status: 'blocked', detail: `Pattern contract fails for ${pat.failing.join(', ')}.` };
  return { status: 'done', detail: `${ids.length}/${ids.length} lessons pass static, e2e, taste and overlap` };
}

export async function patternContract(run) {
  const dir = run.p('patterns');
  const pages = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.html')) : [];
  if (!pages.length) { run.writeJSON('results/patterns.json', { by: 'automated', ok: true, patterns: {} }); return { ok: true, failing: [] }; }
  const r = await runEval('patterns', { course: run.dir, extra: ['--shots'] });
  run.writeJSON('results/patterns.json', { by: 'automated', ...r });
  const failing = Object.entries(r.patterns || {}).filter(([, v]) => !v.pass).map(([n]) => n);
  run.log('patterns.contract', { stage: 'suite', ok: r.ok, failing, results: Object.fromEntries(Object.entries(r.patterns || {}).map(([n, v]) => [n, v.passed])) });
  return { ok: !!r.ok, failing };
}

import fs from 'node:fs';
import path from 'node:path';
import { runEval } from '../evals.js';
import { runAgent } from '../agents/index.js';
import { settings } from '../config.js';
import { factcheck as aggFact } from '../scores.js';

export const chunk = (a, n) => { const out = []; for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n)); return out; };

export async function pool(limit, tasks) {
  const results = new Array(tasks.length); let next = 0;
  async function worker() { while (next < tasks.length) { const k = next++; results[k] = await tasks[k](); } }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

export const design = run => run.readJSON('design.json', {});
export const lessonDesign = (run, id) => (design(run).lessons || []).find(l => l.id === id) || {};

/** Lessons whose src files a lesson may draw on (course.json "sources"). */
export function srcFor(run, id) {
  const s = run.courseJSON()?.sources?.[id];
  return (s || [id + '.md']).map(f => 'src/' + f);
}

export function lessonBrief(run, id) {
  const d = lessonDesign(run, id);
  return `- ${id} (${d.kind || 'chapter'}, part ${d.part ?? '?'}): "${d.title || id}". Case: ${d.case || 'see DESIGN.md'}. Device: ${d.device || 'see DESIGN.md'}. ` +
    `Signature mechanic: ${d.signature || 'see DESIGN.md'}. The error the learner commits: ${d.mechanic || 'see DESIGN.md'}. Questions: ${(d.questions || []).join(', ') || 'see DESIGN.md'}. Fact base: ${srcFor(run, id).join(', ')}.`;
}

/** Run the four automated suites on ids, record each lesson's checks, return {ok, lessons, failing}. */
export async function automated(run, ids, label) {
  const res = await runEval('suite', { course: run.dir, ids, label });
  const lessons = res.lessons || {};
  const failing = [];
  for (const id of ids) {
    const r = lessons[id] || { pass: false };
    const problems = problemsOf(r);
    if (!r.pass) failing.push(id);
    run.log('lesson.check', { stage: label.split('-')[0], id, pass: !!r.pass, problems, checks: summary(r) });
  }
  const prev = run.readJSON('results/suite.json', { lessons: {} });
  for (const id of ids) prev.lessons[id] = { ...summary(lessons[id] || {}), pass: !!lessons[id]?.pass, problems: problemsOf(lessons[id] || {}), at: new Date().toISOString(), label };
  prev.by = 'automated'; prev.updated = new Date().toISOString();
  run.writeJSON('results/suite.json', prev);
  return { ok: !failing.length && !res.error, lessons, failing, error: res.error };
}

function summary(r) {
  const k = x => (x ? (x.pass ? 'pass' : 'fail') : 'none');
  return {
    static: k(r.static), e2ePhone: r.e2e ? (r.e2e.runs?.['phone-dark']?.reached_finish && !r.e2e.problems?.some(p => p.includes('phone')) ? 'pass' : 'fail') : 'none',
    e2eDesktop: r.e2e ? (r.e2e.runs?.['desktop-light']?.reached_finish && !r.e2e.problems?.some(p => p.includes('desktop')) ? 'pass' : 'fail') : 'none',
    taste: k(r.taste), overlap: k(r.overlap)
  };
}

export function problemsOf(r) {
  const out = [];
  for (const e of r.static?.errors || []) out.push({ check: 'static', text: Array.isArray(e) ? e.join(' ') : String(e) });
  for (const p of r.e2e?.problems || []) out.push({ check: 'e2e', text: p });
  for (const k of ['K1', 'K2', 'K3', 'K4', 'K5']) for (const p of r.taste?.[k] || []) out.push({ check: `taste ${k}`, text: typeof p === 'string' ? p : JSON.stringify(p) });
  for (const k of ['O1', 'O2', 'O3', 'O4']) for (const p of r.overlap?.[k] || []) out.push({ check: `overlap ${k}`, text: typeof p === 'string' ? p : JSON.stringify(p) });
  return out.slice(0, 40);
}

/**
 * An edit round: snapshot -> edits -> diff of learner-visible text -> independent fact re-check on every
 * added line. Returns {changed: ids, fact: aggregate}. This is a hard gate: unresolved claims block publish.
 */
export async function editRound(run, name, stage, edit) {
  const snap = run.snapshot(name);
  await edit();
  const diff = await runEval('diff', { course: run.dir, extra: ['--snapshot', snap] });
  const changed = Object.entries(diff.lessons || {}).filter(([, v]) => v.added > 0).map(([k]) => k);
  run.writeJSON(`results/diff-${name}.json`, { by: 'automated', round: name, lessons: Object.fromEntries(Object.entries(diff.lessons || {}).map(([k, v]) => [k, { added: v.added, lines: v.lines.slice(0, 400) }])) });
  run.log('diff.ready', { stage, round: name, changed, lines: Object.values(diff.lessons || {}).reduce((s, v) => s + v.added, 0) });
  const fact = await factRecheck(run, name, stage, changed);
  return { changed, fact };
}

export async function factRecheck(run, name, stage, ids) {
  const prefix = `factcheck-${name}-`;
  if (ids.length) {
    await pool(settings.concurrency, chunk(ids, 9).map((part, k) => () => runAgent(run, {
      stage, role: 'factcheck', label: `${name}-${k + 1}`.replace(/[^a-z0-9-]/gi, ''), ids: part,
      briefs: ['briefs/FACT_RECHECK_BRIEF.md'],
      prompt: `Fact re-check after the "${name}" edit round. Your lessons: ${part.join(', ')}. The diffs are already in eval/results/diffs/<id>.added.txt.\n` +
        part.map(id => `- ${id}: fact base ${srcFor(run, id).join(', ')}`).join('\n') +
        `\nWrite eval/results/${prefix}${k + 1}.json in the brief's format, and add "unresolved": [{"line":"...","why":"..."}] for any claim you could not fix without changing what the lesson teaches.`,
      outFile: `${prefix}${k + 1}`
    })));
  }
  // mock agents write factcheck-<label>.json; real agents follow the prompt's file name
  const agg = aggFact(run.p('eval/results'), `factcheck-${name}`);
  run.writeJSON(`results/factcheck-${name}.json`, { ...agg, round: name, ids });
  run.log('fact.rechecked', { stage, round: name, checked: agg.checked, fixed: agg.fixed, unresolved: agg.unresolved, lessons: ids.length });
  return agg;
}

export function exists(run, rel) { return fs.existsSync(run.p(rel)); }
export function listSrc(run) { return fs.existsSync(run.p('src')) ? fs.readdirSync(run.p('src')).filter(f => f.endsWith('.md')) : []; }
export { path };

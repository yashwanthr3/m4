// Stage 9 · Teaching review (fresh agents, never the authors; RUBRIC J1-J8 before and after)
// Stage 10 · Taste round (one critic round, T1-T10; engine problems collected for the lead)
// Stage 11 · Learner loop (simulated learners -> fixers -> fact re-check, at most three rounds; stops at
//            plateau or when no learner would quit and every lesson meets 4.0)
// Every edit round is followed by a fact re-check on its diff and the automated suite.
import fs from 'node:fs';
import path from 'node:path';
import { runAgent } from '../agents/index.js';
import { runEval } from '../evals.js';
import { settings } from '../config.js';
import { teaching, taste as aggTaste, learners as aggLx } from '../scores.js';
import { automated, chunk, pool, design, srcFor, editRound } from './common.js';

async function suiteAfter(run, stage, changed) {
  if (!changed.length) return { ok: true };
  const r = await automated(run, changed, stage);
  return r;
}

export async function review(run) {
  const ids = run.lessonIds();
  const { changed, fact } = await editRound(run, 'review', 'review', () => pool(settings.concurrency, chunk(ids, 9).map((part, k) => () => runAgent(run, {
    stage: 'review', role: 'review', label: `reviewer-${k + 1}`, ids: part, briefs: ['briefs/REVIEW_BRIEF.md'],
    prompt: `Your reviewer name is reviewer-${k + 1}. Your lessons: ${part.join(', ')}. Latest screens: eval/taste/exemplar/ and any later capture.\n` +
      part.map(id => `- ${id}: fact base ${srcFor(run, id).join(', ')}`).join('\n') + `\nWrite eval/results/review-reviewer-${k + 1}.json.`
  }))));
  const t = teaching(run.p('eval/results'));
  run.writeJSON('results/review.json', { ...t, fact, changed });
  run.log('round.scored', { stage: 'review', kind: 'teaching', by: t.by, before: t.before, after: t.after, atBar: t.atBar, claims: t.claims + fact.fixed, lessons: Object.keys(t.lessons).length, mode: settings.agents });
  const s = await suiteAfter(run, 'review', changed);
  if (!s.ok) return { status: 'blocked', detail: `Review edits broke ${s.failing.join(', ')}.` };
  return { status: 'done', detail: `teaching ${t.before ?? '–'} → ${t.after ?? '–'} (bar 4.3); ${t.claims + fact.fixed} invented claims fixed` };
}

export async function taste(run) {
  const ids = run.lessonIds();
  await runEval('capture', { course: run.dir, ids, label: 'taste' });
  const { changed, fact } = await editRound(run, 'taste', 'taste', () => pool(settings.concurrency, chunk(ids, 9).map((part, k) => () => runAgent(run, {
    stage: 'taste', role: 'taste', label: `critic-${k + 1}`, ids: part, briefs: ['briefs/TASTE_CRITIC_BRIEF.md'],
    prompt: `Your critic name is critic-${k + 1}. Your lessons: ${part.join(', ')}. Screens: eval/taste/taste/<id>/. Write eval/results/critic-critic-${k + 1}.json. Avoid renaming labels for taste alone.`
  }))));
  const t = aggTaste(run.p('eval/results'), 'critic-');
  const engine = [];
  for (const f of fs.readdirSync(run.p('eval/results')).filter(f => /^critic-.*\.json$/.test(f))) {
    try { engine.push(...(JSON.parse(fs.readFileSync(run.p('eval/results', f), 'utf8')).engine || [])); } catch { /* skip */ }
  }
  const needs = run.readJSON('engine-needs.json', []);
  for (const e of engine) needs.push({ by: 'taste critics', need: e });
  run.writeJSON('engine-needs.json', needs);
  run.writeJSON('results/taste.json', { ...t, fact, changed, engine });
  run.log('round.scored', { stage: 'taste', kind: 'taste', by: t.by, before: t.mean, lessons: Object.keys(t.lessons).length, mode: settings.agents });
  const s = await suiteAfter(run, 'taste', changed);
  if (!s.ok) return { status: 'blocked', detail: `Critic edits broke ${s.failing.join(', ')}.` };
  return { status: 'done', detail: `design critics ${t.mean ?? '–'}; ${engine.length} engine problems for the lead` };
}

function personas(run) {
  const p = design(run).personas || [];
  const names = p.length ? p : [{ name: 'expert' }, { name: 'newcomer' }, { name: 'reader' }];
  return names.slice(0, 3).map(x => ({ ...x, key: String(x.name).toLowerCase().replace(/[^a-z]/g, '') || 'persona' }));
}

async function measure(run, r) {
  const ids = run.lessonIds();
  await runEval('capture', { course: run.dir, ids, label: 'lx' });
  await runEval('lx', { course: run.dir });
  const dir = `lx_round${r}`;
  fs.rmSync(run.p('eval/results', dir), { recursive: true, force: true });
  fs.mkdirSync(run.p('eval/results', dir), { recursive: true });
  const tasks = [];
  for (const p of personas(run)) {
    chunk(ids, 9).forEach((part, k) => tasks.push(() => runAgent(run, {
      stage: 'learners', role: 'learner', label: `lx-r${r}-${p.key}-${k + 1}`, ids: part, persona: p.key, chunk: k + 1, round: r, dir,
      briefs: ['eval/LX_BRIEF.md', 'eval/LX.md'],
      prompt: `You are ${p.name}: ${p.role || ''}. You already know: ${p.knows || 'see eval/LX.md'}. You quit when: ${p.quits || 'see eval/LX.md'}.\n` +
        `Your lessons, in course order: ${part.join(', ')}. Write eval/results/${dir}/lx-${p.key}-${k + 1}.json (not the path in the brief). ` +
        'Note: the automated player picked answers in the screenshots, and FAST-mode counters can read low; neither is a defect.'
    })));
  }
  await pool(settings.concurrency, tasks);
  const agg = aggLx(run.p('eval/results', dir));
  return agg;
}

export async function learnerLoop(run) {
  const state = run.readJSON('results/lx.json', { by: 'simulated learners', rounds: [] });
  const max = settings.maxLearnerRounds;
  while (state.rounds.length < max) {
    const r = state.rounds.length + 1;
    const last = state.rounds[r - 2];
    if (last?.stopped) break;
    const agg = await measure(run, r);
    const delta = last ? Math.abs((agg.mean ?? 0) - (last.mean ?? 0)) : null;
    const atBar = Object.values(agg.lessons).every(l => l.mean >= 4);
    let stopped = null;
    if (agg.quits === 0 && atBar) stopped = 'no quit points and every lesson at 4.0 or above';
    else if (delta != null && delta < settings.plateau) stopped = `plateau: the mean moved ${delta.toFixed(2)} (< ${settings.plateau})`;
    else if (r === max) stopped = `reached ${max} rounds`;
    const round = { n: r, ...agg, delta, stopped, mode: settings.agents, at: new Date().toISOString() };
    state.rounds.push(round);
    run.writeJSON('results/lx.json', state);
    run.log('round.scored', { stage: 'learners', kind: 'lx', round: r, by: agg.by, mean: agg.mean, dims: agg.dims, understood: agg.understood, quits: agg.quits, low: agg.low, delta, stopped, mode: settings.agents });
    if (stopped) break;

    // fixers on the weakest lessons, then the fact re-check on what they changed
    const weak = Object.entries(agg.lessons).filter(([, l]) => l.mean < 4 || l.quits.length || l.low > 0).sort((a, b) => a[1].mean - b[1].mean).map(([id]) => id);
    const { changed, fact } = await editRound(run, `lx-fix-${r}`, 'learners', () => pool(settings.concurrency, chunk(weak, 5).map((part, k) => () => runAgent(run, {
      stage: 'learners', role: 'fixer', label: `lx-fix${r}-${k + 1}`, ids: part, briefs: ['briefs/LX_FIX_BRIEF.md', 'briefs/AUTHOR_BRIEF.md'],
      prompt: `Learner round ${r} logs are in eval/results/lx_round${r}/. Your lessons (weakest first): ${part.join(', ')}.\n` +
        part.map(id => `- ${id}: mean ${agg.lessons[id].mean}, quits ${agg.lessons[id].quits.length}, low-motivation steps ${agg.lessons[id].low}; fact base ${srcFor(run, id).join(', ')}`).join('\n')
    }))));
    round.fixed = { lessons: weak, changed, fact: { fixed: fact.fixed, unresolved: fact.unresolved, checked: fact.checked } };
    run.writeJSON('results/lx.json', state);
    const s = await suiteAfter(run, 'learners', changed);
    if (!s.ok) return { status: 'blocked', detail: `Fixer edits broke ${s.failing.join(', ')}.` };
  }
  const first = state.rounds[0], lastR = state.rounds[state.rounds.length - 1];
  return { status: 'done', detail: `simulated learners ${first?.mean ?? '–'} → ${lastR?.mean ?? '–'} over ${state.rounds.length} round(s); ${lastR?.stopped || ''}` };
}

export { personas, path };

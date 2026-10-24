// Aggregation of judged scores. Every number carries what produced it: 'automated', 'model panel' or
// 'simulated learners'. Simulated learners are never called real ones; mock runs say "mock".
import fs from 'node:fs';
import path from 'node:path';

const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const r2 = x => x == null ? null : Math.round(x * 100) / 100;

export const DIMS = {
  J: ['Faithful', 'Experiential', 'Sits with you', 'Feedback teaches', 'True to form', 'Clear voice', 'Transfer', 'Craft'],
  T: ['Ownable', 'Coherent grammar', 'Material fidelity', 'Restraint', 'Typography', 'Motion', 'Pacing & first frame', 'Both themes', 'Microcopy', 'Screenshot moment'],
  L: ['Clarity', 'Explains', 'Sticks', 'No friction', 'Motivating', 'Load', 'Pacing']
};

function files(dir, re) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => re.test(f)).map(f => path.join(dir, f));
}
function readAll(list) {
  const out = {};
  for (const f of list) { try { Object.assign(out, JSON.parse(fs.readFileSync(f, 'utf8'))); } catch { /* skip */ } }
  return out;
}

/** Teaching review: review-<name>.json -> per lesson before/after, dims, means. */
export function teaching(dir, prefix = 'review-') {
  const R = readAll(files(dir, new RegExp('^' + prefix + '.*\\.json$')));
  const lessons = {};
  for (const [id, v] of Object.entries(R)) {
    if (!v || !Array.isArray(v.after || v.before)) continue;
    lessons[id] = { before: v.before, after: v.after || v.before, mBefore: r2(mean(v.before || [])), mAfter: r2(mean(v.after || v.before)), claims: v.invented_claims_fixed || 0, fixes: v.fixes || [] };
  }
  const L = Object.values(lessons);
  const dims = k => DIMS.J.map((_, i) => r2(mean(L.map(l => l[k]?.[i]).filter(x => x != null))));
  return {
    by: 'model panel', lessons,
    before: r2(mean(L.map(l => l.mBefore))), after: r2(mean(L.map(l => l.mAfter))),
    dimsBefore: dims('before'), dimsAfter: dims('after'),
    claims: L.reduce((s, l) => s + l.claims, 0),
    atBar: L.filter(l => Math.min(...l.after) >= 4 && l.mAfter >= 4.3).length
  };
}

/** Taste: critic-*.json (before) or taste-final-*.json (score-only panel). Several panels average. */
export function taste(dir, prefix) {
  const list = files(dir, new RegExp('^' + prefix + '.*\\.json$'));
  const per = {};
  for (const f of list) {
    let d; try { d = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; }
    for (const [id, v] of Object.entries(d)) {
      if (!v || !Array.isArray(v.scores)) continue;
      (per[id] ||= []).push(v);
    }
  }
  const lessons = {};
  for (const [id, vs] of Object.entries(per)) {
    const scores = DIMS.T.map((_, i) => r2(mean(vs.map(v => v.scores[i]))));
    lessons[id] = { scores, mean: r2(mean(scores)), weakest: vs.map(v => v.weakest).filter(Boolean), work_order: vs.map(v => v.work_order).filter(Boolean) };
  }
  const L = Object.values(lessons);
  return { by: 'model panel', lessons, mean: r2(mean(L.map(l => l.mean))), dims: DIMS.T.map((_, i) => r2(mean(L.map(l => l.scores[i])))) };
}

/** Simulated learners: lx-<persona>-<chunk>.json in a round folder. */
export function learners(dir) {
  const per = {};
  for (const f of files(dir, /^lx-.+-\d+\.json$/)) {
    const persona = path.basename(f).split('-')[1];
    let d; try { d = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; }
    for (const [id, v] of Object.entries(d)) if (v?.scores) (per[id] ||= {})[persona] = v;
  }
  const lessons = {};
  let allSteps = [], allScores = [];
  for (const [id, ps] of Object.entries(per)) {
    const sc = Object.values(ps).map(v => v.scores);
    const steps = Object.entries(ps).flatMap(([p, v]) => (v.steps || []).map(s => ({ ...s, persona: p })));
    allSteps = allSteps.concat(steps); allScores = allScores.concat(sc);
    lessons[id] = {
      dims: DIMS.L.map((_, i) => r2(mean(sc.map(s => s[i])))),
      mean: r2(mean(sc.map(s => mean(s)))),
      understood: Math.round(100 * steps.filter(s => s.understood === 2).length / Math.max(1, steps.length)),
      quits: steps.filter(s => s.quit).map(s => ({ step: s.step, persona: s.persona })),
      low: steps.filter(s => (s.motivation ?? 5) <= 2).length,
      personas: Object.fromEntries(Object.entries(ps).map(([p, v]) => [p, { mean: r2(mean(v.scores)), confusion: v.confusion, dip: v.dip, fix: v.fix }]))
    };
  }
  return {
    by: 'simulated learners', lessons,
    mean: r2(mean(allScores.map(s => mean(s)))),
    dims: DIMS.L.map((_, i) => r2(mean(allScores.map(s => s[i])))),
    understood: Math.round(100 * allSteps.filter(s => s.understood === 2).length / Math.max(1, allSteps.length)),
    quits: allSteps.filter(s => s.quit).length,
    low: allSteps.filter(s => (s.motivation ?? 5) <= 2).length,
    atBar: Object.values(lessons).filter(l => l.mean >= 4).length
  };
}

/** Fact re-check: factcheck-<name>.json -> per lesson fixed / unresolved claims. */
export function factcheck(dir, prefix) {
  const R = readAll(files(dir, new RegExp('^' + prefix + '.*\\.json$')));
  const lessons = {};
  for (const [id, v] of Object.entries(R)) {
    if (!v || typeof v !== 'object') continue;
    lessons[id] = { checked: v.checked_lines || 0, fixed: v.fixed || [], unresolved: v.unresolved || [] };
  }
  const L = Object.values(lessons);
  return { by: 'model panel', lessons, checked: L.reduce((s, l) => s + l.checked, 0), fixed: L.reduce((s, l) => s + l.fixed.length, 0), unresolved: L.reduce((s, l) => s + l.unresolved.length, 0) };
}

export { mean, r2 };

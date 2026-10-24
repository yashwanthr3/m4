// report.md and the build-and-eval note. Every number names what produced it; simulated learners are
// labelled simulated; a mock run says so in the first line.
import { settings } from './config.js';
import { DIMS } from './scores.js';
import { humanTime } from './state.js';

const f = x => (x == null ? '–' : Number(x).toFixed(2));

export function buildReport(run) {
  const meta = run.meta(); const ids = run.lessonIds();
  const suite = run.readJSON('results/suite.json', { lessons: {} });
  const review = run.readJSON('results/review.json', null);
  const tasteR = run.readJSON('results/taste.json', null);
  const panel = run.readJSON('results/panel.json', null);
  const lx = run.readJSON('results/lx.json', { rounds: [] });
  const pats = run.readJSON('patterns.json', { slots: {} });
  const needs = run.readJSON('engine-needs.json', []);
  const cls = run.readJSON('classify.json', {});
  const facts = run.events().filter(e => e.type === 'fact.rechecked');
  const cost = run.events().filter(e => e.type === 'agent.done').reduce((s, e) => s + (e.cost || 0), 0);
  const ht = humanTime(run.events());
  const mock = settings.agents === 'mock';
  const count = k => ids.filter(id => suite.lessons[id]?.[k] === 'pass').length;
  const first = lx.rounds[0], last = lx.rounds[lx.rounds.length - 1];
  const used = Object.values(pats.slots || {}).filter(s => s.decision === 'accepted');

  const soft = [];
  if (panel?.lessons) for (const [id, l] of Object.entries(panel.lessons)) if (l.mean < 4) soft.push(`${id}: design panel ${f(l.mean)}; weakest: ${l.weakest.join('; ') || 'not named'}`);
  if (last?.lessons) for (const [id, l] of Object.entries(last.lessons)) {
    if (l.mean < 4) soft.push(`${id}: simulated learners ${f(l.mean)}`);
    const lowDim = l.dims.map((v, i) => [v, DIMS.L[i]]).filter(([v]) => v < 4).map(([v, n]) => `${n} ${f(v)}`);
    if (lowDim.length) soft.push(`${id}: below 4 on ${lowDim.join(', ')}`);
    for (const [p, v] of Object.entries(l.personas || {})) if (v.confusion && !/^mock/.test(v.confusion) && v.mean < 4) soft.push(`${id} (${p}): ${v.confusion}`);
  }
  if (review?.lessons) for (const [id, l] of Object.entries(review.lessons)) if (Math.min(...l.after) < 4 || l.mAfter < 4.3) soft.push(`${id}: teaching review ${f(l.mAfter)} (bar 4.3, every dimension 4+)`);

  const lines = [];
  lines.push(`# ${meta.title}: build and eval report`, '');
  if (mock) lines.push('> **Mock run.** Agents were replayed from the kit\'s CISSP examples (STUDIO_AGENTS=mock). The automated suites are real; every judged score below is a fixture and measures nothing.', '');
  lines.push(`**What it is.** ${ids.length} lessons on ${meta.domain}, built with Trust Course Studio from ${cls.files?.join(', ') || 'the source'} (${cls.kind || 'unclassified'}, about ${cls.words || '?'} words). Learner: ${meta.scope?.learner || meta.learner || 'not stated'}.`, '');
  lines.push('## Automated suites (automated)', '');
  lines.push(`| check | lessons passing |`, `|---|---|`);
  lines.push(`| static_eval | ${count('static')}/${ids.length} |`, `| e2e phone-dark | ${count('e2ePhone')}/${ids.length} |`, `| e2e desktop-light | ${count('e2eDesktop')}/${ids.length} |`, `| taste_auto K1-K5 | ${count('taste')}/${ids.length} |`, `| overlap O1-O4 | ${count('overlap')}/${ids.length} |`, '');
  lines.push('## Learner experience (simulated learners, not real ones)', '');
  if (first) {
    lines.push(`| | round 1 | round ${last.n} |`, '|---|---|---|');
    lines.push(`| overall | ${f(first.mean)} | ${f(last.mean)} |`);
    DIMS.L.forEach((d, i) => lines.push(`| ${d} | ${f(first.dims[i])} | ${f(last.dims[i])} |`));
    lines.push(`| steps fully understood | ${first.understood}% | ${last.understood}% |`, `| quit points | ${first.quits} | ${last.quits} |`, `| low-motivation steps | ${first.low} | ${last.low} |`, '');
    lines.push(`Loop stopped: ${last.stopped || 'not stopped'}.`, '');
  } else lines.push('Not run yet.', '');
  lines.push('## Teaching review (model panel, RUBRIC J1-J8)', '');
  lines.push(review ? `Before ${f(review.before)}, after ${f(review.after)} (bar: every dimension 4+, mean 4.3+). ${review.atBar}/${Object.keys(review.lessons).length} lessons at the bar.` : 'Not run yet.', '');
  lines.push('## Design (model panel, TASTE T1-T10)', '');
  lines.push(`Critic round mean ${f(tasteR?.mean)}. Final score-only panel mean ${f(panel?.mean)}.`, '');
  lines.push('## Fact re-check on every edit round (model panel)', '');
  lines.push('| round | lines checked | claims fixed | unresolved |', '|---|---|---|---|');
  for (const e of facts) lines.push(`| ${e.round} | ${e.checked} | ${e.fixed} | ${e.unresolved} |`);
  lines.push('');
  lines.push('## Library patterns used', '');
  if (used.length) { lines.push('| pattern | name | lesson | step |', '|---|---|---|---|'); for (const s of used) lines.push(`| #${s.accepted} | ${s.candidates.find(c => c.n === s.accepted)?.name || ''} | ${s.lesson} | ${s.step} |`); }
  else lines.push('None accepted.');
  const eligible = Object.keys(pats.slots || {}).length;
  lines.push('', `Pattern uptake: ${used.length} of ${eligible} eligible steps.`, '');
  lines.push('## Remaining soft spots', '', ...(soft.length ? soft.map(s => `- ${s}`) : ['- None below the bars.']), '');
  lines.push('## Engine needs and source questions (for the lead)', '', ...(needs.length ? needs.map(n => `- ${n.kind ? n.kind + ': ' : ''}${n.need} (${n.by})`) : ['- None raised.']), '');
  lines.push('## Effort', '', `Human time at the gates: ${Object.entries(ht.byGate).map(([g, s]) => `${g} ${Math.round(s / 60)} min`).join(', ') || 'none logged'} (total ${Math.round(ht.total / 60)} min). Model cost: $${cost.toFixed(2)}${mock ? ' (mock: no calls made)' : ''}.`);

  const note = [
    `# ${meta.title} build note`, '',
    mock ? '_Mock run: judged scores are fixtures._\n' : '',
    `Built with Trust Course Studio on ${new Date().toISOString().slice(0, 10)}. ${ids.length} lessons. Kit: Trust Course Kit v2 + pattern-block.diff.`, '',
    `- Automated: static ${count('static')}/${ids.length}, e2e ${Math.min(count('e2ePhone'), count('e2eDesktop'))}/${ids.length}, taste ${count('taste')}/${ids.length}, overlap ${count('overlap')}/${ids.length}.`,
    `- Simulated learners (not real ones): ${f(first?.mean)} → ${f(last?.mean)}; understood ${first?.understood ?? '–'}% → ${last?.understood ?? '–'}%; quits ${first?.quits ?? '–'} → ${last?.quits ?? '–'}.`,
    `- Teaching review: ${f(review?.before)} → ${f(review?.after)}. Design panel: ${f(panel?.mean)}.`,
    `- Invented claims found by fact re-check: ${facts.map(e => `${e.round} ${e.fixed}`).join(', ') || 'none'}.`,
    `- Patterns: ${used.map(s => `#${s.accepted} in ${s.lesson} step ${s.step}`).join(', ') || 'none'}.`,
    `- Human time at gates: ${Math.round(ht.total / 60)} min.`,
    `- Soft spots: ${soft.slice(0, 5).join('; ') || 'none below the bars'}.`
  ].join('\n');
  return { report: lines.join('\n') + '\n', note: note + '\n' };
}

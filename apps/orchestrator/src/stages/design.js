// Stage 3 · Design. DESIGN.md from the template, course.json from the config template, and
// studio/design.json: the same decisions in a structure the author can edit at gate 1.
// The framework is derived from the source and cited; the studio never ships a default one.
import fs from 'node:fs';
import { runAgent } from '../agents/index.js';
import { runEval } from '../evals.js';

const SHAPE = `studio/design.json shape:
{"title","domain":"ai|cyber|privacy|data|resilience|tech|third-party|mixed","kind":"case-rich|concept-only",
 "audience":["everyone"|"specialist"|"simple"], "exemplar":"<lesson id the lead writes first>",
 "framework":[{"n":1,"q":"...","hint":"where this question ends and its neighbour begins","cites":["case or clause"]}],
 "stop":{"means":"what stop means here","ring":"<=34 chars","stamps":["...","...","...","..."]},
 "ladder":[{"part":1,"name":"...","job":"one word","desc":"one line"}],
 "lessons":[{"id","kind","part","title":"Case: hook","case","citation","concept","device","mechanic":"the error the learner commits","signature":"order|sort|tapfind|runaway|vigil|slider|stop","chain":[{"short":"<=22 chars","control":true|false}],"questions":[n]}],
 "exhibits":[{"object","skin"}], "personas":[{"name","role","knows","quits"}]}`;

export async function design(run, { notes } = {}) {
  const meta = run.meta(); const cases = run.readJSON('cases.json', []);
  const changes = notes ? `\nThe author asked for these changes at the design sign-off. Apply them:\n${notes}\n` : '';
  const r = await runAgent(run, {
    stage: 'design', role: 'design', label: notes ? 'design-revise' : 'design', keepEdits: !!notes,
    briefs: ['AUTHORING.md', 'DESIGN.template.md', 'eval/LX.md'],
    prompt: `Write the course design for "${meta.title}" (stated domain: ${meta.domain}). Learner: ${meta.scope?.learner || meta.learner || 'see run.json'}.\n` +
      `Read every src/*.md (the only fact base) and studio/cases.json (${cases.length} lessons).\n` +
      '1. Copy DESIGN.template.md to DESIGN.md and fill every section from the material: the question framework (3 to 10, in the source\'s own words, each cited to cases), questionHints, what "stop" means here, the ladder, the lesson map (device, error-inducing mechanic, 3 to 7 actor chain, framework questions, one signature simulation per lesson, varied devices), the exhibit inventory and the three learner personas.\n' +
      '2. Write course.json from examples/config.template.json: every key rewritten for this course (questions, questionHints, parts, t, ring, qrefTitle/qrefButton naming the right number of questions, cpMark), "order", "sources" for checkpoints and the closing, and "fonts" from examples/course.wcss.json. Use a short unique config.id.\n' +
      '3. Rewrite the personas in eval/LX.md for this audience.\n' +
      `4. Write the same decisions as studio/design.json.\n${SHAPE}\n` +
      '5. Run python3 tools/config_check.py until it prints "config OK" and review every copied-phrase warning.' + changes
  });
  let check = await runEval('config', { course: run.dir });
  for (let k = 0; !check.ok && k < 2 && r.session !== undefined; k++) {
    await runAgent(run, { stage: 'design', role: 'design', label: `design-config-${k + 1}`, resume: r.session, prompt: `tools/config_check.py still reports:\n${check.errors.join('\n')}\nFix course.json until it prints "config OK".` });
    check = await runEval('config', { course: run.dir });
  }
  run.writeJSON('results/config.json', { by: 'automated', ...check });
  const d = run.readJSON('design.json');
  const problems = [];
  if (!fs.existsSync(run.p('DESIGN.md'))) problems.push('DESIGN.md missing');
  if (!d?.lessons?.length) problems.push('studio/design.json has no lesson map');
  if (!check.ok) problems.push(`config_check: ${check.errors.join('; ')}`);
  run.log('design.checked', { stage: 'design', configOk: check.ok, errors: check.errors?.length || 0, warnings: check.warnings?.length || 0, lessons: d?.lessons?.length || 0 });
  if (problems.length) return { status: 'blocked', detail: problems.join('; ') };
  return { status: 'done', detail: `${d.lessons.length} lessons, ${d.framework?.length || 0} questions; config OK` };
}

/** Write the author's gate-1 edits back into DESIGN.md's lesson map table. */
export function syncDesignTable(run) {
  const d = run.readJSON('design.json'); const md = run.readCourse('DESIGN.md');
  if (!d || !md) return false;
  const rows = d.lessons.map(l => `| ${l.id} | ${l.case || ''}${l.concept ? ' · ' + l.concept : ''} | ${l.device || ''} | ${l.mechanic || ''}${l.signature ? '; signature `' + l.signature + '`' : ''} | ${(l.chain || []).map(c => c.short + (c.control ? '*' : '')).join(' → ')} | ${(l.questions || []).join(',')} |`);
  const table = ['| id | case · concept | device | the error the learner commits | chain (CONTROL links*) | Qs |', '|---|---|---|---|---|---|', ...rows].join('\n');
  const re = /(## 5\. Lesson map\s*\n)([\s\S]*?)(\n\|[^\n]*\|\s*\n\|[-| ]+\|\s*\n(?:\|[^\n]*\|\s*\n?)*)/;
  const next = re.test(md) ? md.replace(re, (m, h, pre) => `${h}${pre}\n${table}\n`) : md + `\n\n## 5. Lesson map (author edits at sign-off)\n${table}\n`;
  fs.writeFileSync(run.p('DESIGN.md'), next);
  return true;
}

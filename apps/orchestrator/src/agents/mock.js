// Mock agents: replay the kit's own CISSP pilot (examples/cissp) so the whole pipeline, the real evals
// and the UI can be exercised without an API key. Every mock score is labelled "mock" in the results
// and on screen; it measures nothing. Real runs use the Agent SDK (STUDIO_AGENTS=sdk).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { FIXTURES } from '../config.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const EX = run => run.p('examples/cissp');

function rng(seed) {
  let h = 2166136261;
  for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
}
const score = (r, base, spread = 0.9) => Math.max(1, Math.min(5, Math.round(base + (r() - 0.5) * 2 * spread)));

function stepsOf(run, id) {
  try {
    const out = execFileSync('node', [run.p('eval/dump.js'), run.p('lessons', id + '.js')], { encoding: 'utf8' });
    return Object.values(JSON.parse(out))[0]?.steps?.length || 8;
  } catch { return 8; }
}

async function busy(run, o, tools) {
  for (const [tool, what] of tools) {
    await sleep(250 + Math.random() * 450);
    run.log('agent.tool', { stage: o.stage, label: o.label, tool, what });
  }
}

const json = (f, d) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(d, null, 1)); };

export async function mockAgent(run, o) {
  const design = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'cissp/design.json'), 'utf8'));
  switch (o.task || o.role) {
    case 'plan': {
      await busy(run, o, [['Read', 'studio/source.md'], ['Grep', 'Slide'], ['WebSearch', 'Knight Capital SEC order 2013']]);
      const cases = design.lessons.map(l => ({ id: l.id, kind: l.kind, concept: l.concept, incident: l.case, citation: l.citation, framing: l.title }));
      return { ok: true, text: 'Mock plan: the CISSP pilot from the kit examples.\n```json\n' + JSON.stringify({ cases }) + '\n```', cost: 0 };
    }
    case 'research': {
      await busy(run, o, [['WebSearch', 'primary sources'], ['WebFetch', 'sec.gov'], ['Write', 'src/…']]);
      for (const id of o.ids || []) {
        const s = path.join(EX(run), 'src', id + '.md');
        if (fs.existsSync(s)) fs.copyFileSync(s, run.p('src', id + '.md'));
      }
      return { ok: true, text: `Mock research: wrote src for ${(o.ids || []).join(', ')} from the kit examples.`, cost: 0, session: 'mock-' + o.label };
    }
    case 'design': {
      await busy(run, o, [['Read', 'DESIGN.template.md'], ['Read', 'src/ch15.md'], ['Write', 'DESIGN.md'], ['Write', 'course.json'], ['Bash', 'python3 tools/config_check.py']]);
      fs.copyFileSync(path.join(EX(run), 'DESIGN.md'), run.p('DESIGN.md'));
      fs.copyFileSync(path.join(EX(run), 'course.json'), run.p('course.json'));
      const prev = run.readJSON('design.json');
      json(path.join(run.studio, 'design.json'), prev && o.keepEdits ? prev : design);
      return { ok: true, text: 'Mock design: DESIGN.md and course.json from examples/cissp; lesson map in studio/design.json.', cost: 0 };
    }
    case 'exemplar':
    case 'author': {
      for (const id of o.ids || []) {
        await busy(run, o, [['Read', `src/${id}.md`], ['Write', `lessons/${id}.js`], ['Bash', `python3 eval/static_eval.py ${id}`]]);
        const s = path.join(EX(run), 'lessons', id + '.js');
        if (fs.existsSync(s) && !fs.existsSync(run.p('lessons', id + '.js'))) fs.copyFileSync(s, run.p('lessons', id + '.js'));
      }
      return { ok: true, text: `Mock author: ${(o.ids || []).join(', ')} copied from the kit examples.\n` + '```json\n{"engine_needs":[]}\n```', cost: 0 };
    }
    case 'review': {
      await busy(run, o, [['Read', 'eval/RUBRIC.md'], ['Read', 'src/…'], ['Edit', 'lessons/…'], ['Bash', 'python3 eval/static_eval.py']]);
      const out = {};
      for (const id of o.ids || []) {
        const r = rng('review' + id);
        const before = Array.from({ length: 8 }, () => score(r, 4.1, 0.9));
        const after = before.map(v => Math.min(5, v + (v < 5 && r() > 0.45 ? 1 : 0)));
        out[id] = { before, after, invented_claims_fixed: Math.floor(r() * 3), fixes: ['mock: no edit made'] };
      }
      json(run.p('eval/results', `review-${o.label}.json`), out);
      return { ok: true, text: 'Mock review written.', cost: 0 };
    }
    case 'taste':
    case 'panel': {
      await busy(run, o, [['Read', 'eval/TASTE.md'], ['Read', 'eval/taste/…/phone-dark-step00.png'], ['Read', 'engine/engine.css']]);
      const out = {};
      for (const id of o.ids || []) {
        const r = rng(o.role + id);
        const scores = Array.from({ length: 10 }, () => score(r, o.role === 'panel' ? 4.1 : 3.95, 0.8));
        out[id] = o.role === 'panel'
          ? { scores, weakest: 'mock: none named' }
          : { scores, weakest: 'mock: exhibit step', work_order: 'mock: none applied', applied: false };
      }
      if (o.role === 'taste') out.engine = [];
      json(run.p('eval/results', o.role === 'panel' ? `taste-final-${o.label}.json` : `critic-${o.label}.json`), out);
      return { ok: true, text: 'Mock design scores written.', cost: 0 };
    }
    case 'learner': {
      await busy(run, o, [['Read', 'eval/LX.md'], ['Read', 'eval/transcripts/…'], ['Read', 'eval/taste/lx/…/phone-dark-step01.png']]);
      const out = {};
      const lift = { 1: 0, 2: 0.42, 3: 0.46 }[o.round || 1] ?? 0.46;
      for (const id of o.ids || []) {
        const r = rng(`lx${o.persona}${id}`);
        const n = stepsOf(run, id);
        const steps = Array.from({ length: n }, (_, k) => {
          const mot = score(r, 3.5 + lift, 1.3);
          return { step: k, understood: r() > 0.18 - lift / 3 ? 2 : 1, friction: r() > 0.8 - lift / 2 ? 'mock: a prompt needed a re-read' : 'none', motivation: mot, quit: (o.round || 1) === 1 && mot <= 2 && r() > 0.6, picked: 'A' };
        });
        out[id] = {
          steps, scores: Array.from({ length: 7 }, () => score(r, 3.55 + lift, 0.75)),
          explain_back: { core: 'mock', control: 'mock', question: 'mock', work: 'mock' },
          confusion: 'mock: none recorded', dip: 'mock: none recorded', fix: 'mock: none recorded'
        };
      }
      json(run.p('eval/results', o.dir || '', `lx-${o.persona}-${o.chunk || 1}.json`), out);
      return { ok: true, text: 'Mock learner log written.', cost: 0 };
    }
    case 'fixer': {
      await busy(run, o, [['Read', 'eval/results/lx-…'], ['Edit', 'lessons/…'], ['Bash', 'python3 eval/e2e.py']]);
      return { ok: true, text: 'Mock fixer: no edits.', cost: 0 };
    }
    case 'factcheck': {
      await busy(run, o, [['Read', 'eval/results/diffs/…'], ['Read', 'src/…']]);
      const out = {};
      for (const id of o.ids || []) {
        const f = run.p('eval/results/diffs', id + '.added.txt');
        const n = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).length : 0;
        out[id] = { checked_lines: n, fixed: [], unresolved: [] };
      }
      json(run.p('eval/results', `factcheck-${o.label}.json`), out);
      return { ok: true, text: 'Mock fact re-check written.', cost: 0 };
    }
    case 'quotes': {
      await busy(run, o, [['Read', 'studio/source.md'], ['Edit', 'src/…']]);
      return { ok: true, text: 'Mock: FROM THE COURSE DECK sections already present in the kit examples.', cost: 0 };
    }
    default:
      return { ok: true, text: `mock ${o.role}: nothing to do`, cost: 0 };
  }
}

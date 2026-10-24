// patterns.select(step, lessonDesign, personas) -> up to two {n, score, reason}
//
// Rules (PRD, pattern-library integration):
//  - eligible only on a step marked imagined:true (or an imagined block) that does NOT carry the
//    reveal, the stop chain, the toolkit answer, a real number or a quotation;
//  - never replaces the signature simulation DESIGN.md assigns the lesson;
//  - pattern course matches the course domain or is "mixed"; audience matches the personas;
//  - step purpose matches the pattern's theme phase: drills -> yard/mirror, plan steps -> briefing,
//    compare steps -> casebook, checkpoint practice -> casebook/mirror/yard;
//  - a pattern never appears twice in a course.
//
// Ranking: Pattern Studio's similarity formula is not vendored in this repo yet, so `similarity()` is
// a stand-in with the same inputs (the pattern's learns line, mechanic and topics against the step's
// intent): TF-IDF cosine on content words, plus gesture and phase fit. Swap the function body when the
// formula is vendored; nothing else depends on its internals.
import fs from 'node:fs';
import path from 'node:path';
import { PATTERNS } from '../config.js';
import { plain } from '../lessons.js';

export function catalogue() {
  const c = JSON.parse(fs.readFileSync(path.join(PATTERNS, 'catalogue.json'), 'utf8'));
  return { ...c, patterns: c.patterns.filter(p => fs.existsSync(path.join(PATTERNS, p.page))) };
}

const STOP = new Set('a an the and or but of to in on at for with by from as is are was were be been it its this that these those you your we our they their he she his her them i me my not no do does did can could would should will may might must have has had there here what which who whom when where why how all any each every some such than then so if into out about over under up down more most less least very just also only one two three'.split(' '));
const words = s => plain(s).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(' ').filter(w => w.length > 2 && !STOP.has(w)).map(w => w.replace(/(ing|ed|es|s)$/, ''));

const GESTURE_OF_BLOCK = { choice: 'tap-choose', tapfind: 'tap-choose', toolkit: 'tap-choose', slider: 'slider', sort: 'drag-sort', order: 'drag-sort', runaway: 'watch-and-intervene', vigil: 'watch-and-intervene', fill: 'type', reflect: 'type', cards: 'reveal', rate: 'slider' };
const RECORD_BLOCKS = new Set(['stop', 'toolkit', 'quote', 'stat', 'ledger', 'waffle', 'bars']);
const NUMBER = /\b\d[\d,.]*\b/;

/** What the step is for, from its words and its lesson. */
export function purpose(step, lesson) {
  const t = plain([step.eyebrow, step.title, step.lede].join(' ')).toLowerCase();
  if (lesson.kind === 'checkpoint' || /exam|scenario|checkpoint/.test(t)) return 'checkpoint';
  if (/compare|which of|spot|odd one/.test(t)) return 'compare';
  if (/plan|before you|brief|prepare/.test(t)) return 'plan';
  if (/drill|again|practi[cs]e|reflex/.test(t)) return 'drill';
  return 'transfer';
}
const PHASES = { drill: ['yard', 'mirror'], plan: ['briefing'], compare: ['casebook'], checkpoint: ['casebook', 'mirror', 'yard'], transfer: ['briefing', 'mirror', 'yard'] };

/** Steps of a lesson where a pattern may stand in for a kit block. */
export function eligibleSlots(lesson, design) {
  const ld = (design?.lessons || []).find(l => l.id === lesson.id) || {};
  const slots = [];
  (lesson.steps || []).forEach((st, si) => {
    const types = (st.blocks || []).map(b => b.type);
    if (types.some(t => RECORD_BLOCKS.has(t))) return;
    st.blocks.forEach((b, bi) => {
      const imagined = st.imagined || b.imagined;
      if (!imagined || !GESTURE_OF_BLOCK[b.type] || b.type === 'reflect') return;
      if (b.type === ld.signature && !lesson.steps.some((s2, k) => k !== si && s2.blocks?.some(x => x.type === ld.signature))) return; // the only signature sim
      // a step that carries a real (non-imagined) quotation or figure stays a kit block
      const text = JSON.stringify(st);
      if (!st.imagined && (NUMBER.test(plain(b.prompt)) || /[“"][^”"]{8,}[”"]/.test(text))) return;
      slots.push({ step: si, block: bi, type: b.type, id: b.id || null, purpose: purpose(st, lesson), intent: intentText(st, b) });
    });
  });
  return slots;
}

function intentText(st, b) {
  const opts = (b.options || []).map(o => o.text + ' ' + (o.fb || '')).join(' ');
  return plain([st.eyebrow, st.title, st.lede, b.prompt, b.fb, opts, (b.items || []).map(i => i.text || i).join(' ')].join(' '));
}

function tfidf(docs) {
  const df = new Map();
  docs.forEach(d => new Set(d).forEach(w => df.set(w, (df.get(w) || 0) + 1)));
  return docs.map(d => {
    const tf = new Map(); d.forEach(w => tf.set(w, (tf.get(w) || 0) + 1));
    const v = new Map(); for (const [w, c] of tf) v.set(w, c * Math.log(1 + docs.length / (df.get(w) || 1)));
    return v;
  });
}
function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (const [w, x] of a) { na += x * x; if (b.has(w)) dot += x * b.get(w); }
  for (const [, y] of b) nb += y * y;
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

export function similarity(slot, p, vecs) {
  const text = cosine(vecs.slot, vecs.pattern);
  const gesture = GESTURE_OF_BLOCK[slot.type] === p.gesture ? 1 : 0;
  const phase = (PHASES[slot.purpose] || []).includes(p.theme) ? 1 : 0;
  return { score: +(0.6 * text + 0.15 * gesture + 0.25 * phase).toFixed(3), text, gesture, phase };
}

/** select(step slot, lesson design, personas/audience, used patterns) -> up to two candidates */
export function select(slot, ctx) {
  const cat = catalogue().patterns;
  const domain = ctx.domain || 'mixed';
  const audience = new Set(ctx.audience || ['everyone']);
  const pool = cat.filter(p => (p.course === 'mixed' || p.course === domain || domain === 'mixed') && audience.has(p.audience) && !ctx.used?.has(p.n));
  if (!pool.length) return [];
  const docs = [words(slot.intent), ...pool.map(p => words([p.learns, p.mechanic, p.name, (p.topics || []).join(' ')].join(' ')))];
  const vec = tfidf(docs);
  return pool.map((p, k) => {
    const s = similarity(slot, p, { slot: vec[0], pattern: vec[k + 1] });
    const why = [];
    if (s.phase) why.push(`${p.theme} fits a ${slot.purpose} step`);
    if (s.gesture) why.push(`same gesture as the ${slot.type} it replaces (${p.gesture})`);
    else why.push(`${p.gesture} instead of a ${slot.type}`);
    if (s.text > 0.05) why.push(`learns line overlaps the step's intent (${Math.round(s.text * 100)}%)`);
    return { n: p.n, name: p.name, score: s.score, reason: why.join('; '), learns: p.learns, gesture: p.gesture, theme: p.theme };
  }).sort((a, b) => b.score - a.score).slice(0, 2);
}

/** Proposals for a whole course. Keeps earlier decisions; never proposes a pattern used elsewhere. */
export function proposeAll(lessons, design, prev = {}) {
  const used = new Set(Object.values(prev.slots || {}).filter(s => s.decision === 'accepted').map(s => s.accepted));
  const domain = design?.domain || 'mixed';
  const audience = design?.audience || ['everyone'];
  const slots = { ...(prev.slots || {}) };
  for (const [id, L] of Object.entries(lessons)) {
    for (const slot of eligibleSlots(L, design)) {
      const key = `${id}:${slot.step}`;
      if (slots[key]?.decision === 'accepted') continue;
      const candidates = select(slot, { domain, audience, used });
      if (!candidates.length) continue;
      slots[key] = { lesson: id, ...slot, candidates, decision: slots[key]?.decision || 'pending', accepted: null };
    }
  }
  return { slots, catalogue: catalogue().version };
}

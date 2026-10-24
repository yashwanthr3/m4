// patterns.embed(n, palette) -> the iframe source and the adapter message, and the decisions that
// put a pattern into a lesson (accept) or take it out again (keep the kit block).
import fs from 'node:fs';
import path from 'node:path';
import { PATTERNS } from '../config.js';
import { derive } from '../../../../vendor/patterns/themes.mjs';
import { readLesson, writeLesson } from '../lessons.js';
import { catalogue } from './select.js';

export const FRAME_CSP = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:";

export function pagePath(n) {
  const p = catalogue().patterns.find(x => x.n === Number(n));
  return p ? path.join(PATTERNS, p.page) : null;
}

export function embed(n, palette = {}, theme = 'light') {
  const f = pagePath(n);
  if (!f) return null;
  const html = fs.readFileSync(f, 'utf8').replace(/<link[^>]+fonts\.googleapis[^>]*>/gi, '');
  return {
    srcdoc: `<meta http-equiv="Content-Security-Policy" content="${FRAME_CSP}">` + html,
    sandbox: 'allow-scripts',
    message: { type: 'trust-theme', vars: derive(palette), theme, only: Number(n) }
  };
}

/** Accept candidate n for slot: copy the page into the course and replace the kit block. */
export function accept(run, slot, n) {
  const L = readLesson(run, slot.lesson);
  if (!L) throw new Error(`lesson ${slot.lesson} not found`);
  const st = L.steps[slot.step];
  const original = slot.original || st.blocks[slot.block];
  const p = catalogue().patterns.find(x => x.n === Number(n));
  fs.mkdirSync(run.p('patterns'), { recursive: true });
  fs.copyFileSync(path.join(PATTERNS, p.page), run.p('patterns', `${p.n}.html`));
  st.blocks[slot.block] = {
    type: 'pattern', id: `pat${p.n}`, n: p.n, imagined: true,
    prompt: original.prompt || 'Practise the move from the case.',
    fb: `You practised the move from the case: ${p.learns}`
  };
  writeLesson(run, slot.lesson, L);
  return { original, block: st.blocks[slot.block] };
}

/** Put the original kit block back. */
export function restore(run, slot) {
  if (!slot.original) return;
  const L = readLesson(run, slot.lesson);
  const prev = L.steps[slot.step].blocks[slot.block];
  L.steps[slot.step].blocks[slot.block] = slot.original;
  writeLesson(run, slot.lesson, L);
  const still = JSON.stringify(Object.values(run.readJSON('patterns.json', { slots: {} }).slots).filter(s => s.decision === 'accepted' && s.accepted === prev?.n));
  if (prev?.n && still === '[]') fs.rmSync(run.p('patterns', `${prev.n}.html`), { force: true });
}

// Stage 1 · Source and scope. Convert every uploaded file to Markdown, classify the source as case-rich
// or concept-only, flag a mismatch with the stated domain, then ask the author ONE question set:
// learner, scope (pilot of 3 to 5, or the whole source) and, for concept-only sources, cited public
// incidents or labelled imagined scenes.
import fs from 'node:fs';
import path from 'node:path';
import { runEval } from '../evals.js';

export async function intake(run) {
  const dir = path.join(run.studio, 'source');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => !f.startsWith('.')) : [];
  if (!files.length) return { status: 'wait', waitingFor: 'source', detail: 'Add your source material to start.' };

  const out = path.join(run.studio, 'source.md');
  const conv = await runEval('convert', { extra: ['--in', files.length === 1 ? path.join(dir, files[0]) : dir, '--out', out] });
  if (!conv.ok) return { status: 'blocked', detail: `Could not convert the source: ${conv.error}` };
  const meta = run.meta();
  const cls = await runEval('classify', { extra: ['--in', out, '--domain', meta.domain || ''] });
  run.writeJSON('classify.json', { ...cls, by: 'automated', files, format: conv.format, words: conv.words });
  run.log('intake.classified', { stage: 'intake', kind: cls.kind, confidence: cls.confidence, domain: cls.domain, stated: cls.stated, mismatch: cls.mismatch, words: conv.words, files });

  const scope = meta.scope;
  if (!scope) {
    run.log('question.waiting', { stage: 'intake', kind: 'scope' });
    return { status: 'wait', waitingFor: 'scope', detail: 'Answer the scope questions.' };
  }
  if (scope.useFile === false) return { status: 'wait', waitingFor: 'source', detail: 'Waiting for the right source file.' };
  return { status: 'done', detail: `${cls.kind}, ${conv.words} words, ${scope.size === 'pilot' ? `pilot of ${scope.pilotCount}` : 'whole source'}` };
}

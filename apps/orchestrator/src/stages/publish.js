// Stage 12 · Publish (gate 3). Before the gate: a fresh score-only design panel, build.py, report.md and
// the build note. The gate is refused while any lesson fails the automated suite or any invented claim
// is unresolved. After approval: publish (optional command), source tar.gz, build note, a git tag.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { runAgent } from '../agents/index.js';
import { runEval } from '../evals.js';
import { settings } from '../config.js';
import { taste as aggTaste } from '../scores.js';
import { chunk, pool } from './common.js';
import { buildReport } from '../report.js';

export function hardBlocks(run) {
  const blocks = [];
  const suite = run.readJSON('results/suite.json', { lessons: {} });
  const failing = run.lessonIds().filter(id => !suite.lessons[id]?.pass);
  if (failing.length) blocks.push(`Automated suite: ${failing.join(', ')} not passing`);
  const dir = run.studio + '/results';
  let unresolved = 0;
  if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir).filter(f => f.startsWith('factcheck-'))) {
    try { unresolved += JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).unresolved || 0; } catch { /* skip */ }
  }
  if (unresolved) blocks.push(`Fact re-check: ${unresolved} unresolved invented claims`);
  const pat = run.readJSON('results/patterns.json', { ok: true });
  if (pat.ok === false) blocks.push('Pattern contract: an embedded pattern fails its autoplay runs');
  return blocks;
}

export async function prepare(run) {
  const ids = run.lessonIds();
  await runEval('capture', { course: run.dir, ids, label: 'final' });
  await pool(settings.concurrency, chunk(ids, 9).map((part, k) => () => runAgent(run, {
    stage: 'publish', role: 'panel', label: `panel-${k + 1}`, ids: part, briefs: ['briefs/TASTE_CRITIC_BRIEF.md'],
    prompt: `Final score-only panel. You are a fresh critic. Edit NOTHING. Lessons: ${part.join(', ')}. Screens: eval/taste/final/<id>/. Write eval/results/taste-final-panel-${k + 1}.json as {"<id>": {"scores":[10 ints], "weakest":"..."}}.`
  })));
  const panel = aggTaste(run.p('eval/results'), 'taste-final-');
  run.writeJSON('results/panel.json', panel);
  run.log('round.scored', { stage: 'publish', kind: 'panel', by: panel.by, mean: panel.mean, lessons: Object.keys(panel.lessons).length, mode: settings.agents });
  const b = await runEval('build', { course: run.dir });
  const report = buildReport(run);
  fs.mkdirSync(path.join(run.studio, 'publish'), { recursive: true });
  fs.writeFileSync(path.join(run.studio, 'report.md'), report.report);
  fs.writeFileSync(path.join(run.studio, 'build-note.md'), report.note);
  const blocks = hardBlocks(run);
  run.writeJSON('results/publish.json', { built: b.ok, bytes: b.bytes, blocks, prepared: new Date().toISOString() });
  run.log('publish.prepared', { stage: 'publish', built: b.ok, bytes: b.bytes, blocks });
  return { blocks, built: b.ok };
}

export async function publish(run) {
  const meta = run.meta();
  const out = path.join(run.studio, 'publish');
  fs.mkdirSync(out, { recursive: true });
  fs.copyFileSync(run.p('dist/index.html'), path.join(out, 'index.html'));
  const tar = path.join(out, `${run.id}-source.tar.gz`);
  execFileSync('tar', ['-czf', tar, '--exclude=./.git', '--exclude=./eval/taste', '--exclude=./eval/shots', '--exclude=./eval/patterns', '--exclude=./studio/publish', '--exclude=./dist', '--exclude=__pycache__', '-C', run.dir, '.']);
  fs.copyFileSync(path.join(run.studio, 'build-note.md'), path.join(out, 'build-note.md'));
  let url = meta.artifactUrl || null, how = 'ready';
  if (settings.publishCommand) {
    try {
      const res = execSync(settings.publishCommand, { cwd: run.dir, encoding: 'utf8', env: { ...process.env, DIST: path.join(out, 'index.html'), REPORT: path.join(run.studio, 'report.md'), ARTIFACT_URL: url || '' } });
      url = (res.match(/https:\/\/claude\.ai\/\S+/) || [url])[0]; how = 'command';
    } catch (e) { run.log('publish.error', { stage: 'publish', error: String(e.message).slice(0, 400) }); }
  }
  if (url) run.setMeta({ artifactUrl: url });
  const commit = run.commit(`Published ${run.id}${url ? ' to ' + url : ''}`);
  try { execFileSync('git', ['tag', '-f', `published-${new Date().toISOString().slice(0, 10)}`], { cwd: run.dir }); } catch { /* ignore */ }
  run.log('run.published', { stage: 'publish', url, how, commit, tar: path.relative(run.dir, tar), dist: path.relative(run.dir, path.join(out, 'index.html')) });
  return { status: 'done', detail: url ? `published to ${url}` : 'built and packaged; ready to publish as an artifact' };
}

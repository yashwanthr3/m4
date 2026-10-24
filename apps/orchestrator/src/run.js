// A run is a course folder: the kit (patched), the course files, and studio/ (the run's own log).
// The folder is the state. events.jsonl is append-only; every gate approval is a git commit and
// every pre-edit snapshot is a git tag. Resume replays the log, never a database.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { KIT, PATCH, RUNS } from './config.js';

export const bus = new EventEmitter();
bus.setMaxListeners(100);

const KIT_ITEMS = ['engine', 'eval', 'tools', 'briefs', 'examples', 'build.py', 'AUTHORING.md', 'DESIGN.template.md', 'README.md', 'CHANGELOG.md'];

export function slug(s) {
  return String(s || 'course').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'course';
}

function git(dir, ...args) {
  return execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

export class Run {
  constructor(id) {
    this.id = id;
    this.dir = path.join(RUNS, id);
    this.studio = path.join(this.dir, 'studio');
  }

  static create({ title, domain, learner, author }) {
    fs.mkdirSync(RUNS, { recursive: true });
    let id = slug(title); let k = 2;
    while (fs.existsSync(path.join(RUNS, id))) id = `${slug(title)}-${k++}`;
    const run = new Run(id);
    fs.mkdirSync(run.studio, { recursive: true });
    for (const it of KIT_ITEMS) fs.cpSync(path.join(KIT, it), path.join(run.dir, it), { recursive: true });
    execFileSync('patch', ['-p1', '-s', '-i', PATCH], { cwd: run.dir });
    fs.chmodSync(path.join(run.dir, 'tools/suite.sh'), 0o755);
    for (const d of ['lessons', 'src', 'patterns', 'studio/source', 'studio/results']) fs.mkdirSync(path.join(run.dir, d), { recursive: true });
    fs.writeFileSync(path.join(run.dir, '.gitignore'), ['eval/shots/', 'eval/taste/', 'eval/patterns/', 'dist/', '__pycache__/', '*.pyc', 'studio/publish/', ''].join('\n'));
    run.writeJSON('run.json', { id, title, domain, learner: learner || '', author: author || '', created: new Date().toISOString(), kit: 'Trust Course Kit v2 + pattern-block.diff' });
    git(run.dir, 'init', '-q');
    git(run.dir, 'add', '-A');
    git(run.dir, '-c', 'user.name=Trust Course Studio', '-c', 'user.email=studio@localhost', 'commit', '-q', '-m', `Create run ${id} from the vendored kit`);
    run.log('run.created', { title, domain });
    return run;
  }

  static list() {
    if (!fs.existsSync(RUNS)) return [];
    return fs.readdirSync(RUNS).filter(d => !d.startsWith('.') && fs.existsSync(path.join(RUNS, d, 'studio/run.json'))).map(d => new Run(d));
  }

  exists() { return fs.existsSync(path.join(this.studio, 'run.json')); }
  p(...a) { return path.join(this.dir, ...a); }
  meta() { return this.readJSON('run.json', {}); }
  setMeta(patch) { this.writeJSON('run.json', { ...this.meta(), ...patch }); }

  readJSON(name, dflt = null) {
    const f = path.join(this.studio, name);
    try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return dflt; }
  }
  writeJSON(name, data) {
    const f = path.join(this.studio, name);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, JSON.stringify(data, null, 1) + '\n');
  }
  readCourse(name, dflt = null) {
    try { return fs.readFileSync(this.p(name), 'utf8'); } catch { return dflt; }
  }

  /** Append an event to the log and broadcast it. */
  log(type, data = {}) {
    const ev = { t: new Date().toISOString(), run: this.id, type, ...data };
    fs.appendFileSync(path.join(this.studio, 'events.jsonl'), JSON.stringify(ev) + '\n');
    bus.emit('event', ev);
    return ev;
  }

  events() {
    const f = path.join(this.studio, 'events.jsonl');
    if (!fs.existsSync(f)) return [];
    return fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  }

  commit(message) {
    try {
      git(this.dir, 'add', '-A');
      git(this.dir, '-c', 'user.name=Trust Course Studio', '-c', 'user.email=studio@localhost', 'commit', '-q', '--allow-empty', '-m', message);
      return git(this.dir, 'rev-parse', '--short', 'HEAD');
    } catch (e) { return null; }
  }

  /** Snapshot lessons before an edit round: a git tag plus a plain copy for tools/diff_added.py. */
  snapshot(name) {
    const dir = path.join(this.studio, 'snapshots', name);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    fs.cpSync(this.p('lessons'), path.join(dir, 'lessons'), { recursive: true });
    this.commit(`Snapshot before ${name}`);
    try { git(this.dir, 'tag', '-f', `snap-${name}`); } catch { /* tag exists */ }
    this.log('snapshot', { name, dir: path.relative(this.dir, dir) });
    return path.join(dir, 'lessons');
  }

  lessonIds() {
    const c = this.courseJSON();
    return c?.order || [];
  }
  courseJSON() {
    try { return JSON.parse(fs.readFileSync(this.p('course.json'), 'utf8')); } catch { return null; }
  }
}

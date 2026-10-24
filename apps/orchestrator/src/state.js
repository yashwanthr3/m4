// Everything the UI shows is derived here from the run's event log and result files.
import fs from 'node:fs';
import path from 'node:path';
import { settings } from './config.js';
import { STAGES } from './stages/index.js';

export function stageStatus(events) {
  const s = {};
  for (const e of events) {
    const id = e.stage;
    if (!id) continue;
    const cur = s[id] || (s[id] = { status: 'pending' });
    switch (e.type) {
      case 'stage.started': Object.assign(cur, { status: 'running', started: e.t, ended: null, detail: null }); break;
      case 'stage.done': Object.assign(cur, { status: 'done', ended: e.t, detail: e.detail }); break;
      case 'stage.blocked': Object.assign(cur, { status: 'blocked', ended: e.t, detail: e.detail }); break;
      case 'stage.failed': Object.assign(cur, { status: 'failed', ended: e.t, detail: e.detail }); break;
      case 'stage.waiting': Object.assign(cur, { status: 'waiting', detail: e.detail, waitingFor: e.waitingFor }); break;
      case 'stage.interrupted': Object.assign(cur, { status: 'interrupted', detail: 'The studio stopped while this stage ran. Resume re-runs only unfinished work.' }); break;
      case 'stage.reset': s[id] = { status: 'pending', detail: e.reason, notes: e.notes }; break;
      case 'gate.waiting': Object.assign(cur, { status: 'waiting', since: e.t }); break;
      case 'gate.approved': Object.assign(cur, { status: 'done', ended: e.t, detail: `Approved${e.by ? ' by ' + e.by : ''}` , commit: e.commit }); break;
      case 'gate.changes': Object.assign(cur, { status: 'changes', detail: e.notes }); break;
    }
  }
  return s;
}

export function humanTime(events) {
  const byGate = {};
  for (const e of events) if (e.type === 'human.time') byGate[e.gate] = (byGate[e.gate] || 0) + (e.seconds || 0);
  return { byGate, total: Object.values(byGate).reduce((a, b) => a + b, 0) };
}

function agents(events) {
  const a = {};
  for (const e of events) {
    if (e.type === 'agent.started') a[e.label + '@' + e.t] = { key: e.label + '@' + e.t, label: e.label, role: e.role, stage: e.stage, model: e.model, effort: e.effort, mode: e.mode, ids: e.ids, started: e.t, status: 'running', tools: [] };
    if (e.type === 'agent.tool') { const x = Object.values(a).reverse().find(v => v.label === e.label && v.status === 'running'); if (x) { x.tools.push({ tool: e.tool, what: e.what, t: e.t }); x.tools = x.tools.slice(-6); } }
    if (e.type === 'agent.done') { const x = Object.values(a).reverse().find(v => v.label === e.label && v.status === 'running'); if (x) Object.assign(x, { status: e.ok ? 'done' : 'failed', ended: e.t, cost: e.cost, seconds: e.seconds, reply: e.reply, stop: e.stop }); }
    if (e.type === 'stage.interrupted') for (const x of Object.values(a)) if (x.stage === e.stage && x.status === 'running') x.status = 'interrupted';
  }
  return Object.values(a);
}

function lessons(run, events) {
  const out = {};
  const design = run.readJSON('design.json', {});
  for (const l of design.lessons || []) out[l.id] = { id: l.id, title: l.title, kind: l.kind, part: l.part, device: l.device, signature: l.signature, status: 'planned' };
  for (const id of run.lessonIds()) out[id] ||= { id, status: 'planned' };
  for (const e of events) {
    if (!e.id || !out[e.id]) continue;
    if (e.type === 'src.written') out[e.id].src = true;
    if (e.type === 'agent.started' && e.role !== 'learner') { /* no-op */ }
    if (e.type === 'lesson.authored') Object.assign(out[e.id], { status: 'authored', by: e.by });
    if (e.type === 'lesson.failed') Object.assign(out[e.id], { status: 'failed', error: e.error });
    if (e.type === 'lesson.check') Object.assign(out[e.id], { status: e.pass ? 'passing' : 'failing', checks: e.checks, problems: e.problems, checkedAt: e.t });
  }
  for (const e of events) if (e.type === 'agent.started' && e.status !== 'done') for (const id of e.ids || []) if (out[id]) out[id].lastAgent = e.label;
  const running = agents(events).filter(a => a.status === 'running');
  for (const a of running) for (const id of a.ids || []) if (out[id]) out[id].busy = a.label;
  const lx = run.readJSON('results/lx.json', { rounds: [] });
  const last = lx.rounds[lx.rounds.length - 1];
  const review = run.readJSON('results/review.json', null);
  const panel = run.readJSON('results/panel.json', null);
  const lxa = run.readJSON('results/lx_auto.json', null);
  for (const id of Object.keys(out)) {
    if (last?.lessons?.[id]) out[id].lx = last.lessons[id].mean;
    if (review?.lessons?.[id]) out[id].teaching = review.lessons[id].mAfter;
    if (panel?.lessons?.[id]) out[id].panel = panel.lessons[id].mean;
    if (lxa?.lessons?.[id]) out[id].minutes = Math.round(lxa.lessons[id].est_min);
  }
  return Object.values(out);
}

function shots(run, label, id) {
  const d = run.p('eval/taste', label, id);
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(f => f.endsWith('.png')).sort().map(f => `eval/taste/${label}/${id}/${f}`);
}

export function snapshot(run, pipeline) {
  const events = run.events();
  const st = stageStatus(events);
  const meta = run.meta();
  const ids = run.lessonIds();
  const ex = run.readJSON('results/exemplar.json', null);
  return {
    id: run.id, meta, mode: settings.agents,
    running: !!pipeline?.running,
    stages: STAGES.map(s => ({ id: s.id, n: s.n, title: s.title, kind: s.kind, gate: s.gate || null, blurb: s.blurb, ...(st[s.id] || { status: 'pending' }) })),
    classify: run.readJSON('classify.json', null),
    cases: run.readJSON('cases.json', null),
    design: run.readJSON('design.json', null),
    designMd: run.readCourse('DESIGN.md'),
    config: run.readJSON('results/config.json', null),
    factbase: run.readJSON('results/factbase.json', null),
    exemplar: ex ? { ...ex, shots: ex.id ? shots(run, 'exemplar', ex.id) : [] } : null,
    lessons: lessons(run, events),
    order: ids,
    suite: run.readJSON('results/suite.json', null),
    patterns: run.readJSON('patterns.json', null),
    patternContract: run.readJSON('results/patterns.json', null),
    review: run.readJSON('results/review.json', null),
    taste: run.readJSON('results/taste.json', null),
    lx: run.readJSON('results/lx.json', null),
    lxAuto: run.readJSON('results/lx_auto.json', null),
    panel: run.readJSON('results/panel.json', null),
    facts: events.filter(e => e.type === 'fact.rechecked'),
    diffs: listDiffs(run),
    publish: run.readJSON('results/publish.json', null),
    published: events.filter(e => e.type === 'run.published').pop() || null,
    report: fs.existsSync(path.join(run.studio, 'report.md')) ? fs.readFileSync(path.join(run.studio, 'report.md'), 'utf8') : null,
    engineNeeds: run.readJSON('engine-needs.json', []),
    agents: agents(events).slice(-80),
    cost: events.filter(e => e.type === 'agent.done').reduce((s, e) => s + (e.cost || 0), 0),
    human: humanTime(events),
    gates: Object.fromEntries(events.filter(e => e.type.startsWith('gate.')).map(e => [e.gate, e])),
    commits: events.filter(e => e.type === 'gate.approved').map(e => ({ gate: e.gate, commit: e.commit, t: e.t })),
    log: events.filter(e => !['agent.tool', 'human.time'].includes(e.type)).slice(-120)
  };
}

function listDiffs(run) {
  const d = path.join(run.studio, 'results');
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(f => f.startsWith('diff-')).map(f => { try { return JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')); } catch { return null; } }).filter(Boolean);
}

export function summary(run, pipeline) {
  const events = run.events();
  const st = stageStatus(events);
  const meta = run.meta();
  const cur = STAGES.find(s => (st[s.id]?.status || 'pending') !== 'done');
  const done = STAGES.filter(s => st[s.id]?.status === 'done').length;
  return {
    id: run.id, title: meta.title, domain: meta.domain, created: meta.created,
    lessons: run.lessonIds().length, done, total: STAGES.length,
    current: cur ? { id: cur.id, title: cur.title, kind: cur.kind, status: st[cur.id]?.status || 'pending', detail: st[cur.id]?.detail || null } : null,
    published: events.some(e => e.type === 'run.published'), running: !!pipeline?.running,
    updated: events[events.length - 1]?.t || meta.created
  };
}

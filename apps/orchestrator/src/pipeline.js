// The runner. Walks the stages in order, skips what the log says is done, stops at a gate or a
// question, and resumes from the log after a crash (re-running only unfinished work).
import { STAGES, GATES } from './stages/index.js';
import { stageStatus } from './state.js';
import { syncDesignTable, design as designStage } from './stages/design.js';
import { exemplar as exemplarStage, proposePatterns } from './stages/lessons.js';
import { prepare, publish, hardBlocks } from './stages/publish.js';
import { automated, editRound, chunk, pool, srcFor } from './stages/common.js';
import { runAgent } from './agents/index.js';
import { settings } from './config.js';
import { accept, restore } from './patterns/embed.js';

const pipelines = new Map();
export function pipelineFor(run) {
  if (!pipelines.has(run.id)) pipelines.set(run.id, new Pipeline(run));
  return pipelines.get(run.id);
}

export class Pipeline {
  constructor(run) { this.run = run; this.running = false; this.again = false; }

  status() { return stageStatus(this.run.events()); }

  async go() {
    if (this.running) { this.again = true; return; }
    this.running = true;
    this.run.log('pipeline.running', {});
    try {
      do { this.again = false; await this.walk(); } while (this.again);
    } catch (e) {
      this.run.log('pipeline.error', { error: String(e?.stack || e).slice(0, 1200) });
    } finally {
      this.running = false;
      this.run.log('pipeline.idle', {});
    }
  }

  async walk() {
    const run = this.run;
    for (const s of STAGES) {
      const st = this.status()[s.id] || { status: 'pending' };
      if (st.status === 'done') continue;
      if (s.kind === 'gate') {
        if (s.gate === 'publish' && !run.events().some(e => e.type === 'publish.prepared' && !this.stale(e))) {
          run.log('stage.started', { stage: s.id, detail: 'Final panel, build and report' });
          await prepare(run);
        }
        if (st.status !== 'waiting') run.log('gate.waiting', { stage: s.id, gate: s.gate });
        return;
      }
      if (st.status === 'blocked' || st.status === 'failed') return; // waits for Retry
      run.log('stage.started', { stage: s.id });
      let r;
      try { r = await s.run(run, { notes: st.notes }); }
      catch (e) { run.log('stage.failed', { stage: s.id, detail: String(e?.message || e) }); return; }
      if (r.status === 'done') { run.log('stage.done', { stage: s.id, detail: r.detail }); run.commit(`Stage ${s.n} done: ${s.title}`); continue; }
      if (r.status === 'wait') { run.log('stage.waiting', { stage: s.id, detail: r.detail, waitingFor: r.waitingFor }); return; }
      run.log(r.status === 'blocked' ? 'stage.blocked' : 'stage.failed', { stage: s.id, detail: r.detail });
      return;
    }
  }

  stale(prepared) {
    // a publish-prepared event is stale if any lesson changed afterwards
    return this.run.events().some(e => e.t > prepared.t && ['lesson.check', 'pattern.accepted', 'pattern.kept'].includes(e.type));
  }

  retry(stage) {
    this.run.log('stage.reset', { stage, reason: 'Retry requested' });
    this.go();
  }

  // ---------------------------------------------------------------- gates
  async decide(gate, decision, { notes, by } = {}) {
    const run = this.run; const stage = GATES[gate];
    const st = this.status()[stage];
    if (!st || st.status !== 'waiting') throw new Error(`The ${gate} gate is not waiting for a decision.`);
    if (decision === 'approve') {
      if (gate === 'design') syncDesignTable(run);
      if (gate === 'publish') {
        const blocks = hardBlocks(run);
        if (blocks.length) throw new Error('Publishing is blocked: ' + blocks.join('; '));
      }
      const label = { design: 'Gate 1 approved: design', exemplar: 'Gate 2 approved: exemplar', publish: 'Gate 3 approved: publish' }[gate];
      const commit = run.commit(`${label}${by ? ' (' + by + ')' : ''}${notes ? '\n\n' + notes : ''}`);
      run.log('gate.approved', { stage, gate, by: by || null, notes: notes || null, commit });
      if (gate === 'publish') { const r = await publish(run); run.log('stage.done', { stage, detail: r.detail }); }
      this.go();
      return;
    }
    // changes requested: re-run the stage before the gate with the author's notes
    run.log('gate.changes', { stage, gate, notes, by: by || null });
    if (gate === 'design') { run.log('stage.reset', { stage: 'design', reason: 'Changes requested', notes }); run.log('stage.reset', { stage }); }
    if (gate === 'exemplar') { run.log('stage.reset', { stage: 'exemplar', reason: 'Changes requested', notes }); run.log('stage.reset', { stage }); }
    if (gate === 'publish') {
      // edit by instruction: a fixer applies the note, the fact re-check runs on its diff, then the suite
      run.log('stage.reset', { stage });
      this.running = true;
      try {
        const ids = run.lessonIds();
        const { changed } = await editRound(run, `instruction-${Date.now().toString(36)}`, 'gate-publish', () => pool(settings.concurrency, chunk(ids, 9).map((part, k) => () => runAgent(run, {
          stage: 'gate-publish', role: 'fixer', label: `instruction-${k + 1}`, ids: part, briefs: ['briefs/AUTHOR_BRIEF.md'],
          prompt: `The author asked for this change before publishing:\n${notes}\nApply it to the lessons it concerns among ${part.join(', ')} (lesson data only). Facts only from ${part.map(id => srcFor(run, id).join('+')).join(', ')}.`
        }))));
        if (changed.length) await automated(run, changed, 'gate-publish');
      } finally { this.running = false; }
    }
    this.go();
  }

  answerScope(answers) {
    this.run.setMeta({ scope: answers });
    this.run.log('scope.answered', { stage: 'intake', ...answers });
    this.run.log('stage.reset', { stage: 'intake', reason: 'Scope answered' });
    this.go();
  }

  editDesign(patch) {
    const d = this.run.readJSON('design.json', {});
    if (patch.lesson) {
      const l = d.lessons.find(x => x.id === patch.lesson);
      if (!l) throw new Error('unknown lesson ' + patch.lesson);
      for (const k of ['device', 'case', 'mechanic', 'signature', 'title', 'citation']) if (k in patch.fields) l[k] = String(patch.fields[k]);
    }
    if (patch.framework) {
      const q = d.framework.find(x => x.n === patch.framework);
      for (const k of ['q', 'hint']) if (k in patch.fields) q[k] = String(patch.fields[k]);
    }
    this.run.writeJSON('design.json', d);
    this.run.log('design.edited', { stage: 'gate-design', ...patch });
  }

  // ---------------------------------------------------------------- pattern decisions
  async patternDecision(key, decision, n) {
    const run = this.run;
    const p = run.readJSON('patterns.json', { slots: {} });
    const slot = p.slots[key];
    if (!slot) throw new Error('unknown pattern slot ' + key);
    if (decision === 'accept') {
      const used = Object.entries(p.slots).some(([k, s]) => k !== key && s.decision === 'accepted' && s.accepted === Number(n));
      if (used) throw new Error(`Pattern ${n} is already used in this course. A pattern never appears twice.`);
      if (slot.decision === 'accepted') restore(run, slot);
      const { original } = accept(run, slot, Number(n));
      Object.assign(slot, { decision: 'accepted', accepted: Number(n), original });
      run.writeJSON('patterns.json', p);
      run.log('pattern.accepted', { stage: 'author', key, n: Number(n), lesson: slot.lesson, step: slot.step });
    } else {
      if (slot.decision === 'accepted') { slot.decision = 'kept'; run.writeJSON('patterns.json', p); restore(run, slot); }
      Object.assign(slot, { decision: 'kept', accepted: null });
      run.writeJSON('patterns.json', p);
      run.log('pattern.kept', { stage: 'author', key, lesson: slot.lesson, step: slot.step });
    }
    // a decision after the suite ran invalidates that lesson's checks: re-run them now
    const suiteDone = this.status()['suite']?.status === 'done';
    if (suiteDone && !this.running) {
      this.running = true;
      try { await automated(run, [slot.lesson], 'suite'); } finally { this.running = false; }
    }
    return p.slots[key];
  }

  reproposePatterns() { return proposePatterns(this.run); }
}

/** On start: any stage that was running when the process died is marked interrupted. */
export function recover(runs) {
  for (const run of runs) {
    const st = stageStatus(run.events());
    for (const [id, s] of Object.entries(st)) {
      if (s.status === 'running') run.log('stage.interrupted', { stage: id });
    }
  }
}

export { designStage, exemplarStage };

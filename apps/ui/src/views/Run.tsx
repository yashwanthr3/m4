import { useEffect, useMemo, useState } from 'react';
import { act, api, f2, go, Health, mins, Snapshot, Stage, usePresence, useRun } from '../api';
import { Chain } from '../components/Chain';
import { Rail } from '../components/Rail';
import { Board } from './run/Board';
import { DesignGate } from './run/DesignGate';
import { ExemplarGate } from './run/ExemplarGate';
import { Patterns } from './run/Patterns';
import { Scores } from './run/Scores';
import { Facts } from './run/Facts';
import { Publish } from './run/Publish';
import { Log } from './run/Log';

const TABS: { id: string; label: string; gate?: string }[] = [
  { id: 'board', label: 'Build board' },
  { id: 'design', label: 'Design', gate: 'design' },
  { id: 'exemplar', label: 'Exemplar', gate: 'exemplar' },
  { id: 'patterns', label: 'Patterns' },
  { id: 'scores', label: 'Scores' },
  { id: 'facts', label: 'Fact checks' },
  { id: 'publish', label: 'Publish', gate: 'publish' },
  { id: 'log', label: 'Agents & log' }
];

const STAGE_TAB: Record<string, string> = { 'gate-design': 'design', design: 'design', exemplar: 'exemplar', 'gate-exemplar': 'exemplar', review: 'scores', taste: 'scores', learners: 'scores', 'gate-publish': 'publish' };

export function RunView({ id, tab, health }: { id: string; tab?: string; health: Health | null }) {
  const { snap, error, reload } = useRun(id);
  const [stageSel, setStageSel] = useState<string | undefined>();
  const waitingGate = snap?.stages.find(s => s.kind === 'gate' && s.status === 'waiting')?.gate || null;
  const active = tab || (waitingGate ? { design: 'design', exemplar: 'exemplar', publish: 'publish' }[waitingGate]! : 'board');
  const viewingGate = TABS.find(t => t.id === active)?.gate;
  usePresence(id, viewingGate && viewingGate === waitingGate ? viewingGate : null);
  useEffect(() => { if (snap) document.title = `${snap.meta.title} · Trust Course Studio`; }, [snap?.meta.title]);

  if (error) return <div className="page"><div className="banner stop"><b>Could not open this course.</b>{error}</div></div>;
  if (!snap) return <div className="page"><div className="empty"><span className="spinner" style={{ display: 'inline-block', width: 22, height: 22 }} /></div></div>;

  const pick = (s: Stage) => { setStageSel(s.id); go(`run/${id}/${STAGE_TAB[s.id] || 'board'}`); };
  const lessonsPassing = snap.lessons.filter(l => l.status === 'passing').length;
  const lxLast = snap.lx?.rounds?.[snap.lx.rounds.length - 1];

  return (
    <div className="page">
      <div className="runhead">
        <div>
          <div className="crumbs"><a href="#/">Courses</a> / {snap.meta.domain} · {snap.id}</div>
          <h1>{snap.meta.title}</h1>
        </div>
        <div className="stats">
          <div className="stat"><b>{snap.order.length || '–'}</b><span>Lessons</span></div>
          <div className="stat"><b>{snap.order.length ? `${lessonsPassing}/${snap.order.length}` : '–'}</b><span>Passing checks</span></div>
          <div className="stat" title="Simulated learners, not real ones"><b>{f2(lxLast?.mean)}</b><span>Sim. learners</span></div>
          <div className="stat" title="Time you spent at the gates, counted while you were active on a gate screen"><b>{mins(snap.human.total)}</b><span>Your time</span></div>
          <div className="stat" title={snap.mode === 'mock' ? 'Mock agents make no model calls' : 'Model cost reported by the Agent SDK'}><b>${snap.cost.toFixed(2)}</b><span>Model cost</span></div>
        </div>
      </div>
      <Chain stages={snap.stages} selected={stageSel} onPick={pick} />
      {snap.mode === 'mock' && <div className="banner warn" style={{ marginBottom: 18 }}><span aria-hidden="true">▲</span><div><b>Mock agents</b>No API key is set, so agents replay the Trust Course Kit's CISSP pilot. The automated suites, gates, git history and publish package are real. Every judged score is a fixture and is labelled "mock".</div></div>}

      <div className="runbody">
        <nav className="tabs" aria-label="Course sections">
          {TABS.map(t => {
            const waits = t.gate && t.gate === waitingGate;
            const count = t.id === 'patterns' ? Object.values(snap.patterns?.slots || {}).filter((s: any) => s.decision === 'pending').length
              : t.id === 'facts' ? snap.facts.length : 0;
            return <a key={t.id} href={`#/run/${id}/${t.id}`} className={active === t.id ? 'on' : ''}>{t.label}{waits ? <span className="g" title="Waiting for you" /> : count ? <span className="n">{count}</span> : null}</a>;
          })}
          <div className="sep" />
          <RunControls snap={snap} reload={reload} />
        </nav>
        <section style={{ minWidth: 0 }}>
          {active === 'board' && <Board snap={snap} stageSel={stageSel} reload={reload} />}
          {active === 'design' && <DesignGate snap={snap} reload={reload} />}
          {active === 'exemplar' && <ExemplarGate snap={snap} reload={reload} health={health} />}
          {active === 'patterns' && <Patterns snap={snap} reload={reload} />}
          {active === 'scores' && <Scores snap={snap} />}
          {active === 'facts' && <Facts snap={snap} />}
          {active === 'publish' && <Publish snap={snap} reload={reload} health={health} />}
          {active === 'log' && <Log snap={snap} />}
        </section>
        <Rail snap={snap} />
      </div>
    </div>
  );
}

function RunControls({ snap, reload }: { snap: Snapshot; reload: () => void }) {
  const stuck = snap.stages.find(s => ['blocked', 'failed', 'interrupted'].includes(s.status));
  const idle = !snap.running && !stuck && !snap.stages.some(s => s.status === 'waiting') && snap.stages.some(s => s.status !== 'done');
  if (snap.running) return <span className="small muted" style={{ padding: '4px 12px', display: 'flex', gap: 8, alignItems: 'center' }}><span className="spinner" /> Working</span>;
  if (stuck) return <button className="btn small" onClick={() => act(api(`/runs/${snap.id}/retry/${stuck.id}`, { method: 'POST' }), `Retrying ${stuck.title}`).then(reload)}>{stuck.status === 'interrupted' ? 'Resume' : 'Retry'} {stuck.title}</button>;
  if (idle) return <button className="btn small" onClick={() => act(api(`/runs/${snap.id}/start`, { method: 'POST' }), 'Continuing').then(reload)}>Continue</button>;
  return null;
}

export function useStage(snap: Snapshot, id: string) { return useMemo(() => snap.stages.find(s => s.id === id)!, [snap, id]); }

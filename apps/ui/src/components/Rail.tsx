import { ago, Agent, Snapshot } from '../api';

const ROLE: Record<string, string> = { research: 'Research', design: 'Design', exemplar: 'Lead · exemplar', author: 'Author', review: 'Teaching reviewer', taste: 'Design critic', learner: 'Simulated learner', fixer: 'Fixer', factcheck: 'Fact re-check', panel: 'Score-only panel' };

export function AgentCard({ a }: { a: Agent }) {
  const model = a.mode === 'mock' ? 'mock' : a.model?.replace('claude-', '');
  return (
    <div className={'agent ' + a.status}>
      <div className="who">
        <b title={a.label}>{a.label}</b>
        {a.status === 'running' ? <span className="spinner" /> : a.status === 'done' ? <span className="chip pass">done</span> : <span className="chip fail">{a.stop || a.status}</span>}
      </div>
      <div className="small muted" style={{ marginTop: 3 }}>{ROLE[a.role] || a.role} · {model}{a.effort ? ' · ' + a.effort : ''}{a.ids?.length ? ' · ' + a.ids.join(', ') : ''}</div>
      {a.status === 'running' && a.tools.length > 0 && <div className="ticker">{a.tools.slice(-3).map((t, i) => <div key={i}><em>{t.tool}</em> {t.what}</div>)}</div>}
      {a.status !== 'running' && <div className="small muted" style={{ marginTop: 4 }}>{a.seconds != null ? `${a.seconds}s` : ''}{a.cost ? ` · $${a.cost.toFixed(2)}` : ''} · {ago(a.ended)}</div>}
    </div>
  );
}

export function Rail({ snap }: { snap: Snapshot }) {
  const running = snap.agents.filter(a => a.status === 'running');
  const recent = snap.agents.filter(a => a.status !== 'running').slice(-4).reverse();
  return (
    <aside className="rail" aria-label="Live activity">
      <div className="row between"><span className="sign ink">Live</span><span className="small muted">{running.length ? `${running.length} agent${running.length > 1 ? 's' : ''} working` : snap.running ? 'Running checks' : 'Idle'}</span></div>
      {running.map(a => <AgentCard key={a.key} a={a} />)}
      {!running.length && snap.running && <div className="agent running"><div className="who"><b>Eval worker</b><span className="spinner" /></div><div className="small muted" style={{ marginTop: 3 }}>Automated suites run in Python with the kit's own scripts. No model calls.</div></div>}
      {recent.length > 0 && <span className="sign" style={{ marginTop: 6 }}>Recently</span>}
      {recent.map(a => <AgentCard key={a.key} a={a} />)}
      {snap.engineNeeds.length > 0 && (
        <div className="panel" style={{ padding: 14 }}>
          <span className="sign">For the lead · engine needs</span>
          <ul className="small" style={{ paddingLeft: 18, margin: '8px 0 0' }}>{snap.engineNeeds.slice(0, 6).map((n: any, i: number) => <li key={i}>{n.need} <span className="muted">({n.by})</span></li>)}</ul>
          <p className="small muted" style={{ marginTop: 8, marginBottom: 0 }}>One hand on the engine: the studio never edits engine/. These go to the lead.</p>
        </div>
      )}
    </aside>
  );
}

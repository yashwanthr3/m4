import { useState } from 'react';
import { Snapshot } from '../../api';
import { AgentCard } from '../../components/Rail';

function describe(e: any) {
  const skip = new Set(['t', 'run', 'type', 'stage']);
  return Object.entries(e).filter(([k, v]) => !skip.has(k) && v != null && v !== '' && !(Array.isArray(v) && !v.length)).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v).slice(0, 160) : String(v).slice(0, 220)}`).join(' · ');
}

export function Log({ snap }: { snap: Snapshot }) {
  const [filter, setFilter] = useState('');
  const stages = [...new Set(snap.agents.map(a => a.stage))];
  const [stage, setStage] = useState<string>('');
  const agents = snap.agents.filter(a => !stage || a.stage === stage).slice().reverse();
  const log = snap.log.filter(e => !filter || e.type.includes(filter) || (e.stage || '').includes(filter)).slice().reverse();
  return (
    <div>
      <div className="panel">
        <div className="row between"><div><span className="sign">Agents · each one a fresh session</span><h3 style={{ marginTop: 4 }}>{snap.agents.length} agents this run</h3></div>
          <div className="seg"><button className={!stage ? 'on' : ''} onClick={() => setStage('')}>All</button>{stages.map(s => <button key={s} className={stage === s ? 'on' : ''} onClick={() => setStage(s)}>{s}</button>)}</div></div>
        <p className="small muted" style={{ marginTop: 8 }}>Prompts are the kit's briefs, read from the course folder at call time. Write permissions are enforced per role: no agent can write engine/, eval scripts, tools/ or build.py.</p>
        <div className="grid g3" style={{ marginTop: 12 }}>{agents.map(a => <div key={a.key}><AgentCard a={a} />{a.reply && <details className="more" style={{ marginTop: 4 }}><summary>Reply</summary><pre className="diff" style={{ marginTop: 6 }}>{a.reply}</pre></details>}</div>)}</div>
      </div>
      <div className="panel">
        <div className="row between"><div><span className="sign">studio/events.jsonl · the run state</span><h3 style={{ marginTop: 4 }}>Event log</h3></div><input type="text" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter: gate, lesson, fact…" style={{ maxWidth: 240 }} /></div>
        <p className="small muted" style={{ marginTop: 8 }}>Resume reads this log. Gate approvals: {snap.commits.map(c => `${c.gate} ${c.commit}`).join(', ') || 'none yet'}.</p>
        <div className="log" style={{ marginTop: 10 }}>{log.map((e, i) => <div key={i}><time>{new Date(e.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time><b>{e.type}</b><span>{e.stage ? `[${e.stage}] ` : ''}{describe(e)}</span></div>)}</div>
      </div>
    </div>
  );
}

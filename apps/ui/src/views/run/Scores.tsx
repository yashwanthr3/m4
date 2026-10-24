import { f2, Snapshot } from '../../api';
import { ScoreBars } from '../../components/bits';

const J = ['Faithful', 'Experiential', 'Sits with you', 'Feedback teaches', 'True to form', 'Clear voice', 'Transfer', 'Craft'];
const T = ['Ownable', 'Coherent grammar', 'Material fidelity', 'Restraint', 'Typography', 'Motion', 'Pacing & first frame', 'Both themes', 'Microcopy', 'Screenshot moment'];
const L = ['Clarity', 'Explains', 'Sticks', 'No friction', 'Motivating', 'Load', 'Pacing'];

function By({ by, mock }: { by: string; mock: boolean }) { return <span className="label-by">{by}{mock && by !== 'automated' ? ' · mock fixture' : ''}</span>; }

function Spark({ vals }: { vals: (number | null)[] }) {
  const w = 90, h = 26, pts = vals.map((v, i) => [vals.length === 1 ? w / 2 : (i / (vals.length - 1)) * (w - 8) + 4, v == null ? h / 2 : h - 3 - ((v - 3) / 2) * (h - 6)]);
  return <svg width={w} height={h} aria-hidden="true"><line x1="0" x2={w} y1={h - 3 - ((4 - 3) / 2) * (h - 6)} y2={h - 3 - ((4 - 3) / 2) * (h - 6)} stroke="var(--gate-deep)" strokeDasharray="2 3" />
    <polyline fill="none" stroke="var(--ink)" strokeWidth="2" points={pts.map(p => p.join(',')).join(' ')} />{pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="var(--ink)" />)}</svg>;
}

export function Scores({ snap }: { snap: Snapshot }) {
  const mock = snap.mode === 'mock';
  const rounds: any[] = snap.lx?.rounds || [];
  const first = rounds[0], last = rounds[rounds.length - 1];
  const rv = snap.review, tt = snap.taste, pn = snap.panel;
  const ids = snap.order;
  if (!rounds.length && !rv && !tt) return <div className="panel empty"><h3>No judged scores yet</h3><p>Teaching review, the taste round and the learner loop report here, before and after each round, per lesson and per dimension.</p></div>;

  return (
    <div>
      <div className="banner info" style={{ marginBottom: 18 }}><span>ⓘ</span><div><b>Measured, not asserted</b>Each score names what produced it: an automated check, a model panel or simulated learners. Simulated learners are agents playing personas, not real people. No judged score is rounded up to pass.</div></div>

      {rounds.length > 0 && <div className="panel">
        <div className="row between"><div><span className="sign">Learner loop · LX L1-L7</span><h3 style={{ marginTop: 4 }}>Simulated learners</h3></div><By by="simulated learners" mock={mock} /></div>
        <div className="grid g4" style={{ margin: '16px 0' }}>
          <div><span className="sign">Overall</span><div className="bignum">{f2(last.mean)}</div>{rounds.length > 1 && <span className={'delta ' + (last.mean >= first.mean ? 'up' : 'down')}>{last.mean >= first.mean ? '+' : ''}{(last.mean - first.mean).toFixed(2)} since round 1</span>}</div>
          <div><span className="sign">Steps fully understood</span><div className="bignum">{last.understood}<small>%</small></div>{rounds.length > 1 && <span className="delta">{first.understood}% in round 1</span>}</div>
          <div><span className="sign">Quit points</span><div className="bignum" style={{ color: last.quits ? 'var(--stop-ink)' : undefined }}>{last.quits}</div>{rounds.length > 1 && <span className="delta">{first.quits} in round 1</span>}</div>
          <div><span className="sign">Low-motivation steps</span><div className="bignum">{last.low}</div>{rounds.length > 1 && <span className="delta">{first.low} in round 1</span>}</div>
        </div>
        <div className="grid g2">
          <div><span className="sign">Per dimension · round 1 → round {last.n} · bar 4.0</span><div style={{ marginTop: 10 }}><ScoreBars names={L} before={rounds.length > 1 ? first.dims : undefined} after={last.dims} /></div></div>
          <div>
            <span className="sign">Rounds</span>
            <table className="ledger nums" style={{ marginTop: 6 }}><thead><tr><th>Round</th><th>Mean</th><th>Change</th><th>Fixed</th><th>Claims found</th></tr></thead><tbody>
              {rounds.map(r => <tr key={r.n}><td>{r.n}</td><td className="n">{f2(r.mean)}</td><td className="n">{r.delta == null ? '–' : (r.delta >= 0 ? '' : '') + r.delta.toFixed(2)}</td><td className="n">{r.fixed?.changed?.length ?? '–'}</td><td className="n">{r.fixed ? r.fixed.fact.fixed : '–'}</td></tr>)}
            </tbody></table>
            <p className="small" style={{ marginTop: 10 }}><b>Loop stopped:</b> {last.stopped || 'still running'}. The loop stops at a plateau (the mean moves less than 0.05), when no learner would quit and every lesson meets 4.0, or after three rounds, because each extra round adds fact risk.</p>
          </div>
        </div>
        <div className="divider" />
        <div className="tablewrap"><table className="board"><thead><tr><th>Lesson</th><th>Rounds</th>{L.map(d => <th key={d}>{d}</th>)}<th>Understood</th><th>Quits</th></tr></thead><tbody>
          {ids.map(id => { const l = last.lessons?.[id]; if (!l) return null; return (
            <tr key={id}><td className="lid">{id}</td><td><Spark vals={rounds.map(r => r.lessons?.[id]?.mean ?? null)} /></td>{l.dims.map((v: number, i: number) => <td key={i}><span className={'score ' + (v < 3.7 ? 'lo' : v < 4 ? 'mid' : '')}>{f2(v)}</span></td>)}<td className="num">{l.understood}%</td><td className="num">{l.quits.length}</td></tr>); })}
        </tbody></table></div>
      </div>}

      {rv && <div className="panel">
        <div className="row between"><div><span className="sign">Teaching review · RUBRIC J1-J8</span><h3 style={{ marginTop: 4 }}>Fresh reviewers, never the authors</h3></div><By by="model panel" mock={mock} /></div>
        <div className="grid g2" style={{ marginTop: 14 }}>
          <div><div className="row" style={{ gap: 28 }}><div><span className="sign">Before</span><div className="bignum">{f2(rv.before)}</div></div><div><span className="sign">After</span><div className="bignum">{f2(rv.after)}</div></div><div><span className="sign">At the bar</span><div className="bignum">{rv.atBar}<small>/{Object.keys(rv.lessons).length}</small></div></div></div>
            <p className="small muted" style={{ marginTop: 10 }}>Bar: every dimension 4 or more and a mean of 4.3 or more. {rv.claims} invented claims fixed by reviewers; {rv.fact?.fixed ?? 0} more by the fact re-check on their diff.</p></div>
          <ScoreBars names={J} before={rv.dimsBefore} after={rv.dimsAfter} bar={4} />
        </div>
      </div>}

      {(tt || pn) && <div className="panel">
        <div className="row between"><div><span className="sign">Design · TASTE T1-T10</span><h3 style={{ marginTop: 4 }}>One critic round, then a score-only panel</h3></div><By by="model panel" mock={mock} /></div>
        <div className="grid g2" style={{ marginTop: 14 }}>
          <div><div className="row" style={{ gap: 28 }}><div><span className="sign">Critic round</span><div className="bignum">{f2(tt?.mean)}</div></div><div><span className="sign">Final panel</span><div className="bignum">{f2(pn?.mean)}</div></div></div>
            <p className="small muted" style={{ marginTop: 10 }}>No bar: the final mean is reported as measured. A second critic round brought no gain in past builds, so the studio runs one.</p>
            {tt?.engine?.length > 0 && <><span className="sign">Engine problems for the lead</span><ul className="small">{tt.engine.map((e: string, i: number) => <li key={i}>{e}</li>)}</ul></>}</div>
          <ScoreBars names={T} before={pn ? tt?.dims : undefined} after={pn?.dims || tt?.dims || []} bar={4} />
        </div>
      </div>}

      {snap.lxAuto?.summary && <div className="panel">
        <div className="row between"><span className="sign">Reading load · lx_auto</span><By by="automated" mock={mock} /></div>
        <p className="mono small" style={{ marginTop: 10 }}>{snap.lxAuto.summary[0]}</p><p className="mono small muted">{snap.lxAuto.summary[1]}</p>
      </div>}
    </div>
  );
}

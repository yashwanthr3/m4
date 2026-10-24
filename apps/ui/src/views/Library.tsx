import { Fragment, useEffect, useState } from 'react';
import { useApi } from '../api';
import { PatternFrame } from './run/Patterns';

/** The pattern designer's view: the catalogue, and where the studio's courses use or skip each pattern. */
export function Library() {
  const { data } = useApi<any>('/catalogue');
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => { document.title = 'Pattern library · Trust Course Studio'; }, []);
  if (!data) return <div className="page"><span className="spinner" /></div>;
  const usage = data.usage || {};
  return (
    <div className="page">
      <span className="sign">For the pattern designer</span>
      <h1 style={{ margin: '10px 0 8px' }}>Pattern library</h1>
      <p className="muted" style={{ maxWidth: 680 }}>Which patterns the studio proposes, which authors accept, and which they turn down. A pattern that is often proposed and often kept as a kit block is a gap in the catalogue, seen as a course need rather than a guess.</p>
      {data.version?.startsWith('sample') && <div className="banner warn" style={{ margin: '14px 0' }}><span>▲</span><div><b>Sample catalogue · {data.patterns.length} patterns</b>{data.note}</div></div>}
      <div className="panel" style={{ marginTop: 18 }}>
        <div className="tablewrap"><table className="board">
          <thead><tr><th>#</th><th>Pattern</th><th>Phase</th><th>Gesture</th><th>Course</th><th>Proposed</th><th>Accepted</th><th>Kit block kept</th><th></th></tr></thead>
          <tbody>{data.patterns.map((p: any) => { const u = usage[p.n] || { proposed: 0, accepted: [], kept: 0 }; return (
            <Fragment key={p.n}>
              <tr className="lrow" onClick={() => setOpen(open === p.n ? null : p.n)}>
                <td className="lid">{p.n}</td><td><div className="ltitle">{p.name}</div><div className="ldev">{p.learns}</div></td>
                <td><span className="chip none">{p.theme}</span></td><td className="small">{p.gesture}</td><td className="small">{p.course}</td>
                <td className="num">{u.proposed}</td><td className="num">{u.accepted.length}</td><td className="num">{u.kept}</td>
                <td><button className="btn ghost small">{open === p.n ? 'Close' : 'Play'}</button></td>
              </tr>
              {open === p.n && <tr><td colSpan={9} style={{ background: 'var(--paper-2)' }}>
                <div className="grid g2"><PatternFrame n={p.n} /><div><span className="sign">Mechanic</span><p>{p.mechanic}</p><span className="sign">Used in</span>{u.accepted.length ? <ul className="small">{u.accepted.map((a: any, i: number) => <li key={i}><a href={`#/run/${a.run}/patterns`}>{a.title}</a> · {a.lesson} step {a.step}</li>)}</ul> : <p className="small muted">No course yet.</p>}</div></div>
              </td></tr>}
            </Fragment>); })}</tbody>
        </table></div>
      </div>
    </div>
  );
}

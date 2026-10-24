import { useEffect } from 'react';
import { ago, Health, RunSummary, useApi, useEvents } from '../api';
import { MiniBeads } from '../components/Chain';

export function Home({ health }: { health: Health | null }) {
  const { data: runs, reload } = useApi<RunSummary[]>('/runs');
  useEvents(e => { if (/^(stage|gate|run)\./.test(e.type)) reload(); });
  useEffect(() => { document.title = 'Courses · Trust Course Studio'; }, []);
  const waiting = (runs || []).filter(r => r.current?.status === 'waiting');

  return (
    <div className="page">
      <section className="hero">
        <div className="reveal">
          <span className="sign">Source in, course out</span>
          <h1 style={{ marginTop: 10 }}>Turn your source into a course people <em>do</em>, not read.</h1>
          <p className="lede">Bring a policy set, a standard, incident reports or a training deck. The studio derives the framework, writes and checks every lesson, and stops at three points where only you decide.</p>
          <div className="row" style={{ marginTop: 22 }}>
            <a className="btn accent" href="#/new">Start a course</a>
            {waiting.length > 0 && <a className="btn gate" href={`#/run/${waiting[0].id}`}>{waiting.length} gate{waiting.length > 1 ? 's' : ''} waiting for you</a>}
          </div>
        </div>
        <div className="gates reveal" aria-label="The three human gates">
          <div><span className="minigate">I</span><span><b>Design sign-off</b><br /><span className="small muted">You approve the framework and lesson map before any lesson is written.</span></span></div>
          <div><span className="minigate">II</span><span><b>Exemplar sign-off</b><br /><span className="small muted">You see the first lesson on a phone and a desktop. No author starts before you approve.</span></span></div>
          <div><span className="minigate">III</span><span><b>Publish</b><br /><span className="small muted">Blocked until every lesson passes every check and no invented claim is left.</span></span></div>
        </div>
      </section>

      <div className="row between" style={{ marginBottom: 16 }}>
        <h2>Courses</h2>
        {health?.mode === 'mock' && <span className="small muted">Mock agents: the pipeline and its checks are real; lessons and judged scores come from the kit's CISSP examples.</span>}
      </div>
      <div className="folders">
        {(runs || []).map((r, i) => (
          <a key={r.id} className="folder reveal" href={`#/run/${r.id}`} style={{ animationDelay: `${i * 40}ms` }}>
            <span className="tab">{r.domain || 'course'}{r.running && <span className="spinner" style={{ borderColor: 'var(--manila-ink)', borderRightColor: 'transparent' }} />}</span>
            <div className="sheet">
              {r.published && <span className="stamp pub">PUBLISHED</span>}
              <h3>{r.title}</h3>
              <span className="meta">{r.lessons ? `${r.lessons} lessons` : 'No lessons yet'} · {ago(r.updated)}</span>
              <MiniBeads done={r.done} total={r.total} />
              <div className="now">
                {r.current?.status === 'waiting' ? <span className="waitflag">{r.current.title}</span>
                  : r.current?.status === 'blocked' || r.current?.status === 'failed' ? <span className="chip fail">Blocked · {r.current.title}</span>
                    : r.current ? <span><b>Stage {r.done + 1}</b> · {r.current.title}</span> : <span>All twelve stages done</span>}
              </div>
            </div>
          </a>
        ))}
        <a className="folder new reveal" href="#/new">
          <span className="tab">new</span>
          <div className="sheet"><div><h3 style={{ color: 'var(--ink-2)' }}>+ New course</h3><span className="small">Drop in your source material</span></div></div>
        </a>
      </div>
    </div>
  );
}

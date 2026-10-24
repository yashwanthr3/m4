import { Fragment, useEffect, useState } from 'react';
import { act, api, ago, f2, socket, Snapshot, Stage, toast } from '../../api';
import { AgentCard } from '../../components/Rail';

const CHECKS: [string, string][] = [['static', 'Static'], ['e2ePhone', 'Phone'], ['e2eDesktop', 'Desktop'], ['taste', 'Taste'], ['overlap', 'Overlap']];

export function Board({ snap, stageSel, reload }: { snap: Snapshot; stageSel?: string; reload: () => void }) {
  const current = snap.stages.find(s => s.status !== 'done');
  const sel = snap.stages.find(s => s.id === stageSel);
  return (
    <div>
      <NowPanel snap={snap} stage={current} reload={reload} />
      {sel && sel.id !== current?.id && <StageDetail snap={snap} stage={sel} />}
      <LessonBoard snap={snap} />
    </div>
  );
}

function NowPanel({ snap, stage, reload }: { snap: Snapshot; stage?: Stage; reload: () => void }) {
  if (!stage) return <div className="banner ok"><span>✓</span><div><b>All twelve stages are done.</b>{snap.published?.url ? <>Published at <a href={snap.published.url}>{snap.published.url}</a>.</> : 'The course is built and packaged. See Publish.'}</div></div>;
  if (stage.id === 'intake' && stage.status === 'waiting' && stage.waitingFor === 'scope') return <ScopeQuestions snap={snap} reload={reload} />;
  if (stage.id === 'intake' && stage.status === 'waiting') return <AddSource snap={snap} reload={reload} />;
  if (stage.id === 'factbase' && stage.status === 'blocked') return <FactbaseBlock snap={snap} stage={stage} reload={reload} />;
  if (stage.kind === 'gate' && stage.status === 'waiting') {
    const tab = { design: 'design', exemplar: 'exemplar', publish: 'publish' }[stage.gate!];
    return (
      <div className="gatecard reveal" style={{ marginBottom: 22 }}>
        <div className="band hazard" />
        <div className="head"><span className="gnum">{['', 'I', 'II', 'III'][[4, 6, 12].indexOf(stage.n) + 1]}</span>
          <div><span className="sign">Waiting for you · {ago(stage.since)}</span><h2 style={{ marginTop: 4 }}>{stage.title}</h2><p className="muted" style={{ marginTop: 6 }}>{stage.blurb}</p></div></div>
        <div className="body"><a className="btn gate" href={`#/run/${snap.id}/${tab}`}>Open the {stage.title.toLowerCase()}</a></div>
      </div>
    );
  }
  return <StageDetail snap={snap} stage={stage} now />;
}

function StageDetail({ snap, stage, now }: { snap: Snapshot; stage: Stage; now?: boolean }) {
  const agents = snap.agents.filter(a => a.stage === stage.id);
  const tone = stage.status === 'blocked' || stage.status === 'failed' ? 'stop' : stage.status === 'interrupted' ? 'warn' : '';
  return (
    <div className="panel reveal" style={{ marginBottom: 22, borderColor: tone ? `var(--${tone === 'stop' ? 'stop' : 'warn'})` : undefined }}>
      <div className="row between">
        <span className="sign">{now ? 'Now' : 'Stage'} · {stage.n} of 12</span>
        <span className={'chip ' + ({ done: 'pass', running: 'run', blocked: 'fail', failed: 'fail', waiting: 'wait', interrupted: 'warn' } as any)[stage.status] || 'chip none'}>{stage.status}</span>
      </div>
      <h2 style={{ marginTop: 6 }}>{stage.title}</h2>
      <p className="muted" style={{ marginTop: 4 }}>{stage.blurb}</p>
      {stage.detail && <div className={`banner ${tone || 'info'}`} style={{ marginTop: 10 }}><div>{stage.detail}</div></div>}
      {stage.status === 'blocked' && stage.id === 'suite' && <p className="small" style={{ marginTop: 10 }}>The failing lessons and the exact check and step are listed in the board below. Fix attempts by an author agent already ran; Retry runs the suite again.</p>}
      {agents.length > 0 && <div className="grid g3" style={{ marginTop: 14 }}>{agents.slice(-6).map(a => <AgentCard key={a.key} a={a} />)}</div>}
      {stage.status === 'pending' && !snap.running && <p className="small muted" style={{ marginTop: 10 }}>Not started. The studio reaches it after the stages before it.</p>}
    </div>
  );
}

function AddSource({ snap, reload }: { snap: Snapshot; reload: () => void }) {
  const [busy, setBusy] = useState(false);
  async function up(list: FileList | null) {
    if (!list) return; setBusy(true);
    for (const f of Array.from(list)) await act(fetch(`/api/runs/${snap.id}/source?name=${encodeURIComponent(f.name)}`, { method: 'POST', body: f }));
    await act(api(`/runs/${snap.id}/retry/intake`, { method: 'POST' }), 'Source added'); setBusy(false); reload();
  }
  return (
    <div className="panel reveal" style={{ marginBottom: 22 }}>
      <span className="sign">Stage 1 · Source</span><h2 style={{ marginTop: 6 }}>Add the source material</h2>
      <p className="muted">{snap.stages[0].detail}</p>
      <label className="btn accent" style={{ marginTop: 8 }}>{busy ? 'Uploading…' : 'Choose files'}<input type="file" multiple hidden onChange={e => up(e.target.files)} /></label>
    </div>
  );
}

/** The one question set: learner, scope, and for concept-only sources, cited incidents or imagined scenes. */
function ScopeQuestions({ snap, reload }: { snap: Snapshot; reload: () => void }) {
  const c = snap.classify || {};
  const [learner, setLearner] = useState(snap.meta.learner || '');
  const [size, setSize] = useState<'pilot' | 'whole'>('pilot');
  const [count, setCount] = useState(3);
  const [incidents, setIncidents] = useState<'cited' | 'imagined'>('cited');
  const [useFile, setUseFile] = useState(true);
  const concept = c.kind === 'concept-only';
  const send = () => socket.cmd(snap.id, 'scope', { learner, size, pilotCount: count, incidents, useFile }).then(() => { toast(useFile ? 'Scope set. Building the fact base.' : 'Waiting for the right file.'); reload(); }, e => toast(e.message, true));
  return (
    <div className="panel reveal" style={{ marginBottom: 22 }}>
      <span className="sign">Stage 1 · Before anything is spent</span>
      <h2 style={{ marginTop: 6 }}>Four questions about this course</h2>
      <div className="grid g3" style={{ margin: '16px 0 6px' }}>
        <div className="slab"><span className="sign">The source is</span><div className="bignum" style={{ fontSize: 34, marginTop: 6 }}>{c.kind || '…'}</div><p className="small" style={{ marginTop: 6, opacity: .8 }}>{concept ? 'It teaches concepts but has no cases. Each lesson needs a case paired with a concept.' : 'It holds real cases. Each lesson takes one case from it.'}</p></div>
        <div className="slab"><span className="sign">Reads as</span><div className="bignum" style={{ fontSize: 34, marginTop: 6 }}>{c.domain || '…'}</div><p className="small" style={{ marginTop: 6, opacity: .8 }}>You said <b>{snap.meta.domain}</b>. {c.mismatch ? 'These do not match.' : 'These match.'}</p></div>
        <div className="slab"><span className="sign">Size</span><div className="bignum" style={{ fontSize: 34, marginTop: 6 }}>{c.words?.toLocaleString() || '…'}<small> words</small></div><p className="small" style={{ marginTop: 6, opacity: .8 }}>{(c.files || []).join(', ')}{c.signals?.slides ? ` · ${c.signals.slides} slides` : ''}</p></div>
      </div>
      <span className="label-by">classified by: automated heuristics, confidence {f2(c.confidence)}</span>

      {c.mismatch && (
        <div className="banner warn" style={{ marginTop: 16 }}><span>▲</span><div><b>The file may not match what you asked for.</b>You asked for a {snap.meta.domain} course; the source reads mostly as {c.domain}.
          <div className="seg" style={{ marginTop: 10 }}><button className={useFile ? 'on' : ''} onClick={() => setUseFile(true)}>Use this file as it is</button><button className={!useFile ? 'on' : ''} onClick={() => setUseFile(false)}>Wait for the right file</button></div></div></div>
      )}
      {useFile && <>
        <div className="divider" />
        <label className="field"><span>1 · Who is the learner?</span><input type="text" value={learner} onChange={e => setLearner(e.target.value)} placeholder="Role, what they know, what they must be able to do afterwards" /></label>
        <div className="field"><span className="sign">2 · How much of the source?</span>
          <div className="row"><div className="seg"><button className={size === 'pilot' ? 'on' : ''} onClick={() => setSize('pilot')}>A pilot</button><button className={size === 'whole' ? 'on' : ''} onClick={() => setSize('whole')}>The whole source</button></div>
            {size === 'pilot' && <div className="seg">{[3, 4, 5].map(n => <button key={n} className={count === n ? 'on' : ''} onClick={() => setCount(n)}>{n} lessons</button>)}</div>}</div>
          <span className="small muted">A pilot of 3 to 5 lessons plus the hub lets you judge the course before the full build.</span></div>
        {concept && <div className="field" style={{ marginTop: 14 }}><span className="sign">3 · What should each concept be paired with?</span>
          <div className="seg"><button className={incidents === 'cited' ? 'on' : ''} onClick={() => setIncidents('cited')}>Real public incidents, cited</button><button className={incidents === 'imagined' ? 'on' : ''} onClick={() => setIncidents('imagined')}>Imagined scenes, labelled</button></div>
          <span className="small muted">Real incidents are verified against primary sources first. Imagined scenes are always marked "Imagined" to the learner; they never pass as real.</span></div>}
      </>}
      <div className="row" style={{ marginTop: 18 }}><button className="btn accent" onClick={send} disabled={useFile && !learner.trim()}>{useFile ? 'Build the fact base' : 'Wait for the right file'}</button>{useFile && !learner.trim() && <span className="small muted">Describe the learner to continue.</span>}</div>
    </div>
  );
}

function FactbaseBlock({ snap, stage, reload }: { snap: Snapshot; stage: Stage; reload: () => void }) {
  const fb = snap.factbase || {};
  const urls: any[] = fb.urls?.urls || [];
  const bad = urls.filter(u => !u.ok);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [who, setWho] = useState(snap.meta.author || '');
  const unreachable = bad.filter(u => u.kind !== 'broken');
  const all = unreachable.length > 0 && unreachable.every(u => checked[u.url]);
  async function attest() {
    await act(socket.cmd(snap.id, 'attest', { urls: unreachable.filter(u => checked[u.url]).map(u => u.url), by: who || 'author' }));
    await act(api(`/runs/${snap.id}/retry/factbase`, { method: 'POST' }), 'Re-checking the fact base'); reload();
  }
  return (
    <div className="panel reveal" style={{ marginBottom: 22, borderColor: 'var(--stop)' }}>
      <span className="sign">Stage 2 · Fact base · blocked</span>
      <h2 style={{ marginTop: 6 }}>Authoring waits until every fact is traceable</h2>
      <div className="banner stop" style={{ marginTop: 10 }}><div>{stage.detail}</div></div>
      {fb.quotes && !fb.quotes.ok && <><h3 style={{ marginTop: 18 }}>Quotations not found in the source</h3><ul className="problems">{(fb.quotes.missing || []).map((m: string, i: number) => <li key={i}><span className="chip fail">quote</span>{m}</li>)}</ul></>}
      {bad.length > 0 && <>
        <h3 style={{ marginTop: 18 }}>NOTES links</h3>
        <p className="small muted">A link that returns an error must be fixed in the fact base. A link this machine could not reach (a network policy, a timeout) needs a person: open it, check it says what the fact base claims, and confirm it here. Your confirmation is logged with your name.</p>
        <div className="tablewrap"><table className="ledger"><thead><tr><th></th><th>Link</th><th>Used in</th><th>Result</th></tr></thead><tbody>
          {bad.map(u => <tr key={u.url}>
            <td>{u.kind !== 'broken' && <input type="checkbox" aria-label={'I opened ' + u.url} checked={!!checked[u.url]} onChange={e => setChecked(c => ({ ...c, [u.url]: e.target.checked }))} />}</td>
            <td style={{ maxWidth: 380, overflowWrap: 'anywhere' }}><a href={u.url} target="_blank" rel="noreferrer noopener">{u.url}</a></td>
            <td className="mono small">{u.files.join(', ')}</td>
            <td>{u.kind === 'broken' ? <span className="chip fail">error {u.status}</span> : <span className="chip warn" title={String(u.status)}>unreachable from here</span>}</td></tr>)}
        </tbody></table></div>
        {unreachable.length > 0 && <div className="row" style={{ marginTop: 14 }}>
          <input type="text" value={who} onChange={e => setWho(e.target.value)} placeholder="Your name" style={{ maxWidth: 220 }} />
          <button className="linkbtn" onClick={() => setChecked(Object.fromEntries(unreachable.map(u => [u.url, true])))}>Select all unreachable</button>
          <button className="btn" disabled={!Object.values(checked).some(Boolean) || !who.trim()} onClick={attest}>{all ? 'I opened every link · re-check' : 'Confirm the selected links · re-check'}</button>
        </div>}
      </>}
    </div>
  );
}

function cellClass(v?: string) { return v === 'pass' ? 'pass' : v === 'fail' ? 'fail' : ''; }
function scoreClass(v?: number, bar = 4) { return v == null ? '' : v < bar - 0.3 ? 'lo' : v < bar ? 'mid' : ''; }

function LessonBoard({ snap }: { snap: Snapshot }) {
  const [open, setOpen] = useState<string | null>(null);
  const failing = snap.lessons.filter(l => l.status === 'failing');
  useEffect(() => { if (failing.length === 1 && !open) setOpen(failing[0].id); }, [failing.length]);
  if (!snap.lessons.length) return <div className="panel empty"><h3>No lessons yet</h3><p>The lesson map appears after the design stage.</p></div>;
  const kinds = snap.lessons.reduce((m: any, l) => { m[l.kind || 'chapter'] = (m[l.kind || 'chapter'] || 0) + 1; return m; }, {});
  return (
    <div className="panel" style={{ padding: '18px 18px 8px' }}>
      <div className="row between" style={{ marginBottom: 10, padding: '0 6px' }}>
        <div><span className="sign">Build board</span><h3 style={{ marginTop: 4 }}>Every lesson, every check</h3></div>
        <div className="row small muted">{Object.entries(kinds).map(([k, n]) => <span key={k}>{n as number} {k}{(n as number) > 1 ? 's' : ''}</span>)}<span className="label-by">checks: automated</span><span className="label-by">scores: model panel / simulated learners</span></div>
      </div>
      <div className="tablewrap">
        <table className="board">
          <thead><tr><th>Lesson</th><th>Status</th>{CHECKS.map(([, l]) => <th key={l} style={{ textAlign: 'center' }}>{l}</th>)}<th title="Minutes from lx_auto">Min</th><th title="Teaching review mean after fixes (bar 4.3)">Teach</th><th title="Simulated learners, latest round (bar 4.0)">Learn</th><th title="Final score-only design panel">Design</th></tr></thead>
          <tbody>
            {snap.lessons.map(l => (
              <Fragment key={l.id}>
                <tr className={'lrow' + (open === l.id ? ' open' : '')} onClick={() => setOpen(open === l.id ? null : l.id)}>
                  <td style={{ minWidth: 200 }}><div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}><span className="lid">{l.id}</span>{l.kind === 'checkpoint' && <span className="chip none">checkpoint</span>}{snap.exemplar?.id === l.id && <span className="chip wait">exemplar</span>}</div>
                    <div className="ltitle">{l.title || l.id}</div><div className="ldev">{l.device}{l.signature ? ` · ${l.signature}` : ''}</div></td>
                  <td>{l.busy ? <span className="chip run"><span className="spinner" style={{ width: 9, height: 9 }} />{l.busy}</span> : <span className={'chip ' + ({ passing: 'pass', failing: 'fail', authored: 'none', failed: 'fail', planned: 'none' } as any)[l.status]}>{l.status}</span>}</td>
                  {CHECKS.map(([k]) => <td key={k} style={{ textAlign: 'center' }}><span className={'cell ' + cellClass(l.checks?.[k])} title={`${k}: ${l.checks?.[k] || 'not run'}`}>{l.checks?.[k] === 'pass' ? '✓' : l.checks?.[k] === 'fail' ? '✕' : '·'}</span></td>)}
                  <td className="num">{l.minutes ?? '–'}</td>
                  <td><span className={'score ' + scoreClass(l.teaching, 4.3)}>{f2(l.teaching)}</span></td>
                  <td><span className={'score ' + scoreClass(l.lx)}>{f2(l.lx)}</span></td>
                  <td><span className="score">{f2(l.panel)}</span></td>
                </tr>
                {open === l.id && <tr><td colSpan={10} style={{ background: 'var(--paper-2)' }}>
                  {l.problems?.length ? <><span className="sign">What failed, and where</span><ul className="problems" style={{ marginTop: 8 }}>{l.problems.map((p, i) => <li key={i}><span className="chip fail">{p.check}</span><span>{p.text}</span></li>)}</ul></>
                    : l.status === 'passing' ? <span className="small">All four automated suites pass at phone-dark and desktop-light. {l.by ? `Written by ${l.by}.` : ''}</span>
                      : l.error ? <span className="small">{l.error}</span> : <span className="small muted">Not checked yet.</span>}
                  {l.status !== 'planned' && <div className="row" style={{ marginTop: 10 }}><a className="btn ghost small" href={`/api/runs/${snap.id}/preview#${l.id}`} target="_blank" rel="noreferrer">Play this lesson</a></div>}
                </td></tr>}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

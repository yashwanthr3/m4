import { useState } from 'react';
import { socket, Snapshot, toast } from '../../api';
import { Decision, Editable, GateHeader, Markdown, Ring } from '../../components/bits';

const SIGS = ['order', 'sort', 'tapfind', 'runaway', 'vigil', 'slider', 'stop', 'choice'];

export function DesignGate({ snap, reload }: { snap: Snapshot; reload: () => void }) {
  const st = snap.stages.find(s => s.id === 'gate-design')!;
  const d = snap.design;
  const waiting = st.status === 'waiting';
  const [reviewed, setReviewed] = useState<Record<number, boolean>>({});
  const edited = new Set(snap.log.filter(e => e.type === 'design.edited').map(e => `${e.lesson || 'q' + e.framework}:${Object.keys(e.fields || {})[0]}`));
  const warnings: string[] = (snap.config?.warnings || []).filter((w: string) => /copied|long/.test(w));
  const unreviewed = warnings.filter((_, i) => !reviewed[i]).length;

  if (!d) return <div className="panel empty"><h3>No design yet</h3><p>The design appears here after the fact base is built.</p></div>;
  const save = (patch: any) => socket.cmd(snap.id, 'design', patch).then(() => { toast('Saved to the lesson map'); reload(); }, e => toast(e.message, true));
  const canEdit = waiting;

  return (
    <div>
      <GateHeader n="I" title="Design sign-off" waiting={waiting} approved={snap.gates.design?.type === 'gate.approved' ? snap.gates.design.commit : null}>
        <p className="muted" style={{ marginTop: 6 }}>Everything here is derived from your source, with the cases cited. Click any lesson's case, device or mechanic to change it before you approve. Nothing is written until you do.</p>
      </GateHeader>

      <div className="grid g2">
        <div className="panel">
          <span className="sign">The question framework · {d.framework?.length} questions</span>
          <ol className="qlist" style={{ marginTop: 10 }}>
            {(d.framework || []).map((q: any) => (
              <li key={q.n}><span className="qn">{q.n}</span><div>
                <div className="qq">{canEdit ? <Editable label={`question ${q.n}`} value={q.q} edited={edited.has(`q${q.n}:q`)} onSave={v => save({ framework: q.n, fields: { q: v } })} /> : q.q}</div>
                <div className="qh">{canEdit ? <Editable label={`boundary for question ${q.n}`} value={q.hint} multiline edited={edited.has(`q${q.n}:hint`)} onSave={v => save({ framework: q.n, fields: { hint: v } })} /> : q.hint}</div>
                <div className="cites">{(q.cites || []).map((c: string) => <span key={c}>{c}</span>)}</div>
              </div></li>
            ))}
          </ol>
        </div>
        <div>
          <div className="panel">
            <span className="sign">What "stop" means here</span>
            <div className="row" style={{ marginTop: 12, alignItems: 'center', gap: 20, flexWrap: 'nowrap' }}>
              <Ring text={d.stop?.ring || ''} />
              <div><p style={{ fontFamily: 'var(--display)', fontSize: 18, lineHeight: 1.35 }}>{d.stop?.means}</p>
                <div className="stamps">{(d.stop?.stamps || []).map((s: string) => <span key={s}>{s}</span>)}</div></div>
            </div>
          </div>
          <div className="panel">
            <span className="sign">The ladder of parts</span>
            <div className="grid" style={{ marginTop: 10, gap: 8 }}>
              {(d.ladder || []).map((p: any) => <div key={p.part} style={{ display: 'grid', gridTemplateColumns: '64px minmax(0,1fr)', gap: 12, alignItems: 'start' }}><span className="chip none" style={{ justifyContent: 'center' }}>Part {p.part}</span><div><b style={{ fontFamily: 'var(--sign)', letterSpacing: '.08em', textTransform: 'uppercase' }}>{p.job}</b> · {p.name}<div className="small muted">{p.desc}</div></div></div>)}
            </div>
          </div>
          <div className="panel">
            <span className="sign">Learner personas · simulated in the learner loop</span>
            <div className="grid" style={{ marginTop: 10, gap: 10 }}>
              {(d.personas || []).map((p: any) => <div key={p.name}><b>{p.name}</b> <span className="small muted">· {p.role}</span><div className="small">Quits when: {p.quits}</div></div>)}
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 18 }}>
        <div className="row between"><span className="sign">Lesson map · {d.lessons?.length} lessons · exemplar {d.exemplar}</span>{canEdit && <span className="small muted">Click a field to edit it</span>}</div>
        <div className="lmap" style={{ marginTop: 12 }}>
          {(d.lessons || []).map((l: any) => (
            <div className="lcard" key={l.id}>
              <div><span className="k">{l.id} · {l.kind} · part {l.part}</span><div className="t">{l.title}</div></div>
              <div>{l.id === d.exemplar && <span className="chip wait">exemplar</span>}</div>
              <dl>
                <dt>Case</dt><dd>{canEdit ? <Editable label={`${l.id} case`} value={l.case} edited={edited.has(`${l.id}:case`)} onSave={v => save({ lesson: l.id, fields: { case: v } })} /> : l.case} <span className="cites" style={{ display: 'inline-flex' }}><span>{l.citation}</span></span></dd>
                <dt>Concept</dt><dd className="small">{l.concept}</dd>
                <dt>Device</dt><dd>{canEdit ? <Editable label={`${l.id} device`} value={l.device} edited={edited.has(`${l.id}:device`)} onSave={v => save({ lesson: l.id, fields: { device: v } })} /> : l.device}</dd>
                <dt>The error</dt><dd>{canEdit ? <Editable label={`${l.id} mechanic`} value={l.mechanic} edited={edited.has(`${l.id}:mechanic`)} onSave={v => save({ lesson: l.id, fields: { mechanic: v } })} /> : l.mechanic}</dd>
                <dt>Signature</dt><dd>{canEdit ? <select value={l.signature} onChange={e => save({ lesson: l.id, fields: { signature: e.target.value } })} style={{ width: 'auto', padding: '4px 8px' }} aria-label={`${l.id} signature mechanic`}>{SIGS.map(s => <option key={s}>{s}</option>)}</select> : <code>{l.signature}</code>}</dd>
                {l.chain?.length > 0 && <><dt>Stop chain</dt><dd><div className="minichain">{l.chain.map((c: any, i: number) => <span key={i} style={{ display: 'contents' }}>{i > 0 && <i />}<span className={c.control ? 'ctl' : ''} title={c.control ? 'Control point' : ''}>{c.short}</span></span>)}</div></dd></>}
                <dt>Questions</dt><dd>{(l.questions || []).map((n: number) => <span key={n} className="chip none" style={{ marginRight: 4 }}>Q{n}</span>)}</dd>
              </dl>
            </div>
          ))}
        </div>
      </div>

      <div className="grid g2" style={{ marginTop: 18 }}>
        <div className="panel">
          <span className="sign">config_check.py</span> <span className="label-by">automated</span>
          <div style={{ marginTop: 10 }}>{snap.config?.ok ? <span className="chip pass">config OK</span> : <span className="chip fail">{snap.config?.errors?.length} errors</span>}</div>
          {snap.config?.errors?.map((e: string) => <div key={e} className="small" style={{ color: 'var(--stop-ink)', marginTop: 6 }}>{e}</div>)}
          {warnings.length > 0 && <>
            <p className="small" style={{ marginTop: 12 }}>Review each copied-phrase warning before approving: confirm the phrase fits this domain.</p>
            {warnings.map((w, i) => <label key={i} className="row small" style={{ flexWrap: 'nowrap', alignItems: 'flex-start', marginTop: 6 }}><input type="checkbox" checked={!!reviewed[i]} onChange={e => setReviewed(r => ({ ...r, [i]: e.target.checked }))} /><span>{w}</span></label>)}
          </>}
        </div>
        <div className="panel">
          <span className="sign">Exhibit inventory</span>
          <table className="ledger" style={{ marginTop: 6 }}><tbody>{(d.exhibits || []).map((x: any) => <tr key={x.object}><td>{x.object}</td><td><code>{x.skin}</code></td></tr>)}</tbody></table>
        </div>
      </div>

      {snap.designMd && <details className="panel more" style={{ marginTop: 18 }}><summary>DESIGN.md as the authors will read it</summary><div style={{ marginTop: 14 }}><Markdown text={snap.designMd} /></div></details>}

      {waiting && <div style={{ marginTop: 18 }}>
        <Decision approveLabel="Approve the design"
          holdReason={!snap.config?.ok ? 'config_check must print "config OK" first.' : unreviewed ? `Review ${unreviewed} copied-phrase warning${unreviewed > 1 ? 's' : ''} first.` : null}
          changesHint="What should change? e.g. 'ch05: use the ICO penalty notice as the device, not the workbook'"
          onApprove={(by, notes) => socket.cmd(snap.id, 'gate', { decision: 'approve', by, notes: [notes, warnings.length ? `Reviewed ${warnings.length} config warnings.` : ''].filter(Boolean).join('\n') }, 'design').then(() => { toast('Design approved. Writing the exemplar.'); reload(); }, e => toast(e.message, true))}
          onChanges={(by, notes) => socket.cmd(snap.id, 'gate', { decision: 'changes', by, notes }, 'design').then(() => { toast('Sent back to the design agent'); reload(); }, e => toast(e.message, true))} />
      </div>}
    </div>
  );
}

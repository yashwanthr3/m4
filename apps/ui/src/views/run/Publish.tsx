import { useState } from 'react';
import { act, api, Health, socket, Snapshot, toast } from '../../api';
import { Decision, GateHeader, Markdown } from '../../components/bits';
import { PhonePanel } from './ExemplarGate';

export function Publish({ snap, reload, health }: { snap: Snapshot; reload: () => void; health: Health | null }) {
  const st = snap.stages.find(s => s.id === 'gate-publish')!;
  const waiting = st.status === 'waiting';
  const pub = snap.publish;
  const blocks: string[] = pub?.blocks || [];
  const done = st.status === 'done';
  const [url, setUrl] = useState(snap.meta.artifactUrl || '');
  const used = Object.values(snap.patterns?.slots || {}).filter((s: any) => s.decision === 'accepted') as any[];

  return (
    <div>
      <GateHeader n="III" title="Publish" waiting={waiting} approved={done ? snap.gates.publish?.commit : null}>
        <p className="muted" style={{ marginTop: 6 }}>A fresh score-only design panel, then build.py makes the single dist/index.html. Publishing is refused while any lesson fails a check or any invented claim is unresolved.</p>
      </GateHeader>

      {!pub && <div className="panel empty"><h3>Not ready yet</h3><p>This gate opens after the learner loop.</p></div>}

      {pub && <>
        {blocks.length > 0 ? <div className="banner stop" style={{ marginBottom: 18 }}><span>■</span><div><b>Publishing is blocked</b><ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{blocks.map(b => <li key={b}>{b}</li>)}</ul></div></div>
          : <div className="banner ok" style={{ marginBottom: 18 }}><span>✓</span><div><b>Every hard gate passes</b>Automated suites green on every lesson, no unresolved invented claims, pattern contract passing. {pub.bytes ? `dist/index.html is ${(pub.bytes / 1024).toFixed(0)} KB.` : ''}</div></div>}

        <div className="grid g2">
          <div className="panel">
            <span className="sign">The course</span>
            <div className="desk-frame" style={{ marginTop: 12 }}><div className="chrome"><i /><i /><i /><span>dist/index.html</span></div><iframe title="The built course" src={`/api/runs/${snap.id}/preview`} style={{ width: '100%', height: 420, border: 0, display: 'block' }} /></div>
            <div className="row" style={{ marginTop: 12 }}><a className="btn ghost small" href={`/api/runs/${snap.id}/preview`} target="_blank" rel="noreferrer">Open full size</a></div>
          </div>
          <div>
            <PhonePanel snap={snap} health={health} />
            <div className="panel">
              <span className="sign">Patterns used · provenance</span>
              {used.length ? <table className="ledger" style={{ marginTop: 6 }}><tbody>{used.map(s => <tr key={s.lesson + s.step}><td className="mono">#{s.accepted}</td><td>{s.candidates.find((c: any) => c.n === s.accepted)?.name}</td><td className="mono small">{s.lesson} · step {s.step}</td></tr>)}</tbody></table> : <p className="small muted" style={{ marginTop: 8 }}>No library pattern accepted. Listed here and in the build note when used.</p>}
            </div>
          </div>
        </div>

        {done && <div className="panel" style={{ borderColor: 'var(--ok)' }}>
          <span className="sign">Delivered</span>
          <h3 style={{ marginTop: 4 }}>{snap.published?.url ? <>Published to <a href={snap.published.url}>{snap.published.url}</a></> : 'Built, packaged and committed'}</h3>
          <div className="row" style={{ marginTop: 12 }}>
            <a className="btn accent small" href={`/api/runs/${snap.id}/download/html`}>Download the course (.html)</a>
            <a className="btn ghost small" href={`/api/runs/${snap.id}/download/source`}>Source (.tar.gz)</a>
            <a className="btn ghost small" href={`/api/runs/${snap.id}/download/note`}>Build note (.md)</a>
          </div>
          {!snap.published?.url && <>
            <p className="small" style={{ marginTop: 14 }}>To publish it as a claude.ai artifact, ask Claude Code in this folder: <code>publish runs/{snap.id}/studio/publish/index.html as an artifact</code>{snap.meta.artifactUrl ? ' (pass the existing URL to republish)' : ''}. Or set <code>publishCommand</code> in studio.config.json to do it automatically. Then record the link:</p>
            <div className="row"><input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://claude.ai/artifact/…" style={{ maxWidth: 420 }} /><button className="btn small" disabled={!url.startsWith('https://')} onClick={() => act(api(`/runs/${snap.id}/artifact`, { json: { url } }), 'Artifact link saved').then(reload)}>Save link</button></div>
          </>}
        </div>}

        {snap.report && <details className="panel more" open={waiting}><summary>report.md · what the build note will say</summary><div style={{ marginTop: 14 }}><Markdown text={snap.report} /></div></details>}

        {waiting && <div style={{ marginTop: 18 }}>
          <Decision approveLabel="Publish the course"
            holdReason={blocks.length ? 'Clear the blocks above first.' : null}
            changesHint="Edit by instruction: say what to change, e.g. 'ch05 step 4: the slider prompt should name the sheet'. A fixer applies it, the fact re-check runs on the diff, then the suite."
            onApprove={(by, notes) => socket.cmd(snap.id, 'gate', { decision: 'approve', by, notes }, 'publish').then(() => { toast('Published'); reload(); }, e => toast(e.message, true))}
            onChanges={(by, notes) => socket.cmd(snap.id, 'gate', { decision: 'changes', by, notes }, 'publish').then(() => { toast('Applying your instruction, then re-checking facts'); reload(); }, e => toast(e.message, true))} />
        </div>}
      </>}
    </div>
  );
}

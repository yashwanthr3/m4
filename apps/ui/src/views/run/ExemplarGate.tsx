import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { fileUrl, Health, socket, Snapshot, toast } from '../../api';
import { Decision, GateHeader } from '../../components/bits';

function stepName(f: string) { const m = f.match(/-(step(\d+)|finish)\.png$/); return m ? (m[2] ? `Step ${Number(m[2])}` : 'Finish') : f; }
function key(f: string) { return f.replace(/^.*\/(desktop-light|phone-dark)-/, ''); }

export function ExemplarGate({ snap, reload, health }: { snap: Snapshot; reload: () => void; health: Health | null }) {
  const st = snap.stages.find(s => s.id === 'gate-exemplar')!;
  const ex = snap.exemplar;
  const waiting = st.status === 'waiting';
  const shots: string[] = ex?.shots || [];
  const keys = useMemo(() => [...new Set(shots.map(key))].sort((a, b) => (a.startsWith('finish') ? 1 : b.startsWith('finish') ? -1 : a.localeCompare(b))), [shots.join()]);
  const [k, setK] = useState<string | null>(null);
  const cur = k || keys[0];
  const desk = shots.find(s => s.includes('/desktop-light-') && key(s) === cur);
  const phone = shots.find(s => s.includes('/phone-dark-') && key(s) === cur);
  const [play, setPlay] = useState(false);

  if (!ex) return (
    <div>
      <GateHeader n="II" title="Exemplar sign-off" waiting={false} />
      <div className="panel empty"><h3>The exemplar is not written yet</h3><p>After you approve the design, the lead agent writes the first lesson at the highest effort setting and the studio checks and captures it.</p></div>
    </div>
  );
  const lx = ex.lx || {};
  const lesson = snap.lessons.find(l => l.id === ex.id);

  return (
    <div>
      <GateHeader n="II" title={`Exemplar sign-off · ${lesson?.title || ex.id}`} waiting={waiting} approved={snap.gates.exemplar?.type === 'gate.approved' ? snap.gates.exemplar.commit : null}>
        <p className="muted" style={{ marginTop: 6 }}>This lesson sets the density, voice and craft every author will match. No author starts until you approve it.</p>
      </GateHeader>

      <div className="grid g4" style={{ marginBottom: 18 }}>
        {[['Static', 'static'], ['Phone e2e', 'e2ePhone'], ['Desktop e2e', 'e2eDesktop'], ['Taste · overlap', 'taste']].map(([l, c]) => {
          const v = c === 'taste' ? (lesson?.checks?.taste === 'pass' && lesson?.checks?.overlap === 'pass' ? 'pass' : lesson?.checks?.taste ? 'fail' : 'none') : lesson?.checks?.[c];
          return <div key={l} className="panel" style={{ padding: 16 }}><span className="sign">{l}</span><div style={{ marginTop: 8 }}><span className={'chip ' + (v === 'pass' ? 'pass' : v === 'fail' ? 'fail' : 'none')}>{v || 'not run'}</span></div></div>;
        })}
      </div>

      <div className="panel">
        <div className="row between">
          <div><span className="sign">Captured screens · desktop-light and phone-dark</span> <span className="label-by">automated player picks the answers</span></div>
          <div className="row"><button className="btn ghost small" onClick={() => setPlay(p => !p)}>{play ? 'Show screenshots' : 'Play it here'}</button><a className="btn ghost small" href={`/api/runs/${snap.id}/preview#${ex.id}`} target="_blank" rel="noreferrer">Open in a new tab</a></div>
        </div>
        {!play && <>
          <div className="film" style={{ marginTop: 14 }} role="tablist" aria-label="Steps">
            {keys.map(kk => { const thumb = shots.find(s => s.includes('/desktop-light-') && key(s) === kk) || shots.find(s => key(s) === kk)!;
              return <button key={kk} role="tab" aria-selected={kk === cur} className={kk === cur ? 'on' : ''} onClick={() => setK(kk)} title={stepName(thumb)}><img src={fileUrl(snap.id, thumb)} alt="" loading="lazy" /></button>; })}
          </div>
          <div className="small muted" style={{ margin: '0 0 10px' }}>{desk ? stepName(desk) : phone ? stepName(phone) : ''} · {keys.length} key screens</div>
          <div className="devices">
            <div className="desk-frame"><div className="chrome"><i /><i /><i /><span>1280 × 900 · light</span></div><div className="shotscroll">{desk ? <img className="shot" src={fileUrl(snap.id, desk)} alt={`Desktop, light theme, ${stepName(desk)}`} /> : <div className="empty">No desktop capture</div>}</div></div>
            <div className="phone-frame"><div className="screen shotscroll">{phone ? <img className="shot" src={fileUrl(snap.id, phone)} alt={`Phone, dark theme, ${stepName(phone)}`} /> : <div className="empty">No phone capture</div>}</div></div>
          </div>
        </>}
        {play && <div className="devices" style={{ marginTop: 14 }}>
          <div className="desk-frame"><div className="chrome"><i /><i /><i /><span>live · {ex.id}</span></div><iframe title="Exemplar, desktop" src={`/api/runs/${snap.id}/preview#${ex.id}`} style={{ width: '100%', height: 620, border: 0, display: 'block' }} /></div>
          <div className="phone-frame"><div className="screen"><iframe title="Exemplar, phone width" src={`/api/runs/${snap.id}/preview#${ex.id}`} style={{ width: '100%', height: 560, border: 0, display: 'block' }} /></div></div>
        </div>}
      </div>

      <div className="grid g2" style={{ marginTop: 18 }}>
        <div className="panel">
          <span className="sign">Reading load · lx_auto</span> <span className="label-by">automated</span>
          <table className="ledger" style={{ marginTop: 8 }}><tbody>
            <tr><td>Grade level</td><td className="n">{lx.grade ?? '–'}</td><td className="small muted">target ≤ 9</td></tr>
            <tr><td>Average sentence</td><td className="n">{lx.sent ?? '–'} words</td><td className="small muted">target &lt; 16</td></tr>
            <tr><td>Words before the first action</td><td className="n">{lx.first ?? '–'}</td><td className="small muted">target ≤ 120</td></tr>
            <tr><td>Most reading in one step</td><td className="n">{lx.maxread ?? '–'}</td><td className="small muted">target ≤ 150</td></tr>
            <tr><td>Undefined acronyms</td><td className="n">{lx.acr?.length ?? '–'}</td><td className="small muted">target 0</td></tr>
            <tr><td>Estimated minutes</td><td className="n">{lx.est_min ?? '–'}</td><td className="small muted">sets the lesson's minutes</td></tr>
          </tbody></table>
        </div>
        <PhonePanel snap={snap} id={ex.id} health={health} />
      </div>

      {waiting && <div style={{ marginTop: 18 }}>
        <Decision approveLabel="Approve and start the authors"
          holdReason={!ex.pass ? 'The exemplar must pass all four automated suites first.' : null}
          changesHint="What should change? e.g. 'Step 3 carries two ideas; the reveal needs the real figure in a stat'"
          onApprove={(by, notes) => socket.cmd(snap.id, 'gate', { decision: 'approve', by, notes }, 'exemplar').then(() => { toast('Exemplar approved. Authors are starting.'); reload(); }, e => toast(e.message, true))}
          onChanges={(by, notes) => socket.cmd(snap.id, 'gate', { decision: 'changes', by, notes }, 'exemplar').then(() => { toast('Sent back to the lead agent'); reload(); }, e => toast(e.message, true))} />
      </div>}
    </div>
  );
}

export function PhonePanel({ snap, id, health }: { snap: Snapshot; id?: string; health: Health | null }) {
  const [qr, setQr] = useState<string | null>(null);
  const url = health?.lan?.[0] ? `${health.lan[0]}/api/runs/${snap.id}/preview${id ? '#' + id : ''}` : null;
  useEffect(() => { if (url) QRCode.toDataURL(url, { margin: 1, width: 168 }).then(setQr); }, [url]);
  return (
    <div className="panel">
      <span className="sign">On your phone</span>
      {url ? <div className="row" style={{ marginTop: 12, alignItems: 'flex-start', flexWrap: 'nowrap' }}>
        {qr && <span className="qr"><img src={qr} width={140} height={140} alt="QR code for the draft course" /></span>}
        <div><p>Scan to open the draft on a phone on the same network.</p><code className="small" style={{ overflowWrap: 'anywhere' }}>{url}</code></div>
      </div> : <p className="small" style={{ marginTop: 10 }}>The studio listens only on this computer. To open drafts on your phone, start it with <code>HOST=0.0.0.0 npm start</code> and a QR code appears here.</p>}
    </div>
  );
}

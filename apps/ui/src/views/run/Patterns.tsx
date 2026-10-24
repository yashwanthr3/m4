import { useEffect, useRef, useState } from 'react';
import { api, socket, Snapshot, toast } from '../../api';

// The course engine's own palette (engine/engine.css), so a pattern previews inside the lesson skin.
const ENGINE = {
  light: { '--card': '#f6f6f1', '--card-2': '#efefe9', '--ground': '#e9ebe5', '--ground-2': '#dfe2da', '--ink': '#16181b', '--ink-2': '#43484e', '--ink-3': '#575d63', '--rule': '#c9ccc3', '--link': '#2450b8', '--ok': '#1d7448', '--ok-soft': '#d7ecdf', '--no': '#b3261b', '--no-soft': '#f5dcd8', '--warn': '#765000', '--warn-soft': '#f6e9c4', '--body': '"Libre Franklin",sans-serif', '--display': '"Newsreader",serif', '--sign': '"Barlow Condensed",sans-serif' },
  dark: { '--card': '#1d2024', '--card-2': '#23272b', '--ground': '#141618', '--ground-2': '#1b1e21', '--ink': '#ebece8', '--ink-2': '#b9bdbf', '--ink-3': '#979da2', '--rule': '#2e3338', '--link': '#8fb0ff', '--ok': '#6fd39c', '--ok-soft': '#173326', '--no': '#ff7b6e', '--no-soft': '#3d1a17', '--warn': '#f0c66a', '--warn-soft': '#3a3016', '--body': '"Libre Franklin",sans-serif', '--display': '"Newsreader",serif', '--sign': '"Barlow Condensed",sans-serif' }
};
const dark = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);

export function PatternFrame({ n, onGate }: { n: number; onGate?: () => void }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [e, setE] = useState<any>(null);
  const [h, setH] = useState(340);
  const [gate, setGate] = useState(false);
  const theme = dark() ? 'dark' : 'light';
  useEffect(() => { api(`/patterns/${n}/embed?theme=${theme}&vars=${encodeURIComponent(JSON.stringify(ENGINE[theme]))}`).then(setE, () => setE(null)); }, [n, theme]);
  useEffect(() => {
    const f = (ev: MessageEvent) => {
      if (ev.source !== ref.current?.contentWindow) return;
      if (ev.data?.type === 'trust-height') setH(Math.min(Math.max(240, ev.data.h + 4), 760));
      if (ev.data?.type === 'trust-pattern') { setGate(true); onGate?.(); }
    };
    window.addEventListener('message', f); return () => window.removeEventListener('message', f);
  }, []);
  if (!e) return <div className="pframe" style={{ display: 'grid', placeItems: 'center' }}><span className="spinner" /></div>;
  return (
    <div>
      <iframe ref={ref} className="pframe" title={`Pattern ${n} preview`} sandbox={e.sandbox} srcDoc={e.srcdoc} style={{ height: h }}
        onLoad={() => ref.current?.contentWindow?.postMessage(e.message, '*')} />
      <div className="small" style={{ marginTop: 6, color: gate ? 'var(--ok)' : 'var(--ink-3)' }}>{gate ? '✓ Remember card fired: in the lesson this unlocks the next block.' : 'Play it: the lesson moves on when its Remember card appears.'}</div>
    </div>
  );
}

function blockSummary(slot: any) {
  return { choice: 'a multiple-choice call', tapfind: 'a find-the-line exhibit', slider: 'a slider estimate', sort: 'a sort into folders', order: 'an ordering task', runaway: 'a runaway simulation', vigil: 'a watch-the-light vigil', fill: 'a fill-in form', cards: 'flip cards', rate: 'a self-rating' }[slot.type as string] || slot.type;
}

export function Patterns({ snap, reload }: { snap: Snapshot; reload: () => void }) {
  const slots = Object.entries(snap.patterns?.slots || {}) as [string, any][];
  const accepted = slots.filter(([, s]) => s.decision === 'accepted').length;
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<Record<string, number | null>>({});
  const contract = snap.patternContract?.patterns || {};

  async function decide(key: string, decision: 'accept' | 'keep', n?: number) {
    setBusy(key);
    try { await socket.cmd(snap.id, 'patterns', { decision, n }, key); toast(decision === 'accept' ? `Pattern ${n} placed in the lesson` : 'Kept the kit block'); reload(); }
    catch (e: any) { toast(e.message, true); }
    setBusy(null);
  }

  if (!snap.patterns) return <div className="panel empty"><h3>No pattern slots yet</h3><p>After the authors finish, the studio offers library patterns for steps marked imagined (transfer, drills, checkpoint practice). Steps that carry the record never get one.</p></div>;

  return (
    <div>
      <div className="grid g3" style={{ marginBottom: 18 }}>
        <div className="slab"><span className="sign">Eligible steps</span><div className="bignum" style={{ marginTop: 6 }}>{slots.length}</div><p className="small" style={{ opacity: .8, marginTop: 6 }}>Imagined steps with no stop chain, toolkit, real figure or quotation.</p></div>
        <div className="slab"><span className="sign">Accepted</span><div className="bignum" style={{ marginTop: 6 }}>{accepted}<small> / {slots.length}</small></div><p className="small" style={{ opacity: .8, marginTop: 6 }}>Target: 30% of steps that call for a practised gesture.</p></div>
        <div className="panel" style={{ padding: 16 }}>
          <span className="sign">The rules the studio enforces</span>
          <ul className="small" style={{ paddingLeft: 18, margin: '8px 0 0' }}>
            <li>Patterns are mechanics; lessons are cases. Never on the reveal, the stop chain or the toolkit.</li>
            <li>Never twice in a course. Never the lesson's signature simulation.</li>
            <li>Sandboxed: nothing the learner does leaves the page.</li>
          </ul>
        </div>
      </div>
      {snap.patterns.catalogue?.startsWith('sample') && <div className="banner warn" style={{ marginBottom: 16 }}><span>▲</span><div><b>Sample catalogue</b>Six sample patterns (901 to 906) stand in for the 135-pattern library until it is vendored. See vendor/patterns/README.md.</div></div>}

      {slots.map(([key, s]) => {
        const firstOpen = slots.find(([, x]) => x.decision === 'pending')?.[0];
        const pv = key in preview ? preview[key] : key === firstOpen ? s.candidates[0]?.n : null;
        return (
          <div className="slot reveal" key={key}>
            <header>
              <div><span className="lid mono">{s.lesson} · step {s.step}</span> <span className="chip none">{s.purpose}</span> <span className="small muted">replaces {blockSummary(s)}</span></div>
              <span className={'chip ' + (s.decision === 'accepted' ? 'pass' : s.decision === 'kept' ? 'none' : 'wait')}>{s.decision === 'accepted' ? `pattern ${s.accepted}` : s.decision === 'kept' ? 'kit block kept' : 'your choice'}</span>
            </header>
            <div className="cands">
              {s.candidates.map((c: any, i: number) => (
                <div key={c.n} className={'cand' + (s.decision === 'accepted' && s.accepted === c.n ? ' chosen' : '')}>
                  <span className="pn">#{c.n} · {c.theme} · {c.gesture}{i === 0 ? ' · best match' : ''}</span>
                  <span className="pt">{c.name}</span>
                  <span className="small">{c.learns}</span>
                  <div className="meter" title={`similarity ${c.score}`}><i style={{ width: `${Math.min(100, c.score * 100)}%` }} /></div>
                  <span className="why">{c.reason}</span>
                  {contract[c.n] && <span className={'chip ' + (contract[c.n].pass ? 'pass' : 'fail')}>autoplay {contract[c.n].passed}/4</span>}
                  <div className="row" style={{ marginTop: 'auto' }}>
                    <button className="btn ghost small" onClick={() => setPreview(p => ({ ...p, [key]: pv === c.n ? null : c.n }))} aria-pressed={pv === c.n}>{pv === c.n ? 'Hide preview' : 'Play it'}</button>
                    <button className="btn accent small" disabled={busy === key || (s.decision === 'accepted' && s.accepted === c.n)} onClick={() => decide(key, 'accept', c.n)}>{s.decision === 'accepted' && s.accepted === c.n ? 'In the lesson' : s.decision === 'accepted' ? 'Swap to this' : 'Accept'}</button>
                  </div>
                </div>
              ))}
              <div className="cand kit">
                <span className="pn">kit block</span>
                <span className="pt">Keep {blockSummary(s)}</span>
                <span className="small">{(s.intent || '').slice(0, 180)}{(s.intent || '').length > 180 ? '…' : ''}</span>
                <div className="row" style={{ marginTop: 'auto' }}><button className="btn ghost small" disabled={busy === key || s.decision === 'kept'} onClick={() => decide(key, 'keep')}>{s.decision === 'kept' ? 'Kept' : 'Keep the kit block'}</button></div>
              </div>
            </div>
            {pv != null && <div style={{ padding: '0 18px 18px' }}><span className="sign">Preview · pattern {pv} in the lesson skin</span><div style={{ marginTop: 8 }}><PatternFrame key={pv} n={pv} /></div></div>}
          </div>
        );
      })}
    </div>
  );
}

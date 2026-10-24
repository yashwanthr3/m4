import { useEffect, useRef, useState } from 'react';
import { marked } from 'marked';

/** Markdown from the course folder. Raw HTML is escaped: these files are written by agents. */
export function Markdown({ text }: { text: string }) {
  const html = marked.parse(text.replace(/</g, '&lt;'), { async: false }) as string;
  return <div className="md" dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Click-to-edit text. Saves on Enter or blur; Escape cancels. */
export function Editable({ value, onSave, multiline, label, edited }: { value: string; onSave: (v: string) => void; multiline?: boolean; label: string; edited?: boolean }) {
  const [on, setOn] = useState(false);
  const [v, setV] = useState(value);
  const ref = useRef<any>(null);
  useEffect(() => setV(value), [value]);
  useEffect(() => { if (on) ref.current?.focus(); }, [on]);
  if (!on) return <span className={'editable' + (edited ? ' edited' : '')} role="button" tabIndex={0} aria-label={`Edit ${label}`} title="Click to edit"
    onClick={() => setOn(true)} onKeyDown={e => { if (e.key === 'Enter') setOn(true); }}>{value || <span className="muted">add</span>}</span>;
  const done = (save: boolean) => { setOn(false); if (save && v.trim() !== value) onSave(v.trim()); else setV(value); };
  const p = { ref, value: v, 'aria-label': label, onChange: (e: any) => setV(e.target.value), onBlur: () => done(true), onKeyDown: (e: any) => { if (e.key === 'Escape') done(false); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); done(true); } } };
  return multiline ? <textarea {...p} rows={2} /> : <input type="text" {...p} />;
}

/** The emblem from the course: the stop button with its ring text. */
export function Ring({ text }: { text: string }) {
  const id = 'ring' + Math.random().toString(36).slice(2, 7);
  return (
    <svg className="ring" viewBox="0 0 150 150" role="img" aria-label={`Ring text: ${text}`}>
      <defs><path id={id} d="M75,75 m-58,0 a58,58 0 1,1 116,0 a58,58 0 1,1 -116,0" /></defs>
      <circle cx="75" cy="75" r="72" fill="var(--gate)" />
      <circle cx="75" cy="75" r="72" fill="none" stroke="var(--gate-deep)" strokeWidth="3" />
      <text><textPath href={`#${id}`} startOffset="0" textLength={350} lengthAdjust="spacing">{text} ★</textPath></text>
      <circle cx="75" cy="75" r="36" fill="var(--stop)" />
      <circle cx="75" cy="78" r="36" fill="none" stroke="rgba(0,0,0,.25)" strokeWidth="3" />
    </svg>
  );
}

export function GateHeader({ n, title, waiting, approved, children }: { n: string; title: string; waiting: boolean; approved?: string | null; children?: any }) {
  return (
    <div className="gatecard" style={{ marginBottom: 20 }}>
      <div className={'band ' + (waiting ? 'hazard' : '')} style={!waiting ? { background: approved ? 'var(--ok)' : 'var(--rule)' } : undefined} />
      <div className="head">
        <span className="gnum" style={!waiting && approved ? { background: 'var(--ink)', color: 'var(--gate)' } : undefined}>{n}</span>
        <div style={{ minWidth: 0 }}>
          <span className="sign">{waiting ? 'Gate · waiting for your decision' : approved ? 'Gate · approved' : 'Gate · not reached yet'}</span>
          <h2 style={{ marginTop: 4 }}>{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Approve / request changes. Approve can be held back by a reason (e.g. unreviewed warnings). */
export function Decision({ onApprove, onChanges, approveLabel, holdReason, changesHint }: { onApprove: (by: string, notes: string) => Promise<any>; onChanges: (by: string, notes: string) => Promise<any>; approveLabel: string; holdReason?: string | null; changesHint: string }) {
  const [mode, setMode] = useState<'approve' | 'changes'>('approve');
  const [by, setBy] = useState(() => { try { return localStorage.getItem('tcs-name') || ''; } catch { return ''; } });
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const save = (fn: typeof onApprove) => async () => { setBusy(true); try { localStorage.setItem('tcs-name', by); } catch { /* ignore */ } await fn(by, notes); setBusy(false); };
  return (
    <div className="panel" style={{ position: 'sticky', bottom: 14, zIndex: 5, boxShadow: 'var(--lift)', borderColor: 'var(--gate-deep)' }}>
      <div className="row between">
        <div className="seg"><button className={mode === 'approve' ? 'on' : ''} onClick={() => setMode('approve')}>Approve</button><button className={mode === 'changes' ? 'on' : ''} onClick={() => setMode('changes')}>Ask for changes</button></div>
        <input type="text" value={by} onChange={e => setBy(e.target.value)} placeholder="Your name (goes in the commit)" style={{ maxWidth: 260 }} aria-label="Your name" />
      </div>
      {mode === 'changes' && <textarea style={{ marginTop: 12 }} value={notes} onChange={e => setNotes(e.target.value)} placeholder={changesHint} aria-label="What should change" />}
      {mode === 'approve' && <textarea style={{ marginTop: 12, minHeight: 52 }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional note for the commit message" aria-label="Approval note" />}
      <div className="row" style={{ marginTop: 12 }}>
        {mode === 'approve'
          ? <button className="btn gate" disabled={busy || !!holdReason} onClick={save(onApprove)}>{busy ? 'Recording…' : approveLabel}</button>
          : <button className="btn" disabled={busy || !notes.trim()} onClick={save(onChanges)}>{busy ? 'Sending…' : 'Send back with these notes'}</button>}
        {mode === 'approve' && holdReason && <span className="small" style={{ color: 'var(--stop-ink)' }}>{holdReason}</span>}
        {mode === 'approve' && !holdReason && <span className="small muted">Recorded as a git commit in the course folder.</span>}
      </div>
    </div>
  );
}

export function ScoreBars({ names, before, after, bar = 4, max = 5 }: { names: string[]; before?: (number | null)[]; after: (number | null)[]; bar?: number; max?: number }) {
  return (
    <div className="bars">
      {names.map((n, i) => {
        const a = after[i] ?? null, b = before?.[i] ?? null;
        return (
          <div className="bar" key={n}>
            <span className="small">{n}</span>
            <span className="track" aria-hidden="true">
              {b != null && <span className="b" style={{ width: `${(b / max) * 100}%`, opacity: .28 }} />}
              <span className="a" style={{ width: `${((a ?? 0) / max) * 100}%`, background: a != null && a < bar ? 'var(--stop)' : undefined }} />
              <span className="line" style={{ left: `${(bar / max) * 100}%` }} />
            </span>
            <span className="v">{b != null && <span className="muted">{b.toFixed(2)} → </span>}{a == null ? '–' : a.toFixed(2)}</span>
          </div>
        );
      })}
    </div>
  );
}

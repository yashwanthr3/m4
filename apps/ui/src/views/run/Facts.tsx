import { useState } from 'react';
import { Snapshot } from '../../api';

/** The reviewer's view: every edit round's added learner-visible text, and what the fact re-check found. */
export function Facts({ snap }: { snap: Snapshot }) {
  const diffs = [...snap.diffs].reverse();
  const [round, setRound] = useState<string | null>(null);
  const cur = diffs.find(d => d.round === round) || diffs[0];
  const [lesson, setLesson] = useState<string | null>(null);
  const fb = snap.factbase;
  const changed = cur ? Object.entries(cur.lessons as Record<string, any>).filter(([, v]) => v.added > 0) : [];
  const lid = lesson && cur?.lessons[lesson] ? lesson : changed[0]?.[0];
  const totals = snap.facts.reduce((a, e) => ({ checked: a.checked + (e.checked || 0), fixed: a.fixed + (e.fixed || 0), unresolved: a.unresolved + (e.unresolved || 0) }), { checked: 0, fixed: 0, unresolved: 0 });

  return (
    <div>
      <div className="grid g4" style={{ marginBottom: 18 }}>
        <div className="slab"><span className="sign">Edit rounds re-checked</span><div className="bignum" style={{ marginTop: 6 }}>{snap.facts.length}</div></div>
        <div className="slab"><span className="sign">Added lines checked</span><div className="bignum" style={{ marginTop: 6 }}>{totals.checked}</div></div>
        <div className="slab"><span className="sign">Invented claims fixed</span><div className="bignum" style={{ marginTop: 6 }}>{totals.fixed}</div></div>
        <div className="slab" style={totals.unresolved ? { background: 'var(--stop)' } : undefined}><span className="sign">Unresolved</span><div className="bignum" style={{ marginTop: 6 }}>{totals.unresolved}</div><p className="small" style={{ opacity: .85, marginTop: 4 }}>{totals.unresolved ? 'Publishing is blocked.' : 'Publishing needs 0.'}</p></div>
      </div>

      <div className="panel">
        <div className="row between"><div><span className="sign">Fact base · stage 2</span><h3 style={{ marginTop: 4 }}>Every quotation and link traced</h3></div><span className="label-by">automated</span></div>
        {fb ? <div className="row" style={{ marginTop: 12, gap: 12 }}>
          <span className={'chip ' + (fb.quotes?.ok ? 'pass' : 'fail')}>{fb.quotes?.ok ? `quotes verbatim (${fb.marker})` : `${fb.quotes?.missing?.length} quotes not found`}</span>
          <span className={'chip ' + (fb.urls?.ok ? 'pass' : 'fail')}>{(fb.urls?.urls || []).length} NOTES links · {(fb.urls?.urls || []).filter((u: any) => u.attested).length} confirmed by a person</span>
          <span className="small muted">{fb.cases} src files</span>
        </div> : <p className="muted small" style={{ marginTop: 8 }}>Not built yet.</p>}
      </div>

      <div className="panel">
        <div className="row between"><div><span className="sign">Learner-visible text added since each snapshot</span><h3 style={{ marginTop: 4 }}>Diff per edit round</h3></div><span className="label-by">tools/diff_added.py</span></div>
        {!diffs.length ? <p className="muted" style={{ marginTop: 10 }}>No edit rounds yet. Each review, critic, fixer and instruction round snapshots the lessons first (a git tag), then shows here what it added.</p> : <>
          <div className="row" style={{ marginTop: 12 }}><div className="seg">{diffs.map(d => <button key={d.round} className={cur?.round === d.round ? 'on' : ''} onClick={() => { setRound(d.round); setLesson(null); }}>{d.round}</button>)}</div></div>
          <table className="ledger nums" style={{ marginTop: 12 }}><thead><tr><th>Round</th><th>Lessons changed</th><th>Lines checked</th><th>Claims fixed</th><th>Unresolved</th></tr></thead><tbody>
            {snap.facts.map((e, i) => <tr key={i} style={e.round === cur?.round ? { background: 'var(--paper-2)' } : undefined}><td>{e.round}</td><td className="n">{e.lessons}</td><td className="n">{e.checked}</td><td className="n">{e.fixed}</td><td className="n" style={e.unresolved ? { color: 'var(--stop-ink)', fontWeight: 700 } : undefined}>{e.unresolved}</td></tr>)}
          </tbody></table>
          {changed.length === 0 ? <div className="banner ok" style={{ marginTop: 14 }}><span>✓</span><div>The {cur.round} round changed no learner-visible text.</div></div> : <>
            <div className="row" style={{ marginTop: 16 }}>{changed.map(([id, v]) => <button key={id} className={'btn small ' + (id === lid ? '' : 'ghost')} onClick={() => setLesson(id)}>{id} · {v.added}</button>)}</div>
            <div className="diff" style={{ marginTop: 10 }}>{(cur.lessons[lid!]?.lines || []).map((l: string, i: number) => <span key={i} className="add">{l}</span>)}</div>
          </>}
        </>}
      </div>
    </div>
  );
}

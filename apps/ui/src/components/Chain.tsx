import { Stage } from '../api';

const STATUS: Record<string, string> = {
  pending: '', running: 'Running', done: 'Done', blocked: 'Blocked', failed: 'Failed', waiting: 'Waiting for you', interrupted: 'Interrupted', changes: 'Changes asked'
};

/** The pipeline as the course's own handover chain: twelve sockets, the three gates in safety yellow,
 *  the learner loop drawn as a return arc. */
export function Chain({ stages, selected, onPick }: { stages: Stage[]; selected?: string; onPick: (s: Stage) => void }) {
  const lastDone = stages.reduce((k, s, i) => (s.status === 'done' ? i : k), -1);
  const pct = lastDone < 0 ? 0 : (lastDone / (stages.length - 1)) * 92;
  return (
    <div className="chain" role="navigation" aria-label="Pipeline stages">
      <div className="chainwrap">
      <div className="prog" style={{ width: pct + '%' }} />
      <ol>
        {stages.map(s => (
          <li key={s.id} className={[s.status, s.kind === 'gate' ? 'gate' : '', selected === s.id ? 'sel' : ''].join(' ')}
            onClick={() => onPick(s)} title={`${s.title}: ${s.blurb}${s.detail ? '\n' + s.detail : ''}`}>
            <span className="sock" role="button" tabIndex={0} aria-label={`${s.n}. ${s.title}, ${STATUS[s.status] || 'not started'}`}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(s); } }}>
              {s.status === 'done' && s.kind !== 'gate' ? '✓' : s.kind === 'gate' ? ['', 'I', 'II', 'III'][[4, 6, 12].indexOf(s.n) + 1] : s.n}
            </span>
            <span className="name">{s.title}</span>
            <span className="st">{STATUS[s.status]}</span>
          </li>
        ))}
      </ol>
      <div className="loop" style={{ left: `calc(${(8 / 12) * 100}% + 18px)`, width: `calc(${(3 / 12) * 100}% - 36px)` }}><span>↺ edit rounds · fact re-check after each</span></div>
      </div>
    </div>
  );
}

export function MiniBeads({ done, total, gates = [4, 6, 12] }: { done: number; total: number; gates?: number[] }) {
  return <div className="bead" aria-hidden="true">{Array.from({ length: total }, (_, i) => <i key={i} className={(i < done ? 'd ' : '') + (gates.includes(i + 1) ? 'g' : '')} />)}</div>;
}

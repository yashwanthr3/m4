import { useEffect, useRef, useState } from 'react';
import { act, api, go, Health } from '../api';

const DOMAINS: [string, string][] = [['ai', 'AI governance'], ['cyber', 'Cybersecurity'], ['privacy', 'Privacy'], ['data', 'Data governance'], ['resilience', 'Resilience'], ['third-party', 'Third-party risk'], ['tech', 'Technology governance'], ['mixed', 'Mixed']];
const ACCEPT = '.pdf,.docx,.md,.markdown,.txt,.pptx,.odt,.html,.rtf';

export function NewCourse({ health }: { health: Health | null }) {
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('cyber');
  const [learner, setLearner] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [sample, setSample] = useState(false);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { document.title = 'New course · Trust Course Studio'; }, []);

  const add = (list: FileList | null) => { if (list) { setFiles(f => [...f, ...Array.from(list)]); setSample(false); } };
  const useSample = () => { setSample(true); setFiles([]); if (!title) setTitle('Who Owed Due Care?'); setDomain('cyber'); if (!learner) setLearner('Practitioners preparing for the CISSP'); };
  const ready = title.trim() && (files.length || sample);

  async function create() {
    setBusy(true);
    const r = await act(api<{ id: string }>('/runs', { json: { title, domain, learner } }));
    if (!r) { setBusy(false); return; }
    for (const f of files) await act(fetch(`/api/runs/${r.id}/source?name=${encodeURIComponent(f.name)}`, { method: 'POST', body: f }).then(x => { if (!x.ok) throw new Error('Upload failed: ' + f.name); }));
    if (sample) await act(api(`/runs/${r.id}/sample`, { method: 'POST' }));
    await act(api(`/runs/${r.id}/start`, { method: 'POST' }));
    go(`run/${r.id}`);
  }

  return (
    <div className="page">
      <span className="sign">New course · intake desk</span>
      <h1 style={{ margin: '10px 0 26px' }}>What are we teaching from?</h1>
      <div className="desk">
        <div className="panel reveal">
          <label className="field"><span>Course title</span><input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Who Owed Due Care?" autoFocus /></label>
          <label className="field"><span>Trust domain</span>
            <select value={domain} onChange={e => setDomain(e.target.value)}>{DOMAINS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </label>
          <label className="field"><span>Who is the learner? (optional, asked again)</span><input type="text" value={learner} onChange={e => setLearner(e.target.value)} placeholder="e.g. risk analysts new to AI governance" /></label>
          <div className="divider" />
          <p className="small muted">The studio checks that the file matches the domain, works out whether the source is case-rich or concept-only, then asks you one short set of questions before it spends anything on lessons.</p>
          <button className="btn accent" disabled={!ready || busy} onClick={create} style={{ width: '100%', marginTop: 8 }}>{busy ? 'Setting up the course folder…' : 'Open the course folder'}</button>
        </div>

        <div className="reveal">
          <div className={'tray' + (over ? ' over' : '')} role="button" tabIndex={0}
            onClick={() => input.current?.click()} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') input.current?.click(); }}
            onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
            onDrop={e => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}>
            <div>
              <div className="stackdocs" aria-hidden="true"><i /><i /><i /></div>
              <h3>Drop your source here</h3>
              <p className="small muted" style={{ marginTop: 6 }}>PDF, Word, PowerPoint, Markdown, or a set of incident reports. Several files become one source.</p>
              <span className="btn ghost small" style={{ marginTop: 8 }}>Choose files</span>
            </div>
            <input ref={input} type="file" multiple accept={ACCEPT} hidden onChange={e => add(e.target.files)} />
          </div>
          {(files.length > 0 || sample) && (
            <ul className="filelist">
              {files.map((f, i) => (
                <li key={i}><span className="ext">{f.name.split('.').pop()}</span><span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span><span className="small muted num">{(f.size / 1024).toFixed(0)} KB</span>
                  <button className="linkbtn small" onClick={() => setFiles(x => x.filter((_, k) => k !== i))}>Remove</button></li>
              ))}
              {sample && <li><span className="ext">md</span><span style={{ flex: 1 }}>CISSP deck excerpt (bundled sample)</span><button className="linkbtn small" onClick={() => setSample(false)}>Remove</button></li>}
            </ul>
          )}
          <div className="banner info" style={{ marginTop: 16 }}>
            <span aria-hidden="true">◇</span>
            <div><b>No source to hand?</b>Try the bundled sample: the CISSP deck lines quoted in the Trust Course Kit examples.{' '}
              <button className="linkbtn" onClick={useSample}>Use the sample</button>
              {health?.mode === 'mock' && <span className="muted"> In mock mode, only the sample's lessons exist.</span>}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

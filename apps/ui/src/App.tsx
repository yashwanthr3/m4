import { useEffect, useState } from 'react';
import { useApi, useHash, useSocketState, useToasts, Health } from './api';
import { Home } from './views/Home';
import { NewCourse } from './views/NewCourse';
import { RunView } from './views/Run';
import { Library } from './views/Library';

function ThemeButton() {
  const [t, setT] = useState<string>(() => document.documentElement.dataset.theme || 'auto');
  useEffect(() => {
    if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
    try { if (t === 'auto') localStorage.removeItem('tcs-theme'); else localStorage.setItem('tcs-theme', t); } catch { /* ignore */ }
  }, [t]);
  const next = t === 'auto' ? 'dark' : t === 'dark' ? 'light' : 'auto';
  const icon = t === 'dark' ? '☾' : t === 'light' ? '☀' : '◐';
  return <button className="themebtn" onClick={() => setT(next)} title={`Theme: ${t} (switch to ${next})`} aria-label={`Theme: ${t}`}>{icon}</button>;
}

export function App() {
  const route = useHash();
  const { data: health } = useApi<Health>('/health');
  const online = useSocketState();
  const toasts = useToasts();
  const [view, a, b] = route;

  return (
    <>
      <header className="top">
        <a className="brand" href="#/">
          <span className="estop" aria-hidden="true" />
          <span className="wm">Trust Course<small>Studio</small></span>
        </a>
        <nav>
          <a href="#/" className={!view ? 'on' : ''}>Courses</a>
          <a href="#/new" className={view === 'new' ? 'on' : ''}>New course</a>
          <a href="#/library" className={view === 'library' ? 'on' : ''}>Pattern library</a>
        </nav>
        <span className="spacer" />
        {health && (health.mode === 'mock'
          ? <span className="pill mock" title="No API key found. Agents replay the kit's CISSP examples; the automated suites are real, judged scores are fixtures."><i />Mock agents</span>
          : <span className="pill live" title={Object.entries(health.models).map(([k, v]) => `${k}: ${v}`).join('\n')}><i />Agent SDK</span>)}
        {!online && <span className="pill" title="Reconnecting to the orchestrator">Offline</span>}
        <ThemeButton />
      </header>
      <main>
        {!view && <Home health={health} />}
        {view === 'new' && <NewCourse health={health} />}
        {view === 'library' && <Library />}
        {view === 'run' && a && <RunView id={a} tab={b} health={health} />}
      </main>
      <div className="toasts" aria-live="polite">{toasts.map(t => <div key={t.id} className={'toast' + (t.err ? ' err' : '')}>{t.text}</div>)}</div>
    </>
  );
}

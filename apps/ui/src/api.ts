// UI <-> orchestrator. Reads and uploads over REST; stage events in and gate decisions out over the
// WebSocket. No business logic lives here: the UI shows what the orchestrator reports.
import { useCallback, useEffect, useRef, useState } from 'react';

export type Status = 'pending' | 'running' | 'done' | 'blocked' | 'failed' | 'waiting' | 'interrupted' | 'changes';
export interface Stage { id: string; n: number; title: string; kind: 'auto' | 'gate' | 'loop'; gate: string | null; blurb: string; status: Status; detail?: string; waitingFor?: string; started?: string; ended?: string; since?: string }
export interface Ev { t: string; run: string; type: string; stage?: string; [k: string]: any }
export interface Lesson { id: string; title?: string; kind?: string; part?: number; device?: string; signature?: string; status: string; checks?: Record<string, string>; problems?: { check: string; text: string }[]; busy?: string; lx?: number; teaching?: number; panel?: number; minutes?: number; by?: string; error?: string }
export interface Agent { key: string; label: string; role: string; stage: string; model: string; effort?: string; mode: string; ids: string[]; started: string; ended?: string; status: string; tools: { tool: string; what: string; t: string }[]; cost?: number; seconds?: number; reply?: string; stop?: string }
export interface Snapshot {
  id: string; meta: any; mode: 'mock' | 'sdk'; running: boolean; stages: Stage[]; classify: any; cases: any[] | null; design: any; designMd: string | null;
  config: any; factbase: any; exemplar: any; lessons: Lesson[]; order: string[]; suite: any; patterns: any; patternContract: any;
  review: any; taste: any; lx: any; lxAuto: any; panel: any; facts: Ev[]; diffs: any[]; publish: any; published: Ev | null; report: string | null;
  engineNeeds: any[]; agents: Agent[]; cost: number; human: { byGate: Record<string, number>; total: number }; gates: Record<string, Ev>; commits: any[]; log: Ev[];
}
export interface RunSummary { id: string; title: string; domain: string; created: string; lessons: number; done: number; total: number; current: { id: string; title: string; kind: string; status: Status; detail: string | null } | null; published: boolean; running: boolean; updated: string }
export interface Health { ok: boolean; mode: 'mock' | 'sdk'; models: Record<string, string>; concurrency: number; lan: string[]; catalogue: string; patterns: number }

export async function api<T = any>(path: string, opts: RequestInit & { json?: any } = {}): Promise<T> {
  const init: RequestInit = { ...opts };
  if (opts.json !== undefined) { init.method = init.method || 'POST'; init.body = JSON.stringify(opts.json); init.headers = { 'content-type': 'application/json' }; }
  const r = await fetch('/api' + path, init);
  const ct = r.headers.get('content-type') || '';
  const data = ct.includes('json') ? await r.json() : await r.text();
  if (!r.ok) throw new Error((data as any)?.error || String(data).slice(0, 200) || r.statusText);
  return data as T;
}

export const fileUrl = (run: string, rel: string) => `/api/runs/${run}/file?path=${encodeURIComponent(rel)}`;

// ---------------------------------------------------------------- socket
type Listener = (ev: Ev) => void;
class Socket {
  ws: WebSocket | null = null; listeners = new Set<Listener>(); pending = new Map<string, (r: any) => void>(); seq = 0; connected = false; onState = new Set<(c: boolean) => void>();
  constructor() { this.open(); }
  open() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/ws`);
    this.ws = ws;
    ws.onopen = () => { this.connected = true; this.onState.forEach(f => f(true)); };
    ws.onclose = () => { this.connected = false; this.onState.forEach(f => f(false)); setTimeout(() => this.open(), 1500); };
    ws.onmessage = m => {
      const d = JSON.parse(m.data);
      if (d.type === 'event') this.listeners.forEach(f => f(d.ev));
      if (d.type === 'ack') { const p = this.pending.get(d.id); if (p) { this.pending.delete(d.id); p(d); } }
    };
  }
  /** Send a command (gate decision, scope answers, pattern choice); falls back to REST if the socket is down. */
  async cmd(run: string, cmd: string, data: any = {}, arg?: string): Promise<any> {
    if (!this.connected || !this.ws) return api(`/runs/${run}/${cmd}${arg ? '/' + encodeURIComponent(arg) : ''}`, { json: data });
    const id = String(++this.seq);
    const res: any = await new Promise(resolve => { this.pending.set(id, resolve); this.ws!.send(JSON.stringify({ id, run, cmd, data, arg })); });
    if (!res.ok) throw new Error(res.error);
    return res.result;
  }
}
export const socket = new Socket();

export function useSocketState() {
  const [c, setC] = useState(socket.connected);
  useEffect(() => { socket.onState.add(setC); setC(socket.connected); return () => { socket.onState.delete(setC); }; }, []);
  return c;
}

export function useEvents(fn: Listener) {
  const ref = useRef(fn); ref.current = fn;
  useEffect(() => { const l = (e: Ev) => ref.current(e); socket.listeners.add(l); return () => { socket.listeners.delete(l); }; }, []);
}

/** The run snapshot, refreshed (debounced) whenever an event for this run arrives. */
export function useRun(id: string) {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<Ev[]>([]);
  const timer = useRef<number | null>(null);
  const load = useCallback(() => api<Snapshot>(`/runs/${id}`).then(s => { setSnap(s); setError(null); }, e => setError(e.message)), [id]);
  useEffect(() => { setSnap(null); load(); }, [load]);
  useEvents(ev => {
    if (ev.run !== id) return;
    setLive(l => [...l.slice(-60), ev]);
    if (timer.current) return;
    timer.current = window.setTimeout(() => { timer.current = null; load(); }, ev.type === 'agent.tool' ? 900 : 250);
  });
  return { snap, error, reload: load, live };
}

export function useApi<T>(path: string, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const reload = useCallback(() => { api<T>(path).then(setData, () => setData(null)); }, [path]);
  useEffect(reload, [reload, ...deps]);
  return { data, reload };
}

/** Human time at a gate: counted only while the gate view is visible and the person has interacted recently. */
export function usePresence(run: string, gate: string | null) {
  useEffect(() => {
    if (!gate) return;
    let last = Date.now(), active = Date.now();
    const poke = () => { active = Date.now(); };
    const evs = ['pointerdown', 'keydown', 'scroll', 'pointermove'];
    evs.forEach(e => window.addEventListener(e, poke, { passive: true }));
    const iv = window.setInterval(() => {
      const now = Date.now(); const dt = (now - last) / 1000; last = now;
      if (document.visibilityState === 'visible' && now - active < 60000) socket.cmd(run, 'presence', { gate, seconds: Math.min(dt, 120) }).catch(() => {});
    }, 15000);
    return () => { window.clearInterval(iv); evs.forEach(e => window.removeEventListener(e, poke)); };
  }, [run, gate]);
}

// ---------------------------------------------------------------- tiny router
export function useHash(): string[] {
  const [h, setH] = useState(location.hash);
  useEffect(() => { const f = () => setH(location.hash); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  return h.replace(/^#\/?/, '').split('/').filter(Boolean);
}
export const go = (path: string) => { location.hash = '#/' + path; };

// ---------------------------------------------------------------- toasts
type Toast = { id: number; text: string; err?: boolean };
const toastSubs = new Set<(t: Toast[]) => void>(); let toasts: Toast[] = []; let tid = 0;
export function toast(text: string, err = false) {
  const t = { id: ++tid, text, err }; toasts = [...toasts, t]; toastSubs.forEach(f => f(toasts));
  setTimeout(() => { toasts = toasts.filter(x => x.id !== t.id); toastSubs.forEach(f => f(toasts)); }, err ? 7000 : 3200);
}
export function useToasts() { const [t, setT] = useState(toasts); useEffect(() => { toastSubs.add(setT); return () => { toastSubs.delete(setT); }; }, []); return t; }

export async function act<T>(p: Promise<T>, ok?: string): Promise<T | undefined> {
  try { const r = await p; if (ok) toast(ok); return r; } catch (e: any) { toast(e.message || String(e), true); return undefined; }
}

export function ago(t?: string) {
  if (!t) return '';
  const s = (Date.now() - new Date(t).getTime()) / 1000;
  if (s < 60) return 'just now'; if (s < 3600) return Math.round(s / 60) + ' min ago'; if (s < 86400) return Math.round(s / 3600) + ' h ago';
  return new Date(t).toLocaleDateString();
}
export const mins = (s: number) => s < 60 ? `${Math.round(s)} s` : s < 3600 ? `${Math.round(s / 60)} min` : `${(s / 3600).toFixed(1)} h`;
export const f2 = (x: any) => (x == null || isNaN(x) ? '–' : Number(x).toFixed(2));

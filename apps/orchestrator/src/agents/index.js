// Stage agents. The orchestrator is the only process that calls Claude. Every agent is a fresh
// Agent SDK session (no `resume` unless the stage continues the same agent on purpose, e.g. research
// pass 2), so review panels never share a context with the authors. The system prompt is the kit's
// brief, read from the run folder at call time: editing a brief changes the product without a code change.
import fs from 'node:fs';
import path from 'node:path';
import { settings } from '../config.js';
import { mockAgent } from './mock.js';

/** Paths each role may write (relative to the course root). Nobody writes engine/, eval/*.py, tools/ or build.py. */
const WRITE_RULES = {
  research: [/^src\//, /^studio\/research\//],
  design: [/^DESIGN\.md$/, /^course\.json$/, /^studio\/design\.json$/, /^eval\/LX\.md$/],
  exemplar: [/^lessons\//],
  author: [/^lessons\//, /^eval\/results\//, /^eval\/transcripts\//],
  review: [/^lessons\//, /^eval\/results\//],
  taste: [/^lessons\//, /^eval\/results\//],
  learner: [/^eval\/results\//],
  fixer: [/^lessons\//, /^eval\/results\//],
  factcheck: [/^lessons\//, /^eval\/results\//],
  panel: [/^eval\/results\//]
};
const PROTECTED = /(^|\s|\/|["'])(engine\/|eval\/[a-z_]+\.py|tools\/|build\.py|patterns\/)/;
const MUTATING = /(\bsed\s+-i|>\s*[^&\s]|\btee\b|\bmv\b|\bcp\b|\brm\b|\bpatch\b|\bgit\s+(checkout|reset|clean))/;

export function canWrite(role, rel, ids) {
  if (rel.startsWith('..') || path.isAbsolute(rel)) return false;
  const rules = WRITE_RULES[role] || [];
  if (!rules.some(r => r.test(rel))) return false;
  if (ids && rel.startsWith('lessons/')) return ids.includes(path.basename(rel, '.js'));
  return true;
}

export function bashAllowed(cmd) {
  return !(MUTATING.test(cmd) && PROTECTED.test(cmd));
}

function brief(run, name) {
  const f = run.p(name);
  return fs.existsSync(f) ? `\n\n----- ${name} (from the vendored kit) -----\n` + fs.readFileSync(f, 'utf8') : '';
}

const PREAMBLE = `You are a stage agent inside Trust Course Studio. The working directory is one course root built
from the Trust Course Kit v2. Follow the brief below exactly. Facts come only from src/. Write only the files
your role owns; the studio blocks writes to engine/, eval scripts, tools/, build.py and patterns/. Report
engine needs instead of working around the engine. Keep your final reply within the brief's word limit and,
when the stage asks for it, end with one fenced json block.`;

/**
 * @param run      Run
 * @param o.role   research|design|exemplar|author|review|taste|learner|fixer|factcheck|panel
 * @param o.label  unique, human-readable agent name (used in output file names)
 * @param o.briefs kit files to load as the system prompt
 * @param o.ids    lesson ids this agent may write
 * @param o.resume session id to continue (same agent, second pass)
 */
export async function runAgent(run, o) {
  const model = o.model || settings.models[o.role];
  const effort = o.effort || settings.effort[o.role];
  const started = Date.now();
  run.log('agent.started', { stage: o.stage, label: o.label, role: o.role, model, effort: effort || null, briefs: o.briefs || [], ids: o.ids || [], mode: settings.agents });
  let res;
  try {
    res = settings.agents === 'mock'
      ? await mockAgent(run, o)
      : await sdkAgent(run, { ...o, model, effort });
  } catch (e) {
    res = { ok: false, text: String(e?.message || e), cost: 0 };
  }
  run.log('agent.done', {
    stage: o.stage, label: o.label, role: o.role, ok: res.ok !== false, cost: res.cost || 0,
    tokens: res.tokens || null, seconds: Math.round((Date.now() - started) / 1000),
    reply: String(res.text || '').slice(0, 2400), stop: res.stop || null, session: res.session || null
  });
  return res;
}

export function lastJSON(text) {
  const blocks = [...String(text || '').matchAll(/```json\s*([\s\S]*?)```/g)];
  for (const b of blocks.reverse()) { try { return JSON.parse(b[1]); } catch { /* next */ } }
  return null;
}

async function sdkAgent(run, o) {
  const { query } = await import('@anthropic-ai/claude-agent-sdk');
  const system = PREAMBLE + (o.briefs || []).map(b => brief(run, b)).join('') + (o.system ? '\n\n' + o.system : '');
  const abort = new AbortController();
  const canUseTool = async (tool, input) => {
    if (['Write', 'Edit', 'MultiEdit', 'NotebookEdit'].includes(tool)) {
      const rel = path.relative(run.dir, path.resolve(run.dir, input.file_path || input.notebook_path || ''));
      if (!canWrite(o.role, rel, o.ids)) return { behavior: 'deny', message: `The ${o.role} role may not write ${rel}. Lesson data only; report engine needs instead.` };
    }
    if (tool === 'Bash' && !bashAllowed(String(input.command || ''))) {
      return { behavior: 'deny', message: 'That command would change engine/, eval scripts, tools/ or build.py. One hand on the engine: report the need instead.' };
    }
    return { behavior: 'allow', updatedInput: input };
  };
  const options = {
    cwd: run.dir,
    model: o.model,
    systemPrompt: system,
    settingSources: [],
    allowedTools: ['Read', 'Glob', 'Grep', 'Bash', 'Write', 'Edit', ...(o.role === 'research' ? ['WebSearch', 'WebFetch'] : [])],
    disallowedTools: ['Task', 'Agent'],
    canUseTool,
    permissionMode: 'default',
    maxTurns: o.maxTurns || 120,
    abortController: abort,
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' }
  };
  if (o.effort) options.effort = o.effort;
  if (o.resume) options.resume = o.resume;
  let text = '', cost = 0, tokens = null, session = null, stop = null, lastTool = 0;
  for await (const m of query({ prompt: o.prompt, options })) {
    if (m.type === 'system' && m.subtype === 'init') session = m.session_id;
    if (m.type === 'assistant') {
      for (const c of m.message?.content || []) {
        if (c.type === 'text') text = c.text;
        if (c.type === 'tool_use' && Date.now() - lastTool > 1500) {
          lastTool = Date.now();
          run.log('agent.tool', { stage: o.stage, label: o.label, tool: c.name, what: summarise(c) });
        }
      }
    }
    if (m.type === 'result') {
      cost = m.total_cost_usd || 0; tokens = m.usage || null; stop = m.subtype;
      if (m.subtype === 'success' && m.result) text = m.result;
      if (m.subtype !== 'success') {
        // Report refusals and limits by name rather than as a generic failure.
        text = `${m.subtype}${m.errors ? ': ' + m.errors.join('; ') : ''}\n${text}`;
      }
    }
  }
  return { ok: stop === 'success', text, cost, tokens, session, stop };
}

function summarise(c) {
  const i = c.input || {};
  if (i.file_path) return path.basename(String(i.file_path));
  if (i.command) return String(i.command).slice(0, 90);
  if (i.pattern) return String(i.pattern).slice(0, 60);
  if (i.query) return String(i.query).slice(0, 60);
  if (i.url) return String(i.url).slice(0, 80);
  return '';
}

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { activate, hasVenv } from '../../../scripts/venv.mjs';

/** Python for the eval worker and every kit script: the repo's .venv when it exists (see scripts/venv.mjs). */
export const PYTHON = activate();
export const VENV_ACTIVE = hasVenv();

export const STUDIO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const KIT = path.join(STUDIO, 'vendor/kit');
export const PATCH = path.join(STUDIO, 'vendor/patches/pattern-block.diff');
export const PATTERNS = path.join(STUDIO, 'vendor/patterns');
export const RUNS = process.env.STUDIO_RUNS ? path.resolve(process.env.STUDIO_RUNS) : path.join(STUDIO, 'runs');
export const UI_DIST = path.join(STUDIO, 'apps/ui/dist');
export const WORKER = path.join(STUDIO, 'workers/evals/evals.py');
export const FIXTURES = path.join(STUDIO, 'apps/orchestrator/fixtures');

const OPUS = 'claude-opus-5-5';
const SONNET = 'claude-sonnet-5-5';

/** Defaults from the PRD: Opus for design, the exemplar and every review panel; Sonnet for authors,
 *  fixers and simulated learners. Override any of them in studio.config.json at the repo root. */
const DEFAULTS = {
  agents: null, // 'sdk' | 'mock'; null = sdk when credentials exist, else mock
  port: 4317,
  host: '127.0.0.1',
  concurrency: 6,
  lessonsPerAgent: 5,
  maxLearnerRounds: 3,
  plateau: 0.05,
  exemplarAttempts: 3,
  urlCheck: 'block', // 'block' | 'warn'
  publishCommand: null, // optional shell command; gets DIST and REPORT env vars, prints the artifact URL
  models: {
    research: OPUS, design: OPUS, exemplar: OPUS, author: SONNET, review: OPUS, taste: OPUS,
    learner: SONNET, fixer: SONNET, factcheck: OPUS, panel: OPUS
  },
  effort: { exemplar: 'max', design: 'high', review: 'high', factcheck: 'high' }
};

function load() {
  const p = path.join(STUDIO, 'studio.config.json');
  const user = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
  const s = { ...DEFAULTS, ...user, models: { ...DEFAULTS.models, ...(user.models || {}) }, effort: { ...DEFAULTS.effort, ...(user.effort || {}) } };
  if (process.env.STUDIO_AGENTS) s.agents = process.env.STUDIO_AGENTS;
  if (!s.agents) s.agents = (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_CODE_OAUTH_TOKEN) ? 'sdk' : 'mock';
  if (process.env.PORT) s.port = Number(process.env.PORT);
  if (process.env.HOST) s.host = process.env.HOST;
  if (process.env.STUDIO_CONCURRENCY) s.concurrency = Number(process.env.STUDIO_CONCURRENCY);
  if (process.env.STUDIO_LESSONS_PER_AGENT) s.lessonsPerAgent = Number(process.env.STUDIO_LESSONS_PER_AGENT);
  if (process.env.STUDIO_URL_CHECK) s.urlCheck = process.env.STUDIO_URL_CHECK;
  return s;
}

export const settings = load();

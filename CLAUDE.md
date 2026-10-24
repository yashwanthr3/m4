# Trust Course Studio

Turns an author's source material into a published, evaluated interactive trust course. Claude does the
authoring; humans do the taste and fact gates. Productises the trust-course-builder method (Trust Course
Kit v2) and the trust-pattern-builder library. The product spec is PRD.md.

## Run, test, extend

```
npm run setup                    # once: npm install + .venv (requirements.txt) + Chromium; node 22+, python 3.9+
npm start                        # builds the UI, serves the studio on http://127.0.0.1:4317
HOST=0.0.0.0 npm start           # also reachable from a phone on the LAN (QR codes appear at the gates)
npm run dev                      # orchestrator with --watch + Vite on :5173 (proxies /api, /ws, /fonts)
npm test                         # everything; tests/parity.test.js and tests/pipeline.test.js are slow (minutes)
node --test tests/units.test.js  # fast
npm run vendor:check             # vendored kit + catalogue are byte-for-byte; the patch applies
```

Agents: `ANTHROPIC_API_KEY` (or `CLAUDE_CODE_OAUTH_TOKEN`) in the orchestrator's environment switches
to the Agent SDK. Without one the studio runs **mock agents** that replay the kit's CISSP pilot
(`examples/cissp`) so the pipeline, the real evals, the gates and the UI can be exercised. Mock judged
scores are fixtures and are labelled as such everywhere. Copy `studio.config.example.json` to
`studio.config.json` to change models, effort, concurrency or the publish command.

## Layout

```
apps/ui/                 Vite + React + TypeScript, built to ONE html file (vite-plugin-singlefile)
apps/orchestrator/src/   server.js (HTTP + WebSocket), pipeline.js (runner, gates, resume), run.js (the
                         course folder, events.jsonl, git), stages/ (one file per group of stages),
                         agents/ (Agent SDK + mock), patterns/ (select, embed), scores.js, report.js, state.js
workers/evals/evals.py   thin Python CLI over vendor/kit/eval and tools; JSON in, JSON out; never calls Claude
vendor/kit/              Trust Course Kit v2, byte-for-byte from the artifact
vendor/patches/          pattern-block.diff: the one engine change, applied when a run folder is created
vendor/patterns/         catalogue.json, pages/<n>.html, themes.mjs (derive). Currently a SAMPLE (901-906)
runs/<course-id>/        one course folder per run (gitignored), itself a git repo
tests/                   parity, units, pipeline (gates, pattern slot, crash + resume, publish), pattern_block.py
```

## Python

All Python (the eval worker, the kit's scripts, agents' Bash commands) runs from `.venv`.
`scripts/venv.mjs` `activate()` puts `.venv/bin` first on PATH and is called by the orchestrator's
config and by tests/helpers.mjs, so nested `python3` calls resolve to the venv without activating it.
Add Python dependencies to requirements.txt, never with a system-wide pip.

## Rules for working on this repo

- **Never edit vendor/kit or vendor/patterns by hand.** Re-vendor with `scripts/vendor.mjs diff ... --apply`,
  then `npm run vendor:lock`. The kit's Python stays Python; port nothing.
- **The engine change is a patch.** Edit `vendor/patches/pattern-block.diff` (regenerate it with `diff -ruN`
  against a pristine copy) and keep its PATTERN_MAP equal to `vendor/patterns/themes.mjs` (a unit test checks).
- **Briefs are product.** Stage agents' system prompts are the kit's briefs read from the run folder at call
  time; change behaviour by changing a brief, not code, where you can.
- **The orchestrator is the only process that calls Claude.** The eval worker never does; the UI never holds a key.
- **The course folder is the run state.** Every stage writes there; `studio/events.jsonl` is append-only;
  gate approvals are commits; snapshots are tags. Resume replays the log. No database.
- **No business logic in the UI.** It shows what the orchestrator reports and sends decisions back.
- **Hard gates stay hard.** Do not add overrides for the automated suite, the quote check, or unresolved
  invented claims. A NOTES link the machine cannot reach may be confirmed by a named person (logged); a
  link that returns an error may not.

## Re-vendoring

- Kit: Artifact `read` on https://claude.ai/artifact/6TB7XC6W94mhd6kkMQ8i6j with every path, `out_dir`
  a fresh folder; `node scripts/vendor.mjs diff kit <folder>`; review; `--apply`; `npm run vendor:lock`;
  `node --test tests/parity.test.js`. If the patch no longer applies, the lead rebases it.
- Patterns: see vendor/patterns/README.md. The real 135-pattern catalogue lives in the Course Builder
  project doc `claude/trust-pattern-builder-SKILL.md`.

## Product principles (verbatim from PRD.md)

1.  **Taste is derived from the material.** The question framework, what
    "stop" means, the ladder of parts and each lesson's device come
    from the source. The studio never ships a default framework; it
    derives one and shows its citations.

2.  **Experience before explanation.** The learner commits by step 1 and
    the mechanic makes them commit the real people's error. This is the
    test for whether a library pattern fits a step: it must make the
    learner act, not read.

3.  **Every fact traced, and re-traced after every edit.** Numbers and
    quotations must be in the fact base. Each of the four edit rounds in
    the v2 build introduced new invented claims (92, 60, 25, 24), so the
    fact re-check on the diff is a hard gate, never an option.

4.  **Explain, never assert.** Every term defined on screen before it is
    needed; written for a second-language reader. This moved learner
    scores more than any visual change.

5.  **Patterns are mechanics, lessons are cases.** A pattern carries an
    invented scene and a practised gesture; a lesson carries a real
    record. A pattern may stand in for a kit block in a step marked
    imagined:true (transfer, drill, checkpoint practice); it never
    carries the reveal, the stop chain or the toolkit answer.

6.  **One hand on the engine.** Authors, critics and fixers edit lesson
    data; the studio edits nothing in engine/ or in a pattern's
    adapter. Engine needs become issues for the lead.

7.  **Measure, don't assert.** Every score in the studio is labelled
    with what produced it (an automated check, a model panel, a
    simulated learner) and simulated learners are never called real
    ones.

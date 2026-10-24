# Trust Course Studio

A local-first studio that turns a trust practitioner's own source material (a policy set, a standard,
incident reports, a training deck) into a published, evaluated, Brilliant-style interactive course.
Claude does the authoring through the Agent SDK; you do the three things only a person should:

| Gate | You see | Nothing happens until you |
|---|---|---|
| **I · Design sign-off** | The derived question framework with citations, what "stop" means, the ladder, an editable lesson map, personas, config check | approve (or send it back with notes) |
| **II · Exemplar sign-off** | The lead-quality first lesson, captured phone-dark and desktop-light, playable live and on your phone | approve; no author starts before |
| **III · Publish** | The built course, a report that labels every score by what produced it, pattern provenance | approve; refused while any check fails or any invented claim is unresolved |

Between the gates the studio runs the kit's method unattended: fact base (quotes verbatim, links
resolve), parallel authors, the four automated suites as a hard gate, a fresh teaching review, one taste
round, and up to three simulated-learner rounds, with a fact re-check on the diff of every edit round.
Library patterns can stand in for kit blocks on imagined steps only, previewed in the lesson skin.

## Quick start

```
npm install
pip install --break-system-packages playwright==1.63.0 pillow python-pptx pypdf   # Chromium must match
export ANTHROPIC_API_KEY=...        # omit to explore with mock agents (fixture lessons, real checks)
npm start                           # http://127.0.0.1:4317
```

Choose **New course**, drop in your files (or use the bundled CISSP sample), and follow the chain.

See CLAUDE.md for the architecture and the rules for extending it, and PRD.md for the spec.

## Status against the PRD phases

| Phase | State |
|---|---|
| S1 Foundations | Done: vendoring + lock + diff script, eval worker CLI, kit smoke on examples/cissp (pristine and patched), run folder + git + resume |
| S2 Intake to design | Done: PDF/DOCX/PPTX/MD/folder conversion, case-rich vs concept-only, domain mismatch, one question set, research agents, quote check, URL check, DESIGN.md + design.json, config check, gate 1 with inline edits |
| S3 Exemplar and authoring | Done: exemplar at max effort with fix attempts, captures, gate 2, parallel authors, engine-needs collection, suite as a hard gate with fixer attempts |
| S4 Pattern slots | Done against a **sample** 6-pattern catalogue: pattern block patch, select/embed, in-skin preview, contract checks, provenance |
| S5 Review loops | Done: teaching review, taste round, learner loop with plateau stop, fixers, fact re-check on every diff |
| S6 Publish and proof | Built: build, package, report, build note, optional publish command. Not done: the PRD acceptance run on a full third-party-risk course with real agents |

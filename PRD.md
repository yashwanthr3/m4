# PRD: Trust Course Studio (Claude Code build)

Oct 24, 2026 · \@Yashwant

## Summary

Trust Course Studio lets a person who is not a prompt engineer turn
their own source material into a published, evaluated interactive trust
course, with Claude doing the authoring and humans doing the taste and
fact gates. It productises two things that today only work inside a
Claude chat with the lead driving: the trust-course-builder method
(Trust Course Kit v2, 11 stages, 4 eval suites) and the 135-pattern
interactive library built with trust-pattern-builder. A course lesson is
still a real case with traced facts; a library pattern is used wherever
a step needs a practised gesture rather than a fact, and never as a
substitute for the record.

**Build target for Claude Code:** a local-first app,
trust-course-studio, with a React front end and a Node orchestrator
built on the Claude Agent SDK, that vendors the Trust Course Kit v2 and
the pattern catalogue unchanged, runs the kit\'s Python evals in a
worker, and ships a course as the same single dist/index.html the kit
produces today. Done means a course built by someone other than the lead
passes every gate the five hand-built courses passed.

## Problem

Five courses exist (AI governance, cyber, data, resilience, privacy; 25
to 37 lessons each) and each one took a full Claude chat session with
the lead in the loop at every stage: fetching the kit, designing the
question framework, writing the exemplar, fanning out authors, running
Playwright suites, reading screenshots, and fact re-checking every edit
round. Nobody else can run it, and the method lives in a SKILL.md plus a
kit artifact rather than in a product.

The pattern library has the opposite problem. Its 135 mechanics are
validated, re-skinnable and mutually exclusive, and Pattern Studio can
now make more of them, but no course uses them: the kit\'s 20 block
types (choice, slider, tapfind, stop, runaway, vigil and so on) are the
only interactions a lesson can hold. Authors rebuild gestures by hand
that the library already has, and the two bodies of work do not
compound.

Cost of not solving it: the eight-course series and the
bring-your-own-content platform both depend on course creation that
other people can run. Without that, every course is a lead-time cost of
days and the platform thesis (trust functions seen as negative; learning
by doing drives engagement) cannot be tested with a client\'s own
material.

## Goals and non-goals

**Goals**

1.  A trust-domain author with no Claude Code access builds a 3-lesson
    pilot from their own source in under 2 hours wall-clock, and a full
    25-lesson course in under a working day, touching only the human
    gates.

2.  Every shipped lesson passes the kit\'s four automated suites
    (static_eval, e2e, taste_auto, overlap) and the fact re-check on
    every edit round; the studio cannot publish otherwise.

3.  Simulated-learner mean 4.0 or above and teaching review 4.3 or above
    on the first studio-built course, which is the bar the hand-built
    courses met (data governance: LX 4.15, teaching 4.76).

4.  At least 30% of interactive steps in a studio-built course use a
    library pattern where the design calls for a practised gesture, with
    zero pattern used in a step that needs a real fact from the record.

5.  The lead\'s manual effort per course falls from days to the three
    gates (design sign-off, exemplar sign-off, publish), measured as
    hours of human time logged by the studio.

**Non-goals (v1)**

-   Hosting, accounts, payments or an LMS. The output stays a single
    HTML file; selling it is a separate decision.

-   Generating new patterns. The studio consumes the catalogue; Pattern
    Studio makes patterns. One contract, two products.

-   Replacing the human gates with model judgement. The method\'s own
    finding is that every edit round invents facts; the gates stay.

-   Non-English courses. The kit\'s voice rules and the lx_auto
    grade-level checks are English-only today.

-   Editing the course engine per course. engine/ stays fixed; engine
    needs are raised as issues, as the kit requires.

## Users and user stories

Four roles, in priority order. In v1 the lead plays all four; the studio
is designed so the first two can be anyone.

**Author** (a trust practitioner with source material: a policy set, a
standard, incident reports, a training deck)

-   As an author, I want to drop in my source and get a lesson map with
    devices and cited cases to approve, so that I decide the shape
    before any tokens are spent on lessons.

-   As an author, I want the studio to tell me when my source is
    concept-only and offer real public incidents per concept (cited) or
    imagined scenes (labelled), so that I never ship an invented fact as
    a real one.

-   As an author, I want to see which library patterns the studio
    proposes for each lesson and why, with the alternative of a kit
    block, so that I can swap one without touching code.

-   As an author, I want a running build board and a draft I can open on
    my phone as soon as the exemplar passes, so that I can redirect
    early rather than at the end.

**Reviewer** (a second person who owns the fact and taste gates)

-   As a reviewer, I want every number and quotation in a lesson linked
    to its line in the fact base, so that I check sources, not prose.

-   As a reviewer, I want the diff of learner-visible text since the
    last approved snapshot, so that I re-check only what an edit round
    added.

-   As a reviewer, I want the simulated-learner and teaching scores per
    lesson before and after each fix round, so that I can stop a round
    that is adding fact risk without lifting scores.

**Pattern designer** (owns the library, today via Pattern Studio)

-   As a pattern designer, I want to see which patterns the studio uses
    and in which lessons, so that gaps in the catalogue show up as
    course needs rather than guesses.

**Learner** (the person taking the course; never a studio user)

-   As a learner, I want a pattern inside a lesson to look and behave
    like the rest of the lesson on my phone, so that the course feels
    like one thing.

-   As a learner, I want nothing I type or do in a pattern to leave the
    page, so that practising a mistake is safe.

## Product principles

These come from the two skills and the five builds. They are constraints
on the product, not aspirations, and each one maps to a gate or a rule
in the requirements.

1.  **Taste is derived from the material.** The question framework, what
    \"stop\" means, the ladder of parts and each lesson\'s device come
    from the source. The studio never ships a default framework; it
    derives one and shows its citations.

2.  **Experience before explanation.** The learner commits by step 1 and
    the mechanic makes them commit the real people\'s error. This is the
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
    data; the studio edits nothing in engine/ or in a pattern\'s
    adapter. Engine needs become issues for the lead.

7.  **Measure, don\'t assert.** Every score in the studio is labelled
    with what produced it (an automated check, a model panel, a
    simulated learner) and simulated learners are never called real
    ones.

## The pipeline the studio exposes

![course creation pipeline · 12 stages, 3 human gates, 1
loop](docs/media/image1.png)

course creation pipeline · 12 stages, 3 human gates, 1 loop

The twelve stages are the kit\'s eleven plus a split of the learner loop
into learners, fixers and fact re-check. The studio runs the unattended
stages itself and stops at the three tinted gates; the loop at the
bottom runs at most three rounds, because the data-governance build
showed scores plateau at about 4.1 after round three while every extra
round adds fact risk.

Where library patterns enter: at **Author lessons**, the studio reads
each lesson\'s device from DESIGN.md and, for every step marked
imagined:true, offers a pattern whose learns line and gesture match the
step\'s purpose, ranked by the same similarity formula Pattern Studio
uses for exclusivity. The author sees the pattern playing inside the
lesson skin before accepting it. A step that carries the record (reveal,
stop chain, toolkit) is never offered a pattern.

## Requirements

**P0: the studio cannot ship without these**

1.  **Source intake and scope check.** Accepts PDF, DOCX, Markdown, PPTX
    and a folder of incident reports; converts to Markdown; classifies
    the source as case-rich or concept-only; flags a mismatch between
    the stated domain and the file. *Accept:* the CISSP deck is
    classified concept-only and the studio asks, in one question set,
    learner, scope (pilot of 3 to 5 or whole source) and cited incidents
    vs labelled scenes.

2.  **Fact base builder.** One src/\<id\>.md per lesson in the kit\'s
    SRC_FORMAT, with NOTES and CAUTIONS; for concept-only sources,
    research agents (one per 5 to 6 cases) verify facts against primary
    sources before writing. quote_check.py runs on every FROM THE SOURCE
    section. *Accept:* every quotation in src is found verbatim in the
    raw source; every URL in NOTES resolves.

3.  **Design stage with gate 1.** Produces DESIGN.md from the template:
    question framework (3 to 10, cited to cases), questionHints, what
    stop means, ladder, lesson map with device and 3 to 7 actor chain,
    exhibit inventory, learner personas. Shown to the author as a Docs
    artifact and the pipeline waits. *Accept:* config_check.py prints
    config OK; the author can edit any lesson\'s device or case before
    approving.

4.  **Exemplar with gate 2.** The lead-quality first lesson, written by
    the orchestrator at the highest effort setting, must pass
    static_eval, e2e, taste_auto, overlap and lx_auto targets, and the
    author sees phone-dark and desktop-light captures before approving.
    *Accept:* no fan-out call is made before gate 2 is approved.

5.  **Parallel authoring with pattern slots.** One author agent per 5 to
    6 lessons, each given AUTHOR_BRIEF, its ids and devices. Steps
    marked imagined:true may receive a library pattern (rules below).
    Engine needs are collected, not applied. *Accept:* every lesson file
    is one COURSE.lesson({\...}) call; a run with 25 lessons finishes
    authoring in under 40 minutes.

6.  **Automated suite as a hard gate.** tools/suite.sh, then lx_auto.py
    sets each lesson\'s minutes. *Accept:* a lesson with any static,
    e2e, taste or overlap failure cannot proceed to review; the board
    shows which check and which step.

7.  **Independent review, critic and learner loop.** Fresh agents (never
    the authors) for teaching review (bar: every dimension 4+, mean
    4.3+), one taste round, then up to three learner rounds with fixers.
    *Accept:* each round\'s before and after scores appear per lesson
    and per dimension; the loop stops itself when the mean moves less
    than 0.05 or quit points reach zero.

8.  **Fact re-check on every diff.** Snapshot before each edit round,
    diff_added.py, independent reviewers with FACT_RECHECK_BRIEF on
    every added line. *Accept:* a lesson with an unresolved invented
    claim cannot be published; the count of claims found per round is
    reported.

9.  **Publish with gate 3.** build.py produces dist/index.html; the
    studio publishes it as an artifact (or republishes to an existing
    URL), sends the source tar.gz, and writes a build-and-eval note to
    the Project. *Accept:* the note matches the format of the five
    existing build notes; the report names remaining soft spots
    concretely and labels simulated learners as simulated.

10. **Run state that survives a crash.** Every stage writes its outputs
    to the course folder; a restarted run resumes at the last completed
    stage. *Accept:* killing the orchestrator during authoring and
    restarting loses no approved gate and re-runs only unfinished
    lessons.

**Pattern-library integration rules (part of P0 item 5)**

-   A new kit block type pattern {id, n, prompt?, fb} embeds catalogue
    pattern n in a sandboxed iframe (sandbox=\"allow-scripts\", frame
    CSP default-src \'none\') with the course palette sent through the
    theme adapter ({type:\"trust-theme\", vars, theme, only}). The
    engine treats the pattern\'s Remember card or debrief message as the
    gate, so later blocks stay hidden until it fires. This is the one
    engine change in v1 and the lead makes it.

-   Eligibility: the step is imagined:true; the pattern\'s course
    matches the course domain or is mixed; the pattern\'s audience
    matches the course personas; the step\'s purpose (transfer, drill,
    checkpoint practice) matches the pattern\'s theme phase (yard or
    mirror for drills, briefing for plan steps, casebook for compare
    steps).

-   Exclusion: no pattern on a step that carries the reveal, the stop
    chain, the toolkit answer or any real number or quotation. A pattern
    never appears twice in a course. No pattern replaces the signature
    simulation DESIGN.md assigns a lesson.

-   Selection: the studio proposes at most two candidates per eligible
    step, ranked by the learns line and gesture against the step\'s
    intent using Pattern Studio\'s similarity formula, and shows each
    one playing inside the lesson skin. The author accepts, swaps or
    keeps the kit block.

-   Verification: an embedded pattern runs through the kit\'s e2e (phone
    and desktop), overlap O1-O4 and lx_auto like any block, plus the
    pattern\'s own autoplay on the right and wrong paths. Reading-load
    rules of the stricter of the two (course persona vs pattern
    audience) apply.

-   Provenance: report.md and the build note list every pattern used, by
    number, with its lesson and step, so the pattern designer sees
    demand.

**P1: ship soon after**

-   Author-facing diff viewer that links each added sentence to its
    fact-base line or marks it unsupported.

-   Blind pairwise comparison against an earlier version of the same
    course (pairs.py) when one exists.

-   Cost and time estimate before each gate, from measured token counts
    of the five builds.

-   Export of the course source folder as a git repository the author
    can hand to Claude Code for manual edits.

**P2: design for, do not build**

-   Client content slots: separating reusable mechanics from
    client-specific scenes so a B2B client\'s own process documents can
    fill a pattern\'s situation line.

-   Multi-course series management: shared spine questions across the
    eight-course series, managed thematically.

-   A hosted run service with accounts, so the Python eval worker no
    longer needs to run on the author\'s machine.

## Architecture and repo layout for Claude Code

Local-first, three processes, nothing hosted. The kit\'s evals need
Playwright, Pillow and Python, so unlike Pattern Studio this cannot be a
static page with a browser-side API key; the key lives in the
orchestrator\'s environment and never in the UI bundle or any output.

![studio architecture · 6 components, kit and catalogue vendored
unchanged](docs/media/image2.png)

studio architecture · 6 components, kit and catalogue vendored unchanged

**Decisions Claude Code should not revisit**

-   The Trust Course Kit v2 and the pattern catalogue are vendored
    byte-for-byte from their artifacts, with a script that re-fetches
    and diffs them. The kit\'s Python stays Python; port nothing.

-   The orchestrator is the only process that calls Claude. Stage agents
    are defined as Agent SDK subagents whose prompts are the kit\'s
    briefs (RESEARCH, AUTHOR, REVIEW, TASTE_CRITIC, LX_BRIEF, LX_FIX,
    FACT_RECHECK) loaded from the vendored files, so a brief edit
    changes the product without a code change.

-   Models per stage are configurable; defaults are Opus for design, the
    exemplar and all review panels, Sonnet for authors, fixers and
    simulated learners. Forced tool_choice is refused by Opus 5.5 and
    Sonnet 5.5; reuse Pattern Studio\'s api.js lessons (auto with nudge,
    thinking headroom, report refusal and max_tokens by name).

-   The course folder is the run state and is git-initialised; every
    gate approval is a commit, every snapshot for diff_added.py is a
    tag. Resume reads the log, not a database.

-   The single engine change (the pattern block) ships as a kit patch
    file applied at vendoring time, so the upstream kit stays clean
    until the lead merges it.

**Repo layout**

trust-course-studio/\
CLAUDE.md how to run, test and extend; the principles above, verbatim\
PRD.md this document, exported\
apps/ui/ Vite + React + TypeScript, built to one HTML file\
apps/orchestrator/ Node, Claude Agent SDK; stages/, gates/, patterns/,
resume/\
workers/evals/ thin Python CLI over vendor/kit/eval and tools; JSON in,
JSON out\
vendor/kit/ Trust Course Kit v2, unchanged + patches/pattern-block.diff\
vendor/patterns/ catalogue.json, pages 1-135, themes.js (derive)\
runs/\<course-id\>/ one course folder per run (gitignored)\
tests/ parity (vendored kit smoke on examples/cissp), e2e on the
demo-cyber source,\
pattern-block contract tests, resume tests

**Interfaces**

-   UI to orchestrator: a local WebSocket carrying stage events
    (stage.started, gate.waiting, lesson.check, round.scored) and gate
    decisions back. No business logic in the UI.

-   Orchestrator to evals: evals run \<suite\> \--course \<dir\> \--ids
    \<ids\> \--json, one call per stage; the worker never calls Claude.

-   Orchestrator to patterns: patterns.select(step, lessonDesign,
    personas) returns up to two {n, score, reason}; patterns.embed(n,
    palette) returns the iframe source and the adapter message.

## Quality gates and success metrics

The bars are the ones the hand-built courses met. The studio enforces
the hard gates itself and reports the judged ones; it never rounds a
judged score up to pass.

  -----------------------------------------------------------------------
  Gate             What runs             Bar                 Enforced by
  ---------------- --------------------- ------------------- ------------
  Config           config_check.py       config OK, every    studio
                                         copied-phrase       blocks
                                         warning reviewed    design
                                                             sign-off

  Facts in src     quote_check.py, URL   every quote         studio
                   resolution            verbatim, every     blocks
                                         NOTES URL resolves  authoring

  Automated suite  static_eval, e2e      0 fails per lesson  studio
                   (phone + desktop),                        blocks
                   taste_auto K1-K5,                         review
                   overlap O1-O4                             

  Reading load     lx_auto               0 undefined         studio
                                         acronyms, minutes   blocks
                                         set from est_min,   review
                                         grade level         
                                         reported            

  Pattern contract pattern autoplay      4 of 4 runs pass    studio
                   right + wrong path at                     blocks
                   1300 and 390 px,                          review
                   overlap in the lesson                     
                   skin                                      

  Teaching review  fresh agents, RUBRIC  every dimension 4+, reported;
                   J1-J8                 mean 4.3+           author
                                                             decides

  Taste            one critic round,     final mean          reported
                   TASTE T1-T10;         reported, no bar    
                   score-only final                          
                   panel                                     

  Learner          3 personas, LX L1-L7, lesson mean 4.0+, 0 reported;
  experience       explain-back per step quit points,        loop stops
                                         low-motivation      at plateau
                                         steps near 0        

  Fact re-check    diff_added.py +       0 unresolved        studio
                   FACT_RECHECK on every invented claims     blocks
                   edit round                                publish
  -----------------------------------------------------------------------

**Success metrics for the product itself**

Leading (first three studio-built courses):

-   Gate pass rate on first attempt per stage, target 80% or above for
    the automated suite after the exemplar is approved (v2 build data:
    92 then 60 invented claims in the first two rounds, so expect fact
    re-check to be the slowest gate).

-   Human time per course, logged at the gates, target under 4 hours for
    a 25-lesson course against days today.

-   Pattern uptake: share of eligible steps where the author accepted a
    proposed pattern, target 30% or above; share of accepted patterns
    surviving review unchanged, target 90% or above.

-   Wall-clock per 25-lesson course, target under 8 hours end to end
    including loops.

Lagging (first quarter of use):

-   A course built by someone other than the lead that meets every bar
    above.

-   Blind pairwise preference against the matching hand-built course,
    target no worse than 50%.

-   Catalogue gaps raised by the studio that Pattern Studio then fills,
    as a count.

## Open questions and phasing

**Open questions**

-   [ ] Blocking, lead: does the pattern block live in the kit engine
    (one engine change, as principle 6 wants) or as a sidecar loaded
    only when a course uses patterns? The kit says engine changes are
    the lead\'s; this is the first one the studio needs.

-   [ ] Blocking, lead: the exemplar is written by the lead today. In
    the studio, does the orchestrator write it at highest effort and the
    lead only approves, or does the lead still write it by hand for the
    first studio course?

-   [ ] Non-blocking, engineering: Agent SDK subagents vs plain Messages
    API calls for the review panels. The panels must be fresh contexts
    that never saw the authoring; confirm the SDK guarantees that.

-   [ ] Non-blocking, engineering: concurrency and cost. Five builds ran
    5 to 6 authors in parallel plus three review panels; measure tokens
    per lesson on the first studio course before setting a cap.

-   [ ] Non-blocking, design: how an author edits a lesson without
    touching JS. v1 offers edit-by-instruction (the author writes a
    note, a fixer applies it, fact re-check runs); a visual lesson
    editor is P2.

-   [ ] Non-blocking, legal: patterns must keep their invented people,
    .example domains and no-brand rule inside a course that cites real
    organisations. The pattern block must not inherit any real name from
    the lesson.

**Phasing (send a working build at the end of each)**

1.  **S1 Foundations.** Repo, vendoring with diff script, eval worker
    CLI, kit smoke test on examples/cissp passing, run folder + resume.
    Done: tools/suite.sh smoke green from the orchestrator.

2.  **S2 Intake to design.** Source conversion, scope check, fact-base
    agents, quote check, DESIGN.md generation, config check, gate 1 in
    the UI. Done: the CISSP deck reaches an approved DESIGN.md with no
    hand edits to files.

3.  **S3 Exemplar and authoring.** Exemplar at highest effort, gate 2
    with captures, parallel authors, engine-needs collection, automated
    suite as a gate. Done: a 3-lesson pilot passes all four suites.

4.  **S4 Pattern slots.** The pattern block patch, patterns.select and
    patterns.embed, author preview, pattern contract checks, provenance
    in the report. Done: the pilot ships at least one library pattern in
    an imagined:true step that passes e2e, overlap and autoplay.

5.  **S5 Review loops.** Teaching review, taste round, simulated
    learners, fixers, fact re-check on diffs, plateau stop, score
    reporting. Done: the pilot\'s scores match or beat the
    data-governance course\'s round-3 numbers.

6.  **S6 Publish and proof.** Build, artifact publish or republish,
    source tar.gz, build note to the Project, PRD acceptance run on a
    full course from the third-party-risk source. Done: a 25-lesson
    course built end to end by someone other than the lead passes every
    gate.

**Sources**

-   Trust Course Kit v2: [README and
    AUTHORING](https://claude.ai/artifact/6TB7XC6W94mhd6kkMQ8i6j)

-   Project docs: claude/pattern-studio-PRD.md,
    claude/pattern-studio-react-brief.md,
    claude/who-answered-for-the-data-build-note.md,
    claude/trust-pattern-builder-SKILL.md

-   Skills: trust-course-builder, trust-pattern-builder

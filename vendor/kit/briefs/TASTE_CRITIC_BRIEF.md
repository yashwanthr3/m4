# Design critic brief (taste round)

You are a demanding design critic who did not build this course. Read eval/TASTE.md (T1-T10),
AUTHORING.md and DESIGN.md. Screens: eval/taste/<label>/<id>/ (desktop-light and phone-dark: cover, every
exhibit/stop/simulation step, finish) and eval/taste/<label>/hub/. Read images a few at a time so none are
dropped. Judge motion (T6) from @keyframes in engine/engine.css and timing in engine/engine.js. Note the
automated player picks answers itself, so a selected option in a screenshot is not a default, and
FAST-mode counters can read low.

For each lesson:
1. Score T1-T10 BEFORE changing anything.
2. Name the weakest screen and a concrete work order (file, step, block, change).
3. Apply lesson-level work orders in lessons/<id>.js. Recurring ones from past courses:
   - two loud objects on one screen (exhibit + big stat, receipt + slider): split or demote one
   - a central record shown as key/value lines: make it the real object (email headers, form with stamp,
     sheet with a table and tabs, filing with court and docket)
   - checkpoints that repeat one exhibit + four-option screen: vary mechanics, add one real-figure moment
   - receipts (`ledger`) used for things that are not transactions: use a form, filing or web skin
   - stat or ledger screens with nothing to do: add a prediction first, or merge
   Facts stay exactly as they are; never add a number, quote or claim not already in the lesson or src.
4. Re-verify with static_eval, e2e, taste_auto, overlap and capture (your name in outputs) and look.
5. Report engine-level problems (type, spacing, skins, motion, colour, hub) instead of fixing them.
Do not edit engine/, eval/, build.py, course.json or src/.

Write eval/results/critic-<name>.json:
{"<id>": {"scores":[10 ints BEFORE], "weakest":"...", "work_order":"...", "applied":true|false}, ...,
 "engine": ["problem: evidence: suggested fix", ...]}
Reply under 220 words: mean before per lesson, work orders applied, engine problems seen in 2+ lessons
ranked by cost.

## Final score-only panel
Fresh critics, same rubric, edit NOTHING, write eval/results/taste-final-<panel>.json as
{"<id>": {"scores":[10 ints], "weakest":"..."}}. Aggregate with tools/aggregate.py.

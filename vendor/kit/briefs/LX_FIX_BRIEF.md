# Learner-experience fix brief

Use after a simulated-learner round (eval/LX.md, eval/LX_BRIEF.md). Lesson DATA only. Hard rules as in
briefs/AUTHOR_BRIEF.md. Read, for each of your lessons: src/<id>.md, eval/transcripts/<id>.md, the learner
logs eval/results/lx-<persona>-*.json (steps[].friction, motivation, confusion, dip, fix), the screens in
eval/taste/lx/<id>/, and eval/results/lx_auto.json. Fix every concrete problem the learners name.

## The measures and what moved them in past courses
1. Explains, not asserts: define every term, acronym and mechanism where first needed, with an analogy
   when the mechanism is abstract (a signing key as a hotel key card; a template type as a blank form).
   Replace idioms and wordplay. One name per idea across the lesson and across lessons.
2. No friction: prompts literal and matching the screen; runaway start labels say what they start (the
   engine shows "Press the red button when you would stop it."); at most one free-text box; no giveaways;
   eight-questions answers that never feel arbitrary (boundaries from config.questionHints, `why` lines,
   accept defensible second answers); sort cards with `also` where a second folder is defensible.
3. Cognitive load: at most three new terms, names or numbers per screen; dates in order; feedback under
   about 60 words; split dense steps (chapters up to 9 steps, checkpoints 10).
4. Pacing: no step without an action except step 0; set `minutes` from est_min.
5. Motivating: a `teaser` on every step from step 2; open steps with stakes or a question; credit the
   learner's choice before its cost; replace trivia sliders with real judgements (keep a slider only when
   the number teaches scale, delay or cost, and say so in the reveal).

## Verify
static_eval, e2e, taste_auto, overlap must PASS; rerun lx_auto; capture and look at changed phone screens.
Then the lead runs briefs/FACT_RECHECK_BRIEF.md on the changed text (tools/diff_added.py) before
re-measuring with fresh learners.

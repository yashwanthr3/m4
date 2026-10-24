# Independent teaching review brief

You did not write these lessons. Course root: the course folder you were given. Read AUTHORING.md, DESIGN.md,
eval/RUBRIC.md and this course's exemplar lesson first.

For each of your lessons:
1. Read the fact base (src/<id>.md, or for checkpoints and the closing every file listed for it in
   course.json "sources"), then lessons/<id>.js, then the screenshots in eval/taste/<label>/<id>/ (the latest capture) (phone-dark and
   desktop-light).
2. Score RUBRIC J1-J8 BEFORE changing anything. Record it.
3. Hunt invented claims FIRST. Check every sentence of feedback, sit, reveal, outcome, stop-node fb, finish
   text and exhibit field against src. Flag and fix: claims about what people felt, intended, noticed or
   assumed; "most people", "nobody", "always"; consequences or counterfactuals stated as fact ("would have
   prevented"), unless src says so; numbers or dates not in src; reconstructed exhibits missing a
   `paraphrase` note; invented scenes missing `imagined:true`; CAUTIONS in src that the lesson breaks.
   Counterfactuals are fine when framed as the course's judgement ("a second check could have shown...").
4. Then teaching fixes: weak feedback that only restates right or wrong; a step with two thoughtful
   interactions; a sort followed by a memo repeating it; an echo `{{id}}` sentence that reads badly with a
   short, long or skipped answer; jargon a CISSP candidate would not know; takeaway not concrete.
5. Apply fixes to lessons/<id>.js only (lesson data). Re-verify:
   `python3 eval/static_eval.py <ids>` and `E2E_OUT=eval/results/e2e-<name>.json python3 eval/e2e.py <ids>`.
6. Score J1-J8 AFTER.

Write eval/results/review-<name>.json:
{"<id>": {"before":[8 ints], "after":[8 ints], "invented_claims_fixed": n, "fixes":["step3 b1: ...", ...]}, ...}

Bar: every dimension 4+, mean 4.3+. Be honest: if a lesson is below the bar after your fixes, say why.
Do not edit engine/, eval/ scripts, build.py, course.json, src/ or lessons not assigned to you. Never delete
shared folders. Report engine problems instead.

Reply under 200 words: per-lesson before/after means, count of invented claims fixed, anything still below
the bar, engine problems, doubts about src facts.

# Author brief

You write lesson DATA only: lessons/<id>.js for your ids. Replace <name> with your author name.

## Read first, in this order
1. AUTHORING.md (lesson spec, block reference, skins, hard rules, taste rules)
2. DESIGN.md (this course: framework and its boundaries, what "stop" means here, the lesson map with the
   device and mechanic for each of your lessons, risks)
3. course.json (config.questions and config.questionHints)
4. this course's exemplar lesson (written by the lead). Match its density, voice, structure.
5. examples/ch01-exemplar.js and examples/cissp/lessons/ch15.js (gold lessons from earlier courses).
   Match quality, not subject.
6. eval/RUBRIC.md, eval/TASTE.md and eval/LX.md (how reviewers, critics and simulated learners score you)
7. src/<id>.md for each lesson: the ONLY fact base. Obey its CAUTIONS. Checkpoints and the closing draw on
   several src files (course.json "sources").

## Hard rules
- Facts only from src. Every number and quotation is machine-checked. Reconstructed exhibits get
  `paraphrase:'<what is reconstructed>'`; invented practice scenes get `imagined:true`.
- No invented claims in feedback: never "most people", "nobody noticed", motives, feelings, or
  consequences src does not state. Counterfactuals only as the course's judgement ("a second check could
  have shown..."). This is the most common serious defect in every round.
- No em dashes, no filler, short sentences, literal words (a second-language reader reads every word
  literally: no idioms, no wordplay, one name per idea).
- Define every term, acronym and mechanism on screen BEFORE the learner must use it, never only in feedback.
- One thoughtful interaction per screen. A stop, runaway or vigil owns its step. At most three new terms,
  names or numbers per screen. At most one free-text box per lesson.
- Prompts match the screen literally (counts, singular/plural, "first/second" not "left/right").
- No giveaways: the answer is not printed two lines above the question, not a title line, not the longest
  option, not the only two-part option.
- Real-object skins (form, log, email, filing, file, sheet, popup, letter, call). Never `card` or `memo` for
  an object the record names. Red and yellow mean stop only. No inline styles.
- Stop chains: 3 to 7 links, at most 2 or 3 control links, `short` labels under ~11 characters when there
  are 6+ links. The attacker is never a control. `afterNote` must be true for this chain, or false.
- Toolkit: answers follow config.questionHints boundaries; add `why` lines for the 2 or 3 most tempting
  wrong picks; accept a defensible second answer as `answer:[primary, second]` with one line on which is
  primary. Prompt "Tap the question that fits best." Never "close second".
- Sorts: cards carry the detail needed to sort them; use `also:[j]` + `alsoWhy` for a defensible second
  folder; never print the key in the subtitle.
- Every step from step 2 has a `teaser` (under 7 words, factual hook for that step). Wrong-answer feedback
  credits the choice first, then shows its cost.
- Echo sentences: write `{{id}}.` yourself; check short, long and skipped answers.
- Set `minutes` to round(est_min) from `python3 eval/lx_auto.py`.
- Checkpoints: show each case as a skinned exhibit before asking; recall that tests memory; exam-style
  scenarios (FIRST/BEST/MOST) with four options of similar length, distractors that are real principles
  misapplied, a stated tiebreak labelled "the CISSP view" (or the domain's own doctrine) where used; vary
  mechanics (tapfind, sort, order, choice); one memorable real-figure moment from the part's cases.

## Verify (all must PASS; use your name in every output)
```
python3 eval/static_eval.py <ids>
E2E_OUT=eval/results/e2e-<name>.json python3 eval/e2e.py <ids>
TASTE_OUT=eval/results/taste-<name>.json python3 eval/taste_auto.py <ids>
OVERLAP_OUT=eval/results/ov-<name>.json python3 eval/overlap.py <ids>
python3 eval/lx_auto.py
python3 eval/capture.py --ids <ids> --label <name>   # then Read your phone-dark and desktop-light screens
```
Do not edit engine/, eval/, build.py, course.json, src/ or other authors' lessons. Never delete shared
folders. Report engine needs instead.

## Reply (under 250 words)
Per lesson: device, signature mechanic, eval status, self-scores J1-J8. Then engine needs and doubts
about src facts.

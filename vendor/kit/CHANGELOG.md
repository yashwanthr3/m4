# Changelog

## v2 (October 2026), from the 27-lesson CISSP course "Who owed due care"
Engine
- Chain connectors offset from node circles (no line through a number); dense chain class for 6-7 links.
- `sheet` skin; call skin reads "Call in progress"; bars print the value outside the track.
- Toolkit: `why` lines on tempting wrong picks; `answer:[primary, second]` for defensible seconds.
- Eight-questions dialog shows config.questionHints (the boundary between neighbouring questions).
- Sort cards: `also` + `alsoWhy` accept a second folder.
- Choices shuffle by default (`shuffle:false` opts out). Step `teaser` lines. "Need a hint" control.
- Runaway: stopHint, maxTone, endLabel, limitLabel. Up to 8 part colours. cpMark on checkpoints.
- Covers no longer show question numbers. Feedback max width 42.5em. Stamp displacement 1.4.
Evals
- eval/overlap.py (O1-O4), validated to fail on v1 chains and pass on v2.
- eval/lx_auto.py, eval/LX.md (L1-L7, personas, explain-back), eval/LX_BRIEF.md.
- static_eval knows the sheet skin.
Process
- briefs/ folder: research for concept-only sources, author, teaching review, design critic, LX fix,
  fact re-check on diffs, src format.
- tools: suite.sh, diff_added.py, quote_check.py, lx_compare.py.
- examples/cissp: four lessons and their src from the v2 build (two chapters, a checkpoint, the closing).
Measured on the reference build (simulated learners, not real ones)
- LX 3.96 -> 4.20; steps fully understood 79% -> 89%; low-motivation steps 40 -> 6; quit points 2 -> 0.
- Teaching review 4.33 -> 4.60; design panel 3.95 -> 4.15.

## v1
Engine, build, static_eval, e2e, taste_auto, capture, RUBRIC, TASTE, demo-cyber, exemplar.

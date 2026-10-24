# Trust Course Kit v2

Builds Brilliant-style interactive courses on governance and trust (AI, cyber security, data,
technology governance) from source material. One self-contained HTML file per course, with a phone-first
engine, real-object exhibits, stop chains, and a measured evaluation loop.

## Layout
```
build.py                 lessons/*.js + course.json + engine -> dist/index.html
engine/                  engine.js, engine.css (do not fork per course; report needs instead)
AUTHORING.md             lesson spec, block reference, skins, hard rules, taste rules
DESIGN.template.md       copy to DESIGN.md and fill before any lesson
briefs/                  RESEARCH, SRC_FORMAT, AUTHOR, REVIEW, TASTE_CRITIC, LX_FIX, FACT_RECHECK
eval/static_eval.py      facts F1-F4 (numbers, quotes, framing question), pedagogy, voice, design
eval/e2e.py              plays every lesson headless (phone + desktop), checks completion and console
eval/taste_auto.py       K1-K5 measured taste checks (type scale, density, contrast, motion, rhythm)
eval/overlap.py          O1-O4 visual collisions (text on text, text on graphic, line through circle, clipped)
eval/lx_auto.py          learner-experience proxies, est_min per lesson, transcripts for LX walks
eval/capture.py          screenshots per step (desktop-light, phone-dark) for critics and learners
eval/RUBRIC.md TASTE.md LX.md   J1-J8 teaching, T1-T10 design, L1-L7 learner experience (+ personas)
eval/LX_BRIEF.md         brief for simulated-learner agents (explain-back per step)
tools/suite.sh           static + 3 shards of e2e/taste/overlap
tools/diff_added.py      changed learner-visible text since a snapshot (feeds fact re-check)
tools/quote_check.py     verifies src quotes against the raw source
tools/lx_compare.py      compares simulated-learner rounds
tools/aggregate.py pairs.py config_check.py split_markdown.py
examples/                ch01-exemplar.js, config templates, demo-cyber/, cissp/ (4 lessons from v2 build)
```

## Quick start
```
mkdir mycourse && cp -r engine eval tools build.py AUTHORING.md mycourse/
cp DESIGN.template.md mycourse/DESIGN.md; cp examples/config.template.json mycourse/course.json
cd mycourse && mkdir lessons src
# fill DESIGN.md, course.json (questions, questionHints, parts, t), src/<id>.md, lessons/<id>.js
python3 tools/config_check.py
python3 eval/static_eval.py && python3 build.py
tools/suite.sh first                # e2e, taste_auto, overlap in parallel
python3 eval/lx_auto.py             # set each lesson's minutes from est_min
python3 eval/capture.py --label first   # long: run in the background
```
Try it on `examples/cissp` (copy its course.json, lessons and src into a scratch course root).

## The loop
research -> src fact base -> DESIGN.md -> exemplar by the lead -> parallel authors -> automated suite ->
independent teaching review -> design critic -> simulated learners (3 personas) -> fix -> fact re-check on
the diff -> re-measure -> score-only panel. Every edit round gets a fact re-check: each round in the
reference build introduced new invented numbers.

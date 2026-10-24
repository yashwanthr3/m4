# Authoring a lesson

The course turns each unit of the source material (a book chapter, a case file, an incident report,
a control in a standard) into a Brilliant-style interactive lesson. The learner does not read about
the failure; they live through it, make the call the real people made, see what happened, then
place the stop button themselves. The thought has to sit with them.

Read these first:
- `DESIGN.md` — this course's design: audience, voice, the question framework, the signature object and
  what "stop" means in this domain, the parts, and the device chosen for each lesson.
- `course.json` — the course config (question framework = `config.questions`, numbered from 1).
- `examples/ch01-exemplar.js` — the gold-standard lesson from the reference course. Match its quality,
  density and voice, not its subject.
- `src/<id>.md` — the source you are adapting, with its notes after `NOTES`.
- `eval/RUBRIC.md` (teaching) and `eval/TASTE.md` (design) — how independent reviewers will score you.

A lesson is one file, `lessons/<id>.js`, containing exactly one `COURSE.lesson({...})` call.
Plain JS object literal. Escape `'` inside single-quoted strings (or use the typographic ’).
HTML is allowed in text fields (`<p> <b> <i> <u> <br>`). Do not edit anything in `engine/`.

## The arc of a lesson (5 to 9 steps)

1. **Hook** (step 0). Title = the unit's title; lede = its framing question, verbatim if the source has one.
   One or two short paragraphs that set the scene in the unit's own narrative device.
2. **Put them in the seat** (step 1). The learner must make a call by step 1: predict, estimate,
   choose what they'd do, or try the thing. They act *before* they are told. Their answer should be one
   most people would really give.
3. **Experience the failure.** A mechanic that makes them feel the mechanism: they trust the confident
   answer, miss the red light, let the counter run, click past the clause, approve the plausible request.
   The best mechanics make the learner commit the same error the people in the story did, then show
   them, without shaming.
4. **Reveal** what really happened, with the source's real facts and quotations.
5. **Who could have stopped it?** A `stop` block over the real chain of people and decisions, with
   feedback on every wrong node explaining *why* that person wasn't placed to stop it. Then, on its own
   step, a `toolkit` block: which question of the course's framework does this case turn on?
6. **Transfer.** "Your turn": the source's own advice applied to the learner's life or work, or an
   imagined parallel (mark imagined steps `imagined:true`). Often a `fill`, `choice` or `sort`.
7. **Sit with it.** At least one `reflect` and a `sit` block that interpolates something the learner did
   earlier (`{{blockId}}`): their slider value, choice, sort score or written words.
8. **Finish** (auto-rendered from `finish`): takeaway (the source's concrete advice, close to its own
   words), echo of what they wrote, a last sit-with-it question, related cases, sources.

Mirror the unit's narrative device. If the source tells a case as a timeline, an obituary, a walking
route, a recipe, a performance review, a letter or a ledger, the lesson's interaction should *be* that
form. If the source is flat (a policy, a standard, an incident report), DESIGN.md assigns each lesson a
device drawn from the real artefacts of the domain (the change ticket, the phishing email, the audit
finding, the risk register row, the access review, the board minute). Set `device:` to its name.

## Hard rules (the static eval enforces these)

- **Facts: every number and every quotation must come from the source text or its notes.** Never invent
  a quote, statistic, date, name, URL, time of day, or a sentence a real person or organisation said.
  Paraphrased records get `paraphrase:true`; invented practice scenes get `imagined:true` on the step or
  block (exempt from the fact check, but plausible and clearly labelled).
- The fact check only catches numbers and quoted strings. **You must also avoid invented claims in
  feedback prose**: "most people did", "the release went out", "nobody noticed", motives, feelings, or
  consequences the source does not state. Independent reviewers found about 25 of these in the
  reference course's first draft; they are the most common serious defect.
- Quotation marks are only for real words found in the source.
- Voice: plain words, short sentences (average under 20 words). No em dashes. No filler ("genuinely,
  honestly, straightforward, delve, worth noting, great job, well done, correct!, wrong!, oops,
  awesome, journey"), no emoji.
- Every choice option and every wrong stop node needs feedback (40+ characters) that teaches something.
  Wrong answers are treated as the reasonable thing most people would do, then shown what it costs.
- At most 120 words in a `text` block and about 170 words of reading per step before the learner acts.
- 5 to 9 steps, 6+ interactive blocks, 4+ distinct interaction types, a call by step 1, and `stop`,
  `toolkit`, `reflect` present (chapters). `lesson.questions` lists the framework numbers trained; the
  `toolkit` answer must be one of them.
- `finish.sources`: `{label, url}` whose URLs appear in the source's NOTES.

## Lesson object

```js
COURSE.lesson({
  id:'ch07', kind:'chapter', part:2, num:7,          // kind: chapter | intro | checkpoint | closing
  title:'…', question:'…', device:'An obituary', minutes:9, questions:[7,3],
  cta:'Read the obituary',                             // label of the first Continue button
  steps:[ { eyebrow:'…', title:'…', lede:'…', imagined:false, blocks:[ … ] }, … ],
  finish:{ headline:'…', takeaway:'…', echo:['blockId'], sit:'…',
           elsewhere:[{when:'March 2018', text:'…'}], sources:[{label:'…', url:'https://…'}] }
});
```

Blocks inside a step appear one after another. **Every interactive block is a gate**: later blocks stay
hidden until it is completed. Put the reveal after the prediction.

## Step fields
`teaser` (optional, under 7 words): the hook shown in the bottom bar on the PREVIOUS step once it is complete ("Next · the 97 emails"). Defaults to this step's eyebrow without the "Exhibit n ·" prefix.

## Block reference

Static: `text {html}` · `sit {label?, html}` · `quote {text, cite}` (must be in the source) ·
`doc {skin, …, html, paraphrase?}` (an exhibit, see skins) · `compare {left:{skin,…}, right:{skin,…}}` ·
`ledger {tag, meta, total?, totalLabel?, prefix?, decimals?, rows:[[label,value],…,[label,value,'sum']]}`
(renders as a till receipt) · `stat {value, pre?, prefix?, suffix?, decimals?, label?, caption?}`
(`pre` = small qualifier such as "About" or "More than") · `waffle {total, hi, hiLabel, restLabel}` ·
`bars {items:[{label,value,hi?}], suffix?}` (a `%` suffix scales to 100).

Interactive (gates):
- `chat {skin, tag, meta, botName, messages:[{from:'you'|'bot'|'them'|'sys', name?, text}]}`
- `choice {id, prompt, options:[{text, correct?, fb, tone?}], reveal?, grid?, shuffle?}` (options with one `correct` answer are shuffled per block; `shuffle:false` keeps author order) (no `correct` = every
  option is a legitimate stance with its own feedback)
- `slider {id, prompt, min, max, step, start, unit?, unitOne?, prefix?, labels?, log?, answer?, tolerance?,
  answerLabel?, fbClose?, fbFar?, reveal?, lockLabel?}` (with `answer`, the true figure takes over the big
  numeral and the guess shrinks to "You said …")
- `tapfind {id, skin, prompt, segments:[{text, hit?, miss?, fb?, br?}], need?, fb}` (find the line)
- `stop {id, prompt?, hint?, need?, afterNote?, nodes:[{short, who, what?, stop?, fb, tone?}], fb?}`
  The signature mechanic. `afterNote:false` (or a custom line) when "none of this needed to happen" is
  untrue for the downstream links.
- `toolkit {id, prompt?, answer:[n], fb, fbWrong?, why?:{n:'…'}}` (pick the framework question; `why` gives a case-specific line for each plausible wrong pick, shown as "Why not question n?")
- `sort {id, prompt, buckets:[…], items:[{text, bucket, why, also?:[j], alsoWhy?}], fb}` (`also` lists other defensible folders: they count as right, and the feedback names the best fit) (renders as manila case folders)
- `order {id, prompt, items:[…correct order…], fb}`
- `reflect {id, prompt, placeholder?, button?, label?, fb?}`
- `fill {id, prompt, fields:[{label, placeholder}], fbBlank, fbFull, button?}`
- `rate {id, prompt, items:[…], scale?, fb}` (self-scoring; `{{id}}` = lowest-marked items)
- `cards {id, prompt, cards:[{front, back}], fb?}`
- `runaway {id, prompt, counter, unit, unitOne?, maxTone?, endLabel?, limitLabel?, rate, accel, max, okBelow, events?, limit?, outcomes:{early, late, max, limit?}}`
  (a process that speeds up; stop it by hand, then again with a limit set first; the engine shows "Press the red button when you would stop it." after start, override with `stopHint`)
- `vigil {id, prompt, rounds:[{label, wait:[min,max], ticker?}], window?, fb}` (watch the light)

Interpolation: `{{blockId}}` or `{{blockId.N}}` (field N of a `fill`, item N of a `rate`). Choice text
is inserted without its final full stop, so write the punctuation yourself: `You chose: {{move}}.`

## Checkpoint lessons

`kind:'checkpoint'`, `part:n`. Retrieval across the part's lessons (show the case as a skinned exhibit,
then ask) plus the part's exercises made interactive, keeping any discussion text as feedback. One
interaction per screen. Needs `reflect`. The engine draws the part's lessons as stop sockets.

## Visual language (the engine supplies it; you choose skins)

1. **Exhibits are the real objects.** Every `doc`, `tapfind`, `chat` and `compare` side declares the
   `skin` the *record* describes. Fill skin fields only with facts from the source.
2. **The stop button is the only loud object.** Red and safety-yellow mean stop and nothing else. You
   never colour anything (no inline styles or hex colours; the eval rejects them).
3. **The handover chain.** The first `stop` block is drawn on the cover (empty sockets) and the finish
   (stop dropped in, downstream links dying). Every node needs `short`: 1 to 3 words naming the actor
   (max 22 chars). Keep chains to 3 to 7 links.

Document skins: `web` (url, site, title; no url = no browser bar) · `email` (subject, from, to, date) ·
`letter` (date, title) · `notification` (app, time, title, day, clock) · `filing` (court, caption,
docket, title) · `recipe` · `obituary` (title, dek, masthead, dateline) · `dictionary` (headword, pron,
pos) · `terms` (section, title) · `search` (query, overview) · `popup` (title, buttons; checkboxes via
`<span class="box on"></span>`) · `log` · `file` (filename) · `sheet` (filename, meta, tabs:[{name, on?, hidden?}]; html may hold a <table>) · `form` (title, meta, stamp) · `memo` ·
`card` (last resort). Chat skins: `widget` (site chat) · `assistant` (AI app or agent) · `messenger`
(phone thread) · `call` (voice/video call) · `workspace` (work channel) · `script` (imagined dialogue).
No logos, brand colours or trademarked UI.

## Taste rules (what the critics marked down in the reference course)

- One loud thing per screen. A stop block, a runaway console or a vigil owns its step.
- Never put two interactions on one screen if either needs thought; split the step.
- Exhibit first, question second.
- Never leave a central object as a generic `card` or `memo` when the record names a real object.
- Do not follow a sort with a memo that repeats the same answers.
- A real, striking figure goes in a `stat`, `ledger` or `waffle`, not buried in prose. Only real figures.
- Button labels say what happens ("Show the ruling"), never "Submit".
- Check every `{{echo}}` sentence reads well with a short answer, a long answer and a skipped answer.

## Verify before you hand back

```
python3 eval/static_eval.py <ids>          # facts, teaching rules, voice, design rules
python3 eval/e2e.py <ids>                  # plays every lesson, phone dark + desktop light
python3 eval/taste_auto.py <ids>           # contrast, targets, measure, type scale, overflow
python3 eval/capture.py --ids <ids> --label mine   # then Read eval/taste/mine/<id>/*.png
```
Set `E2E_OUT=` / `TASTE_OUT=` to a file of your own when several authors run in parallel.

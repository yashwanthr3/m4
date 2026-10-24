# DESIGN.md — <course title>

Write this before any lesson. Every decision here must come from the source material, not from
taste in the abstract. Taste that is hard to copy is taste that could only belong to this material.

## 1. Material and audience
- Source: what it is (book, policy set, standard, incident reports, training deck), length, units.
- Facts base: where the sources and notes are (src/<id>.md). What is real record vs illustration.
- Learner: who they are, what they already know, what they must be able to do afterwards.
- Voice: the source's own register (sentence length, spelling, formality). Quote two sentences that set it.
- Fact-base strategy. Case-rich source (incident reports, rulings): each lesson is one case from it.
  Concept-only source (a training deck, a standard, a policy set): pair each concept with one real,
  publicly documented incident, researched with briefs/RESEARCH_BRIEF.md, and give each lesson a framing
  question that names the concept. Quote the source itself only from a verified "FROM THE SOURCE" section.
- Scope check: if the file does not match what was asked (a CISSP deck sent for an "AI governance"
  course), say so and ask before designing.

## 2. The question framework (config.questions)
The source's own diagnostic questions, numbered. If the source has a checklist, principles or a control
family, use its words. If it has none, derive 4 to 8 questions from what the cases repeatedly turn on,
and cite the cases that justify each. Never import an outside framework the source doesn't use.
Write config.questionHints: one line per question saying where it ends and its neighbour begins
("Q2 is who may act; Q5 is whether anyone checked after"). Learners called answers arbitrary until these
boundaries were on screen. Every toolkit answer in every lesson must follow them.

## 3. The signature object and what "stop" means here
- The one loud object (default: the emergency-stop button) and the ring text around it
  (config.ring, max 34 chars), phrased as the course's central question.
- What the learner places on the chain: stop (AI), check/verify (fraud, security), challenge (audit),
  pull (release), revoke (access), escalate (incident). Then set every chain phrase in config.t to match.
- The stamp words (found / checkpoint / closing / plain), 16 characters or fewer.

## 4. The ladder (config.parts)
How the parts escalate (the reference course: AI talks → judges → acts → ground shifts → taking it back).
Each part: name, one-word job for the ladder, one-line description. Start/closing parts are `special`.

## 5. Lesson map
| id | unit | real case / record | narrative device | the mechanic that makes the learner commit the error | stop chain (3–7 actors) | framework Qs |
|---|---|---|---|---|---|---|

Rules: a different device or mechanic for neighbouring lessons; one signature simulation (runaway,
vigil, tapfind on a real object…) per lesson; every lesson has a real chain of actors.

Titles follow "Case: hook" ("Target: The alert nobody escalated"). Checkpoints are exam-style
(FIRST/BEST/MOST, four options of similar length, a stated doctrine tiebreak) when the audience sits an exam.

## 6. Exhibit inventory
| id | object in the record | skin | fields available in the source |
|---|---|---|---|

## 7. Theme
Keep the engine palette unless the domain demands otherwise. Red and safety-yellow remain the stop
colours. Optional config.theme overrides (light/dark token maps). Part colours only if needed.

## 8. Learner personas (eval/LX.md)
Three simulated learners who walk every lesson, rewritten for this audience:
- the expert in a hurry, on a phone, who quits at friction;
- the newcomer from an adjacent role, who needs every mechanism explained;
- the careful second-language reader, who reads every word literally.
For each: role, what they already know (extend the acronym whitelist in eval/lx_auto.py), what makes them quit.

## 9. Risks to watch
Facts likely to be over-claimed, sensitive cases, places the source is thin, units that need an
imagined scene (label them), anything legal or regulatory where wording must stay exact.

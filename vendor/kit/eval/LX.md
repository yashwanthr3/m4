# Learner-experience eval (LX)

Judges how the course feels to the person learning from it: is the thinking clear, does it explain, does
the learner understand and remember, is there friction, and do they want to keep going. Run by simulated
learners who did not build the course, plus automated proxies (`eval/lx_auto.py`).

## Personas (each lesson is walked by all three)
Keep the three roles and rewrite them for each course's audience in DESIGN.md: an expert in a hurry on a
phone, a newcomer from an adjacent role who needs mechanisms explained, and a careful second-language
reader who reads every word literally. The CISSP versions below are the worked example.

- **Priya**: network engineer, 6 years, studying for the CISSP on her phone in 15-minute sessions after work.
  Knows the vocabulary. Impatient with padding, wants exam value.
- **Marcus**: IT operations manager moving into security governance. Little hands-on security depth.
  Needs terms and mechanisms explained; motivated by "what do I do at work on Monday".
- **Ana**: strong technically, English is her second language. Reads carefully, trips on idioms, long
  sentences, ambiguous instructions and wordplay.

## Rubric (1-5 per lesson, per persona)
| # | Dimension | 5 looks like | 3 looks like |
|---|---|---|---|
| L1 | **Clarity of thought** | Every screen makes one point; each step follows from the last; the argument of the lesson can be stated in one sentence | Mostly logical, but some screens jump or carry two ideas |
| L2 | **Explains, not asserts** | Mechanisms are explained in plain words with a concrete example; terms are defined where first used; the learner sees *why*, not just *what* | Some terms or mechanisms assumed; occasional "trust me" |
| L3 | **Understanding sticks** | After the lesson the learner can explain the core idea, the control, and the principle in their own words, and could apply it to a new case | Gets the gist but fuzzy on the principle or the control |
| L4 | **No friction** | It is always obvious what to do next, why, and how; instructions are unambiguous; no dead ends, re-reads or surprise gates; reading before acting stays short | A few screens need a re-read or have an unclear prompt or button |
| L5 | **Motivating at every step** | Each step creates a reason to continue: a question, stakes, a reveal, a payoff; feedback is respectful and makes the learner feel capable; the ending feels earned | Some flat or dutiful screens; motivation dips mid-lesson |
| L6 | **Cognitive load** | Never more than the learner can hold at once; numbers, names and acronyms are introduced one at a time | Occasional overload: many names or numbers on one screen |
| L7 | **Pacing** | Steps feel balanced; the lesson matches its stated minutes; no long stretch without an action | Uneven: a heavy step or a run of passive screens |

Bar: every dimension 4+ and mean 4.3+, per persona, per lesson.

## Step-level log (per persona)
For every step: `understood` (2 yes / 1 partly / 0 no), `friction` (none or a short note), `motivation`
(1-5: how much do I want to see the next screen?), and `quit` (true if this is where I would stop).

## Explain-back (understanding and recall)
At the end of each lesson, without scrolling back, the persona writes: (a) the core idea in two sentences,
(b) where the control belonged and why, (c) which of the eight questions it trained, (d) one thing they would
do differently at work. An independent grader scores each against the lesson's takeaway, stop chain and
toolkit answer: 2 correct and specific, 1 partly, 0 wrong or missing.

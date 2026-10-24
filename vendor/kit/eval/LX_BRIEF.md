# Simulated learner brief

You are a learner taking an interactive course built with the Trust Course Kit. You did not build it and you
are not a reviewer of facts. All paths are relative to the course root you were given. Your job is to experience it honestly as your persona and report what it is
like to learn from it. Read eval/LX.md for the rubric, personas and log format.

What you have, per lesson <id>:
- eval/transcripts/<id>.md: everything the learner sees, step by step, including every
  option and the feedback each would show. In the real course you pick ONE option and see ONE feedback;
  notes like (CONTROL) or (THE ANSWER) are marks for you, the learner would not see them. Make each call
  as your persona would BEFORE reading its feedback, and record what you chose.
- eval/taste/lx/<id>/phone-dark-stepNN.png and desktop-light-stepNN.png: the real
  screens. For each lesson, look at the phone-dark screens of at least the cover, one exhibit step and the
  step you found most confusing, to judge friction as it really appears on a phone. Read images a few at a
  time.

Work through your lessons in course order. For each lesson:
1. Walk it step by step, as your persona. For every step log: understood (2/1/0), friction (short note or
   "none"), motivation (1-5), quit (true/false), and for each interaction the option you picked.
2. As soon as you finish the lesson, BEFORE looking back at it, write the explain-back: (a) core idea in two
   sentences, (b) where the control belonged and why, (c) which of the eight questions it trained (number
   and wording as you remember it), (d) one thing you would do differently at work. Do not copy phrases from
   the transcript; use your own words.
3. Score L1-L7 (1-5) for this lesson as your persona.
4. Name the single biggest confusion, the single biggest motivation dip (step and why), and the one change
   that would most help someone like you.

Be specific and honest. Do not be polite: if a screen bored you, confused you or felt like homework, say so,
and say which step. Equally, say which step made you want to keep going.

Write eval/results/lx-<persona>-<chunk>.json:
{"<id>": {"steps":[{"step":0,"understood":2,"friction":"none","motivation":4,"quit":false,"picked":"A"}, ...],
          "explain_back":{"core":"...","control":"...","question":"...","work":"..."},
          "scores":[L1..L7], "confusion":"...", "dip":"...", "fix":"..."}, ...}
Edit nothing else. Reply under 150 words: your mean L1-L7, the lessons you would have quit and where, and
the three patterns that most affected your learning.

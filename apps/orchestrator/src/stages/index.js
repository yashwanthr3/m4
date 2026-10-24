// The twelve stages: the kit's method with three human gates and one loop.
import { intake } from './intake.js';
import { factbase } from './factbase.js';
import { design } from './design.js';
import { exemplar, author, suite } from './lessons.js';
import { review, taste, learnerLoop } from './rounds.js';

export const STAGES = [
  { id: 'intake', n: 1, title: 'Source & scope', kind: 'auto', run: intake, blurb: 'Convert, classify, check the domain, ask one question set.' },
  { id: 'factbase', n: 2, title: 'Fact base', kind: 'auto', run: factbase, blurb: 'One src file per lesson; quotes verbatim; every NOTES URL resolves.' },
  { id: 'design', n: 3, title: 'Design', kind: 'auto', run: design, blurb: 'Framework, what stop means, ladder, lesson map, personas.' },
  { id: 'gate-design', n: 4, title: 'Design sign-off', kind: 'gate', gate: 'design', blurb: 'You approve the shape before any lesson is written.' },
  { id: 'exemplar', n: 5, title: 'Exemplar', kind: 'auto', run: exemplar, blurb: 'The lead-quality first lesson, at the highest effort.' },
  { id: 'gate-exemplar', n: 6, title: 'Exemplar sign-off', kind: 'gate', gate: 'exemplar', blurb: 'No author starts until you approve the exemplar.' },
  { id: 'author', n: 7, title: 'Author lessons', kind: 'auto', run: author, blurb: 'Parallel authors; pattern slots proposed for imagined steps.' },
  { id: 'suite', n: 8, title: 'Automated suite', kind: 'auto', run: suite, blurb: 'static, e2e, taste, overlap, pattern contract. Hard gate.' },
  { id: 'review', n: 9, title: 'Teaching review', kind: 'auto', run: review, blurb: 'Fresh reviewers, J1-J8, then a fact re-check on the diff.' },
  { id: 'taste', n: 10, title: 'Taste round', kind: 'auto', run: taste, blurb: 'One critic round, T1-T10, then a fact re-check.' },
  { id: 'learners', n: 11, title: 'Learner loop', kind: 'loop', run: learnerLoop, blurb: 'Simulated learners → fixers → fact re-check, up to 3 rounds.' },
  { id: 'gate-publish', n: 12, title: 'Publish', kind: 'gate', gate: 'publish', blurb: 'Final panel, build, report. You publish.' }
];

export const GATES = { design: 'gate-design', exemplar: 'gate-exemplar', publish: 'gate-publish' };

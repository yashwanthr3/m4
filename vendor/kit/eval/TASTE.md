# Taste eval

Taste is judged three ways. None replaces the others.

## 1. Automated craft checks (`eval/taste_auto.py`, must pass)
Contrast (WCAG AA on real backgrounds, both themes), touch-target size, line length, type-scale
discipline, no sideways overflow. Plus static design rules in `static_eval.py` (D1 every exhibit has a
real-object skin, D2 every chain link has a human label, D3 no hand-coded colour).

## 2. Blind pairwise preference (v1 vs v2)
For each sampled screen, a reviewer sees two screenshots labelled X and Y in random order (one from v1,
one from v2; same lesson, same step, same theme) and answers, without knowing which is which:
- Which would you rather learn from? Which would you screenshot and send to a friend?
- Which could only belong to *this* book? Which could be any course?
Report win rate for v2 per criterion, and every case where v1 wins with the reason.

## 3. Taste rubric (independent design critic, 1 to 5)

| # | Dimension | 5 looks like | 3 looks like |
|---|---|---|---|
| T1 | **Ownable** | You could identify this course from one cropped screen with the logo removed: the stop button, the chain, the evidence objects | Competent but could be any learning product |
| T2 | **Coherent grammar** | Every lesson uses the same visual vocabulary in the same way; nothing feels bolted on | Mostly consistent, a few one-off treatments |
| T3 | **Material fidelity** | Each exhibit reads instantly as the real object (you know it's a court brief before reading a word) | Generic cards with labels |
| T4 | **Restraint** | One loud thing per screen; red and yellow mean stop and only stop; generous space | Several things compete |
| T5 | **Typographic craft** | Clear hierarchy, comfortable measure, numerals that sing, no orphaned fragments | Readable but flat |
| T6 | **Motion with meaning** | Animation encodes the idea (the stop drops into the socket, the downstream links die) and never delays reading | Decorative or absent |
| T7 | **Pacing & first frame** | Every screen's first glance tells you what to do; no dead or crowded screens | Some screens need a re-read |
| T8 | **Both themes** | Dark is designed, not inverted; paper stays paper | Dark mode works but is an afterthought |
| T9 | **Microcopy taste** | Labels and feedback are specific to the case, plain, never generic | Some generic labels |
| T10 | **The screenshot moment** | At least one moment per lesson people would share | Nothing memorable |

Bar: every dimension 4+, mean 4.3+, and v2 wins the blind comparison on "only this course" in at least 80% of pairs.
Output per lesson: scores, the single weakest screen, and the concrete fix (file, step, block, change).

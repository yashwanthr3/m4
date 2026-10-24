# Fact re-check brief (changed text only)

Lessons were just edited (a review, critic or learner-experience round). Your job is to make sure no edit
introduced a claim the record does not support. The lead first runs
`python3 tools/diff_added.py <snapshot_dir>/lessons` to write eval/results/diffs/<id>.added.txt.

For each of your lessons:
1. Read eval/results/diffs/<id>.added.txt (every added or changed line, as JSON lines of the lesson).
2. Read the fact base: src/<id>.md, or for checkpoints and the closing every file listed for it in
   course.json "sources".
3. Check every added sentence. Flag and fix in lessons/<id>.js:
   - claims about the case not in src: numbers, dates, names, causes, consequences, motives, feelings,
     "nobody", "most people", "always", counterfactuals stated as fact;
   - definitions of terms that are wrong or misleading (a definition may use general knowledge, but it must
     be accurate: e.g. what an SDK, an 8-K, misprision of felony, JNDI, a consent order actually are);
   - imagined scenes or reconstructed exhibits missing `imagined:true` or a `paraphrase` note;
   - CAUTIONS in src that the new text breaks;
   - "the CISSP view" (or other doctrine) tiebreaks that are not standard doctrine or not labelled as such;
   - exam-style scenarios whose "right" answer is not clearly right under the deck lines, or a distractor
     that is also defensible (fix the wording so one answer is best).
4. Do not rewrite for style. Change only what is wrong, minimally.
5. Re-verify: `python3 eval/static_eval.py <ids>` and `E2E_OUT=eval/results/e2e-<name>.json python3 eval/e2e.py <ids>`.

Write eval/results/factcheck-<name>.json: {"<id>": {"checked_lines": n, "fixed": [{"was":"...","now":"...","why":"..."}]}}
Do not edit engine/, eval/ scripts, build.py, course.json, src/ or other lessons. Reply under 150 words:
count of fixes per lesson and the most serious one.

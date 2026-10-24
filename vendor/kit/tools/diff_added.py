"""Write the added or changed learner-visible lines of each lesson since a snapshot.
python3 tools/diff_added.py <snapshot>/lessons   -> eval/results/diffs/<id>.added.txt
Feed these to fact re-check reviewers (briefs/FACT_RECHECK_BRIEF.md) after every edit round."""
import sys, os, glob, json, subprocess, difflib
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
snap = sys.argv[1]; out = os.path.join(ROOT, 'eval', 'results', 'diffs'); os.makedirs(out, exist_ok=True)
def flat(p):
    d = json.loads(subprocess.run(['node', os.path.join(ROOT, 'eval', 'dump.js'), p], capture_output=True, text=True).stdout or '{}')
    return json.dumps(list(d.values())[0] if d else {}, indent=1, ensure_ascii=False).split('\n')
for f in sorted(glob.glob(os.path.join(ROOT, 'lessons', '*.js'))):
    b = os.path.basename(f)[:-3]; old = os.path.join(snap, b + '.js')
    new = flat(f); prev = flat(old) if os.path.exists(old) else []
    added = [l for l in difflib.unified_diff(prev, new, lineterm='', n=0) if l.startswith('+') and not l.startswith('+++')]
    open(os.path.join(out, b + '.added.txt'), 'w').write('\n'.join(added)); print(b, len(added), end='  ')
print()

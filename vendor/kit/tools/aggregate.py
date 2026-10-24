"""Aggregate judge score files.  python3 tools/aggregate.py 'eval/results/taste-final-*.json' [--dims 10] [--bar 4.3]
Each file: {"<id>": {"scores":[...]} } or {"<id>": {"after":[...]}} / {"before":[...]}. Prints mean, min, items meeting the bar
(every dimension >= 4 and mean >= bar), per-dimension means, and the weakest items."""
import json, glob, sys, statistics as st
pat = sys.argv[1]; bar = float(sys.argv[sys.argv.index('--bar')+1]) if '--bar' in sys.argv else 4.3
R = {}
for f in glob.glob(pat): R.update(json.load(open(f)))
S = {k: (v.get('scores') or v.get('after') or v.get('before')) for k, v in R.items()}
m = {k: st.mean(v) for k, v in S.items()}
ok = [k for k, v in S.items() if min(v) >= 4 and st.mean(v) >= bar]
print(f'{len(S)} items | mean {st.mean(m.values()):.2f} | min {min(m.values()):.2f} | meet bar {len(ok)} | mean>=4.0 {sum(x>=4 for x in m.values())}')
n = len(next(iter(S.values())))
print('per dimension:', ' '.join(f'D{i+1}={st.mean(v[i] for v in S.values()):.2f}' for i in range(n)))
print('weakest:', ', '.join(f'{k} {m[k]:.1f}' for k in sorted(m, key=m.get)[:8]))

"""Compare simulated-learner rounds.  python3 tools/lx_compare.py eval/results/lx_round1 eval/results/lx_round2 [...]
Each folder holds lx-<persona>-<chunk>.json files (eval/LX_BRIEF.md). Prints L1-L7 means per round,
understood %, low-motivation steps, quit points, lessons at the bar, and the weakest lessons of the last round."""
import sys, json, glob, statistics as st, collections
dims = ['Clarity', 'Explains', 'Sticks', 'No friction', 'Motivating', 'Load', 'Pacing']
def load(d):
    R = collections.defaultdict(dict)
    for f in glob.glob(d.rstrip('/') + '/lx-*-[0-9].json'):
        p = f.split('lx-')[-1].split('-')[0]
        for k, v in json.load(open(f)).items(): R[k][p] = v
    return R
rounds = [(d, load(d)) for d in sys.argv[1:]]
def S(R):
    sc = [R[k][p]['scores'] for k in R for p in R[k]]; steps = [s for k in R for p in R[k] for s in R[k][p]['steps']]
    lm = {k: st.mean(st.mean(R[k][p]['scores']) for p in R[k]) for k in R}
    return dict(mean=st.mean(st.mean(s) for s in sc), dims=[st.mean(s[i] for s in sc) for i in range(7)],
                und=100 * sum(1 for s in steps if s.get('understood') == 2) / max(1, len(steps)),
                low=sum(1 for s in steps if s.get('motivation', 5) <= 2), quit=sum(1 for s in steps if s.get('quit')),
                bar=sum(1 for k in R for p in R[k] if min(R[k][p]['scores']) >= 4 and st.mean(R[k][p]['scores']) >= 4.3), lm=lm)
res = [(d, S(R)) for d, R in rounds]
print('round'.ljust(14) + ''.join(d.split('/')[-1][:10].rjust(11) for d, _ in res))
print('overall'.ljust(14) + ''.join(f"{s['mean']:11.2f}" for _, s in res))
for i, n in enumerate(dims): print(n.ljust(14) + ''.join(f"{s['dims'][i]:11.2f}" for _, s in res))
for k, lab in (('und', 'understood %'), ('low', 'mot<=2 steps'), ('quit', 'quit points'), ('bar', 'at bar')):
    print(lab.ljust(14) + ''.join(f"{s[k]:11.1f}" if isinstance(s[k], float) else str(s[k]).rjust(11) for _, s in res))
last = res[-1][1]['lm']; print('weakest last round:', ', '.join(f'{k} {v:.2f}' for k, v in sorted(last.items(), key=lambda x: x[1])[:8]))

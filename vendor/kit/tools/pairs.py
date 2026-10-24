"""Blind pairwise taste comparison between two captured versions.

python3 tools/pairs.py make  --a v1 --b v2 [--per-lesson 2]   -> eval/taste/pairs/<id>-<k>-X.png / -Y.png + eval/results/pairs_key.json
python3 tools/pairs.py score                                   -> reads eval/results/pairwise-*.json verdicts, prints win rates for version b
Verdict files: {"<id>-<k>": {"learn":"X|Y|tie","share":"X|Y|tie","ownable":"X|Y|tie","why":"..."}}
Judges must not open pairs_key.json or the version folders before writing verdicts.
"""
import os, sys, json, random, glob, argparse
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); T = os.path.join(ROOT, 'eval', 'taste')
ap = argparse.ArgumentParser(); ap.add_argument('cmd'); ap.add_argument('--a', default='v1'); ap.add_argument('--b', default='v2'); ap.add_argument('--per-lesson', type=int, default=2); ap.add_argument('--seed', type=int, default=1013)
a = ap.parse_args(); KEY = os.path.join(ROOT, 'eval', 'results', 'pairs_key.json')
if a.cmd == 'make':
    random.seed(a.seed); out = os.path.join(T, 'pairs'); os.makedirs(out, exist_ok=True); key = {}
    for lid in sorted(os.listdir(os.path.join(T, a.b))):
        pa, pb = os.path.join(T, a.a, lid), os.path.join(T, a.b, lid)
        if not os.path.isdir(pa): continue
        common = sorted(set(os.listdir(pa)) & set(os.listdir(pb)))
        steps = [f for f in common if 'step' in f]
        picks = ([f for f in steps if f.endswith('step00.png') and f.startswith('desktop')][:1] + [f for f in steps if f.startswith('phone') and not f.endswith('step00.png')][len(steps)//4:len(steps)//4+1])[:a.per_lesson]
        if lid == 'hub': picks = common
        for k, f in enumerate(picks):
            b_is_x = random.random() < .5; name = f'{lid}-{k}'; maxh = 1700 if f.startswith('desktop') else 2200
            for side, src in (('X', pb if b_is_x else pa), ('Y', pa if b_is_x else pb)):
                im = Image.open(os.path.join(src, f)); w, h = im.size; im.crop((0, 0, w, min(h, maxh))).save(os.path.join(out, f'{name}-{side}.png'))
            key[name] = {'X': a.b if b_is_x else a.a, 'screen': f}
    os.makedirs(os.path.dirname(KEY), exist_ok=True); json.dump(key, open(KEY, 'w'), indent=1); print(len(key), 'pairs')
else:
    key = json.load(open(KEY)); tot = {c: [0, 0, 0] for c in ('learn', 'share', 'ownable')}; losses = []
    for f in glob.glob(os.path.join(ROOT, 'eval', 'results', 'pairwise-*.json')):
        for k, v in json.load(open(f)).items():
            if k not in key: continue
            bx = 'X' if key[k]['X'] == a.b else 'Y'
            for c in tot:
                x = v.get(c, 'tie')
                if x == 'tie': tot[c][2] += 1
                elif x == bx: tot[c][0] += 1
                else: tot[c][1] += 1; losses.append((k, c, v.get('why', '')[:120]))
    for c, (w, l, t) in tot.items(): print(f'{c:8s} {a.b} {w}  {a.a} {l}  tie {t}  -> {a.b} win rate {w/max(1,w+l):.0%}')
    for x in losses: print('  loss', *x)

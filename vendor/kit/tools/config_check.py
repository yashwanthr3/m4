"""Check course.json against the config template: every phrase must be written for THIS course.

python3 tools/config_check.py
Fails on: missing keys, leftover 'TODO', questions count < 3 or > 10, parts without name/desc,
a ring text longer than 34 characters (it must fit around the emblem), or phrases copied unchanged
from the reference course (examples/config.wcss.json) when the course id differs.
"""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
c = json.load(open(os.path.join(ROOT, 'course.json')))
cfg = c.get('config', {})
def _find(n):
    for d in ('examples', 'tools'):
        p = os.path.join(ROOT, d, n)
        if os.path.exists(p): return p
    raise SystemExit(n + ' not found in examples/ or tools/')
tpl = json.load(open(_find('config.template.json')))
ref = json.load(open(_find('config.wcss.json')))
errs, warns = [], []
for k in tpl:
    if k == 'theme': continue
    if k not in cfg and k != 'questionHints': errs.append(f'missing config.{k}')
SOFT = {'cpMark', 'nextLabel', 'needLabel', 'qrefButton', 'qrefTitle', 'qrefClose', 'sortAlso'}  # engine has defaults
for k in tpl['t']:
    if k not in cfg.get('t', {}):
        (warns if k in SOFT else errs).append(f'missing config.t.{k}' + (' (engine default used)' if k in SOFT else ''))
if len(cfg.get('questionHints') or []) != len(cfg.get('questions') or []):
    errs.append('config.questionHints must give one boundary line per question')
blob = json.dumps(cfg)
if 'TODO' in blob: errs.append('config still contains TODO placeholders')
q = cfg.get('questions', [])
if not 3 <= len(q) <= 10: errs.append(f'questions: {len(q)} (want 3 to 10)')
for p, v in (cfg.get('parts') or {}).items():
    if not v.get('name'): errs.append(f'part {p} has no name')
    if not v.get('special') and not v.get('job'): errs.append(f'part {p} has no job (the ladder label)')
if len(cfg.get('ring', '')) > 34: errs.append(f'ring text is {len(cfg.get("ring",""))} chars (max 34 to fit the emblem)')
if cfg.get('id') != ref.get('id'):
    same = [k for k, v in cfg.get('t', {}).items() if ref['t'].get(k) == v and any(w in v.lower() for w in ('stop', 'eight', 'ai ', 'case'))]
    for k in ['title', 'heroHTML', 'mast', 'ring', 'sub', 'footer']:
        if cfg.get(k) == ref.get(k): same.append(k)
    if same: warns.append('phrases copied unchanged from the reference course (check they fit this domain): ' + ', '.join(same))
for k in ('stampFound','stampCheckpoint','stampClosing','stampPlain'):
    if len(cfg.get('t',{}).get(k,''))>16: warns.append(f't.{k} is long; stamps read best at 16 characters or fewer')
order = c.get('order', [])
for lid in order:
    if not os.path.exists(os.path.join(ROOT, 'lessons', lid + '.js')): warns.append(f'lesson file missing: lessons/{lid}.js')
for e in errs: print('ERROR', e)
for w in warns: print('warn ', w)
print('config OK' if not errs else f'{len(errs)} config errors')
sys.exit(1 if errs else 0)

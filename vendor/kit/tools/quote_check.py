"""Check that every quotation in a src section appears verbatim in the raw source text.
python3 tools/quote_check.py <raw_source.txt|md> [section-marker]   (default marker: FROM THE COURSE DECK)
Use after appending exact source quotes (slides, clauses) to src/*.md."""
import sys, os, re, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
raw = open(sys.argv[1]).read(); marker = sys.argv[2] if len(sys.argv) > 2 else 'FROM THE COURSE DECK'
n = lambda s: re.sub(r'\s+', ' ', s.replace('’', "'").replace('“', '"').replace('”', '"')).strip()
R = n(raw); bad = 0
for f in sorted(glob.glob(os.path.join(ROOT, 'src', '*.md'))):
    t = open(f).read()
    if marker not in t: continue
    sec = t.split(marker, 1)[1].split('---\nNOTES')[0]
    for q in re.findall(r'“([^”]+)”', sec):
        if n(q) not in R: bad += 1; print(os.path.basename(f), 'NOT IN SOURCE:', q)
print('all quotes verified' if not bad else f'{bad} quotes not found'); sys.exit(1 if bad else 0)

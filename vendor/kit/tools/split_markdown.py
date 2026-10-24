"""Split a manuscript (converted to markdown) into src/<id>.md files, one per lesson, each with its notes.

python3 tools/split_markdown.py book.md --chapter '^\*\*Chapter (\d+)\*\*$' [--notes-start '^Notes$'] \
       [--note-heading '^\*\*Chapter (\d+) '] [--extra intro='^\*\*Introduction\*\*$'] [--extra closing='^\*\*Closing\*\*$']

- Body sections run from each heading match to the next heading (any kind).
- If --notes-start is given, everything after it is treated as endnotes and split by --note-heading
  (whose group 1 is the chapter number); each chapter's notes are appended after a line 'NOTES'.
- Writes src/ch01.md, src/ch02.md ... plus any --extra ids. Prints word counts. Convert .docx/.pdf to
  markdown first (pandoc in.docx -t markdown -o book.md; or pdftotext -layout).
Tip: for policies/standards/incident reports, one lesson = one case or one control; give each a heading first.
"""
import re, sys, os, argparse
ap = argparse.ArgumentParser(); ap.add_argument('md'); ap.add_argument('--chapter', required=True)
ap.add_argument('--notes-start'); ap.add_argument('--note-heading'); ap.add_argument('--extra', action='append', default=[])
ap.add_argument('--out', default='src'); a = ap.parse_args()
L = open(a.md).read().split('\n')
body_end = len(L); notes = {}
if a.notes_start:
    idx = [i for i, l in enumerate(L) if re.match(a.notes_start, l)]
    if idx:
        body_end = idx[-1]
        if a.note_heading:
            cur = None; buf = []
            for l in L[body_end + 1:]:
                m = re.match(a.note_heading, l)
                if m:
                    if cur: notes[cur] = '\n'.join(buf)
                    cur = f'ch{int(m.group(1)):02d}'; buf = [l]
                elif cur: buf.append(l)
            if cur: notes[cur] = '\n'.join(buf)
marks = []
for i, l in enumerate(L[:body_end]):
    m = re.match(a.chapter, l)
    if m: marks.append((i, f'ch{int(m.group(1)):02d}'))
    for ex in a.extra:
        k, pat = ex.split('=', 1)
        if re.match(pat, l): marks.append((i, k))
marks.sort()
os.makedirs(a.out, exist_ok=True)
for n, (i, k) in enumerate(marks):
    j = marks[n + 1][0] if n + 1 < len(marks) else body_end
    txt = '\n'.join(L[i:j])
    if k in notes: txt += '\n\n---\nNOTES\n' + notes[k]
    open(os.path.join(a.out, k + '.md'), 'w').write(txt)
    print(k, len(txt.split()), 'words', '(+notes)' if k in notes else '')

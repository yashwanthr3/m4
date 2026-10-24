"""Build the single-file course: dist/index.html

Reads course.json:
  config   every course-specific word, the question framework, the parts, optional theme overrides
  order    lesson ids in course order (each is lessons/<id>.js)
  sources  optional {lessonId: [src files]} for lessons that draw on more than src/<id>.md
  fonts    Google Fonts stylesheet URL
"""
import os, sys, json, html as _html
ROOT = os.path.dirname(os.path.abspath(__file__))

def course():
    return json.load(open(os.path.join(ROOT, 'course.json')))

def order():
    return course()['order']

ORDER = order()

def build(only=None, out=None):
    c = course(); ORDER = c['order']; cfg = c.get('config', {})
    css = open(os.path.join(ROOT, 'engine/engine.css')).read()
    js = open(os.path.join(ROOT, 'engine/engine.js')).read()
    parts = []; missing = []
    extra = sorted(x for x in (only or []) if x not in ORDER)
    for k in ORDER + extra:
        if only and k not in only: continue
        p = os.path.join(ROOT, 'lessons', k + '.js')
        if os.path.exists(p): parts.append('/* ---- ' + k + ' ---- */\n' + open(p).read())
        else: missing.append(k)
    title = cfg.get('title', 'Who Could Have Said Stop?')
    fonts = c.get('fonts', '')
    doctype = '' if out is None else '<!doctype html>\n'  # the artifact host adds its own doctype; local test builds need one
    cfg_js = json.dumps(cfg, ensure_ascii=False).replace('</', '<\\/')
    page = doctype + f'''<meta charset="utf-8">
<title>{_html.escape(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
{'<link rel="stylesheet" href="' + fonts + '">' if fonts else ''}
<style>
{css}
</style>
<div id="app"></div>
<script>window.COURSE={{lessons:[],lesson:function(o){{this.lessons.push(o)}},config:{cfg_js}}};</script>
<script>
{chr(10).join(parts)}
</script>
<script>
{js}
</script>
'''
    out = out or os.path.join(ROOT, 'dist/index.html')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w').write(page)
    return out, missing

if __name__ == '__main__':
    out, missing = build()
    print(out, os.path.getsize(out), 'bytes; missing:', missing)

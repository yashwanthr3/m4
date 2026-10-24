"""Pattern-block contract inside a real lesson.

python3 tests/pattern_block.py <course_dir>
Builds the course, opens ch15 at phone and desktop widths, advances to the step that holds a pattern block,
checks the frame is sandboxed (allow-scripts only) with CSP default-src 'none', received the theme message,
and that LATER blocks stay hidden until the pattern's Remember card fires (the gate). Prints JSON.
"""
import json, os, sys
from playwright.sync_api import sync_playwright

course = os.path.abspath(sys.argv[1]); lid = sys.argv[2] if len(sys.argv) > 2 else 'ch15'
sys.path.insert(0, course); import build  # noqa
html = os.path.join(course, 'dist', 'pattern-test.html'); build.build(out=html)
out = {'runs': []}
with sync_playwright() as p:
    br = p.chromium.launch()
    for vp, scheme in (({'width': 390, 'height': 844}, 'dark'), ({'width': 1300, 'height': 900}, 'light')):
        ctx = br.new_context(viewport=vp, color_scheme=scheme); ctx.add_init_script('window.__FAST=true;')
        pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('file://' + html + '#' + lid); pg.wait_for_selector('.step.on')
        r = {'width': vp['width']}
        for _ in range(30):
            if pg.query_selector('.step.on .pat'): break
            for _ in range(300):
                if pg.evaluate("document.querySelector('.step.on')?.dataset.complete==='1'"): break
                for el in pg.query_selector_all('.step.on [data-solve-fill]'):
                    try:
                        if not el.input_value(): el.fill('A test answer written by the evaluator.')
                    except Exception: pass
                t = pg.query_selector('.step.on [data-solve]')
                if t: pg.evaluate('e=>e.click()', t)
                pg.wait_for_timeout(20)
                if pg.query_selector('.step.on .pat'): break
            if pg.query_selector('.step.on .pat'): break
            pg.click('#next', force=True); pg.wait_for_timeout(40)
        fr_el = pg.query_selector('.step.on .pat iframe')
        r['found'] = bool(fr_el)
        if fr_el:
            r['sandbox'] = fr_el.get_attribute('sandbox')
            r['csp'] = "default-src 'none'" in (fr_el.get_attribute('srcdoc') or '')
            r['complete_before'] = pg.evaluate("document.querySelector('.step.on').dataset.complete==='1'")
            pg.wait_for_timeout(300)
            frame = fr_el.content_frame()
            r['themed'] = frame.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()") != '#2450b8' or scheme == 'light'
            frame.evaluate("window.__autoplay('right')")
            pg.wait_for_function("document.querySelector('.step.on .patbox.done')", timeout=8000)
            pg.wait_for_timeout(400)
            r['complete_after'] = pg.evaluate("document.querySelector('.step.on').dataset.complete==='1'")
            r['overflow'] = pg.evaluate('document.documentElement.scrollWidth - innerWidth')
        r['errors'] = errs
        r['pass'] = r.get('found') and r.get('sandbox') == 'allow-scripts' and r.get('csp') and not r.get('complete_before') and r.get('complete_after') and r.get('overflow', 0) <= 1 and not errs
        out['runs'].append(r); ctx.close()
    br.close()
os.remove(html)
out['ok'] = all(r['pass'] for r in out['runs'])
print(json.dumps(out))
sys.exit(0 if out['ok'] else 1)

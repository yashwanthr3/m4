"""End-to-end playthrough eval.

A headless browser opens each lesson and plays it to the finish screen exactly as a learner
would: it clicks the solution elements the engine exposes (data-solve), types into reflection
boxes, and presses Continue. It checks, at phone width (390px, dark) and desktop (1280px, light):

  R1  the lesson loads with no console or page errors
  R2  every step can be completed and Continue unlocks
  R3  the finish screen is reached and the lesson is recorded as done
  R4  the page never scrolls sideways (no horizontal overflow)
  R5  every interaction awarded insight (xp > 0) and the stop button was found (chapters)

Usage: python3 eval/e2e.py [lesson ids...] [--shots]
Writes eval/results/e2e.json; screenshots to eval/shots/<id>/ with --shots.
"""
import json, os, sys, time, glob, subprocess
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import build
sys.path.insert(0, os.path.join(ROOT,'eval'))
import fonts

def play(page, lid, shots_dir=None, label='', html=None):
    errors = []
    page.on('console', lambda m: errors.append('console: ' + m.text) if m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'Failed to load resource' not in m.text else None)
    page.on('pageerror', lambda e: errors.append('pageerror: ' + str(e)))
    page.goto('file://' + html + '#' + lid)
    page.wait_for_selector('.step.on', timeout=5000)
    steps_total = page.evaluate("document.querySelectorAll('.prog i').length") - 1
    overflow = []
    t0 = time.time(); step = 0; stuck = None
    while True:
        cur = page.evaluate("(()=>{const s=document.querySelector('.step.on'); return s? (s.classList.contains('finish')?'finish':s.dataset.step):null})()")
        if cur == 'finish': break
        deadline = time.time() + 90
        while time.time() < deadline:
            done = page.evaluate("document.querySelector('.step.on')?.dataset.complete==='1'")
            if done: break
            # fill text inputs first
            for el in page.query_selector_all('.step.on [data-solve-fill]'):
                try:
                    if not el.input_value(): el.fill('A test answer written by the evaluator.')
                except Exception: pass
            target = page.query_selector('.step.on [data-solve]')
            if target:
                try:
                    target.scroll_into_view_if_needed(timeout=2000); target.click(timeout=2000)
                except Exception as e:
                    page.evaluate("el=>el.click()", target)
            page.wait_for_timeout(60)
        else:
            stuck = f'step {cur} never completed'; break
        ow = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
        if ow > 1: overflow.append(f'step {cur}: {ow}px')
        if shots_dir:
            os.makedirs(shots_dir, exist_ok=True)
            page.screenshot(path=os.path.join(shots_dir, f'{label}-step{int(cur):02d}.png'), full_page=True)
        page.click('#next'); step += 1
        page.wait_for_timeout(80)
        if step > 20: stuck = 'too many steps'; break
    rec = page.evaluate("JSON.parse(localStorage.getItem((window.COURSE&&COURSE.CFG?COURSE.CFG.id:'wcss')+'-course-v1')||'{}')")
    done = (rec.get('done') or {}).get(lid)
    ow = page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
    if ow > 1: overflow.append(f'finish: {ow}px')
    if shots_dir: page.screenshot(path=os.path.join(shots_dir, f'{label}-finish.png'), full_page=True)
    return {'errors': errors, 'stuck': stuck, 'steps': steps_total, 'reached_finish': stuck is None,
            'recorded': bool(done), 'xp': (done or {}).get('xp', 0), 'stop_found': (done or {}).get('stop', False),
            'overflow': overflow, 'seconds': round(time.time() - t0, 1)}

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    shots = '--shots' in sys.argv
    ids = args or [os.path.basename(f)[:-3] for f in sorted(glob.glob(os.path.join(ROOT, 'lessons', '*.js')))]
    html = os.path.join(ROOT, 'dist', f'test-{os.getpid()}.html')
    build.build(only=set(ids), out=html)
    kinds = json.loads(subprocess.run(['node', os.path.join(ROOT,'eval','dump.js')] + [os.path.join(ROOT,'lessons',i+'.js') for i in ids], capture_output=True, text=True).stdout or '{}')
    report = {}; fails = 0
    with sync_playwright() as p:
        br = p.chromium.launch()
        for lid in ids:
            res = {}
            for label, vp, scheme in (('phone-dark', {'width': 390, 'height': 844}, 'dark'), ('desktop-light', {'width': 1280, 'height': 900}, 'light')):
                ctx = br.new_context(viewport=vp, color_scheme=scheme)
                ctx.add_init_script('window.__FAST=true;')
                fonts.install(ctx)
                page = ctx.new_page()
                try:
                    r = play(page, lid, os.path.join(ROOT, 'eval', 'shots', lid) if shots and label == 'phone-dark' else None, label, html)
                except Exception as e:
                    r = {'errors': [f'harness: {e}'], 'stuck': 'exception', 'reached_finish': False, 'recorded': False, 'xp': 0, 'overflow': []}
                ctx.close(); res[label] = r
            L = kinds.get(os.path.join(ROOT,'lessons',lid+'.js'), {})
            problems = []
            for label, r in res.items():
                if r['errors']: problems.append(f'R1 {label}: ' + '; '.join(r['errors'][:3]))
                if r['stuck']: problems.append(f'R2 {label}: {r["stuck"]}')
                if not r['recorded']: problems.append(f'R3 {label}: lesson not recorded as done')
                if r['overflow']: problems.append(f'R4 {label}: horizontal overflow ' + ', '.join(r['overflow'][:3]))
                if r.get('xp', 0) <= 0: problems.append(f'R5 {label}: no insight awarded')
                if L.get('kind') == 'chapter' and not r.get('stop_found'): problems.append(f'R5 {label}: stop button not found')
            report[lid] = {'pass': not problems, 'problems': problems, 'runs': res}
            fails += bool(problems)
            print(('PASS ' if not problems else 'FAIL ') + lid + '  ' + '  '.join(f"{k}: {v.get('seconds','?')}s xp={v.get('xp',0)}" for k, v in res.items()))
            for pr in problems: print('  ' + pr)
        br.close()
    try: os.remove(html)
    except Exception: pass
    out = os.environ.get('E2E_OUT') or os.path.join(ROOT, 'eval', 'results', 'e2e.json'); os.makedirs(os.path.dirname(out), exist_ok=True)
    prev = {}
    if args and os.path.exists(out):
        try: prev = json.load(open(out))
        except Exception: prev = {}
    prev.update(report); json.dump(prev, open(out, 'w'), indent=1)
    print(f'\n{len(ids) - fails}/{len(ids)} lessons pass end-to-end')
    sys.exit(1 if fails else 0)

if __name__ == '__main__':
    main()

"""Visual collision check: plays every lesson (phone-dark 390, desktop-light 1280) and on every step and the
finish, and on the hub, reports:
  O1 text over text      two text line boxes from different text nodes intersect
  O2 text over graphic   text intersects a circle, socket, stop button, stamp or gauge marker it is not inside
  O3 line through shape  a chain connector line crosses a numbered circle
  O4 clipped text        text cut off by its box (overflow hidden) without a deliberate line clamp
Exit 1 on any O1, O2 or O3. Writes eval/results/overlap.json (or $OVERLAP_OUT).
Usage: python3 eval/overlap.py [ids...]
"""
import sys, os, json, glob
from playwright.sync_api import sync_playwright
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE); sys.path.insert(0, ROOT); import fonts, build
PROBE = r"""
(() => {
  const scope = document.querySelector('.step.on') || document.querySelector('#app');
  const vis = el => { const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < .05) return false;
    let a = el; while (a && a !== document.body) { const c = getComputedStyle(a); if (c.display === 'none' || c.visibility === 'hidden' || parseFloat(c.opacity) < .05) return false; a = a.parentElement; } return true; };
  const inter = (a, b, m = 2) => { const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top); return (w > m && h > m) ? [w, h] : null; };
  const name = el => ((el.className && el.className.baseVal === undefined ? el.className : el.tagName) || el.tagName).toString().split(' ')[0].slice(0, 18);
  const out = { O1: [], O2: [], O3: [], O4: [] };
  // text line boxes
  const texts = []; const tw = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  while (tw.nextNode()) { const n = tw.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || !vis(el) || el.closest('[aria-hidden=true],svg,.lines')) continue;
    const r = document.createRange(); r.selectNodeContents(n); for (const rc0 of r.getClientRects()) if (rc0.width > 2 && rc0.height > 2) { const fs = parseFloat(getComputedStyle(el).fontSize) || 16; const pad = Math.min(rc0.height * 0.3, fs * 0.22); const rc = { left: rc0.left, right: rc0.right, top: rc0.top + pad, bottom: rc0.bottom - pad, height: rc0.height - 2 * pad }; let a = el, gone = false; while (a && a !== document.body) { const c = getComputedStyle(a); if (/hidden|clip|auto|scroll/.test(c.overflow + c.overflowY + c.overflowX)) { const ar = a.getBoundingClientRect(); rc.left = Math.max(rc.left, ar.left); rc.right = Math.min(rc.right, ar.right); rc.top = Math.max(rc.top, ar.top); rc.bottom = Math.min(rc.bottom, ar.bottom); if (rc.right - rc.left < 2 || rc.bottom - rc.top < 2) { gone = true; break; } } if (c.backfaceVisibility === 'hidden') { const m = new DOMMatrix(getComputedStyle(a).transform); if (m.a < 0 || (a.closest('.flip') && !a.closest('.flip').classList.contains('on') && a.matches('.back,.bk'))) { gone = true; break; } } a = a.parentElement; } if (gone) continue; rc.height = rc.bottom - rc.top; texts.push({ rc, el, t: n.textContent.trim().slice(0, 24) }); } }
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
    const A = texts[i], B = texts[j]; if (A.el === B.el || A.t === B.t) continue;
    const x = inter(A.rc, B.rc, 3); if (!x) continue;
    // glyph boxes of adjacent lines in one paragraph can touch by a pixel or two; require real overlap
    if (x[1] < Math.min(A.rc.height, B.rc.height) * 0.35) continue;
    out.O1.push(`"${A.t}" x "${B.t}"`);
  }
  // graphics
  const shapes = [...scope.querySelectorAll('.links li i, .recap .slot, .sock, .stampmark, .gauge b, .socket, .tl .estop, .bars .fill')].filter(vis);
  for (const s of shapes) { const sr = s.getBoundingClientRect();
    for (const T of texts) { if (s.contains(T.el)) continue; const x = inter(sr, T.rc, 3); if (x && x[0] * x[1] > 30) out.O2.push(`${name(s)} x "${T.t}"`); } }
  // connector lines vs circles
  scope.querySelectorAll('.links').forEach(ol => { const lis = [...ol.children]; const circles = lis.map(li => li.querySelector('i')).filter(Boolean).map(c => c.getBoundingClientRect());
    lis.forEach((li, k) => { if (k === 0) return; const cs = getComputedStyle(li, '::before'); if (cs.content === 'none' || cs.display === 'none') return;
      const lr = li.getBoundingClientRect(); const w = parseFloat(cs.width), right = parseFloat(cs.right), top = parseFloat(cs.top), bt = parseFloat(cs.borderTopWidth) || 2;
      const L = { left: lr.right - right - w, right: lr.right - right, top: lr.top + top, bottom: lr.top + top + bt };
      circles.forEach((c, ci) => { const x = inter(L, c, .5); if (x) out.O3.push(`chain link ${k + 1} line crosses circle ${ci + 1} by ${Math.round(x[0])}px`); }); }); });
  // clipped text
  scope.querySelectorAll('*').forEach(el => { if (!vis(el)) return; const cs = getComputedStyle(el); if (!/hidden|clip/.test(cs.overflow + cs.overflowX)) return;
    if (cs.webkitLineClamp && cs.webkitLineClamp !== 'none') return; if (!el.textContent.trim()) return;
    if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0 && !el.querySelector('table,svg,img')) out.O4.push(`${name(el)} "${el.textContent.trim().slice(0, 24)}" ${el.scrollWidth}>${el.clientWidth}`); });
  for (const k in out) out[k] = [...new Set(out[k])];
  return out;
})()
"""

def run(ids, hub=True):
    html = os.path.join(ROOT, 'dist', f'overlap-{os.getpid()}.html'); build.build(only=None if hub else set(ids), out=html)
    report = {}; bad = 0
    with sync_playwright() as p:
        br = p.chromium.launch()
        targets = (['hub'] if hub else []) + ids
        for lid in targets:
            res = {'O1': set(), 'O2': set(), 'O3': set(), 'O4': set()}
            for theme, vp, cs in (('phone-dark', {'width': 390, 'height': 844}, 'dark'), ('desktop-light', {'width': 1280, 'height': 900}, 'light')):
                c = br.new_context(viewport=vp, color_scheme=cs); c.add_init_script('window.__FAST=true;'); fonts.install(c); pg = c.new_page()
                if lid == 'hub':
                    pg.goto('file://' + html); pg.wait_for_timeout(500)
                    o = pg.evaluate(PROBE)
                    for k, v in o.items(): res[k] |= {f'{theme}/hub: {x}' for x in v}
                    c.close(); continue
                pg.goto('file://' + html + '#' + lid); pg.wait_for_selector('.step.on')
                for _ in range(22):
                    cur = pg.evaluate("(()=>{const s=document.querySelector('.step.on');return s.classList.contains('finish')?'finish':s.dataset.step})()")
                    if cur == '0':
                        pg.wait_for_timeout(700)
                        o = pg.evaluate(PROBE)
                        for k, v in o.items(): res[k] |= {f'{theme}/cover: {x}' for x in v}
                    for _ in range(400):
                        if cur == 'finish' or pg.evaluate("document.querySelector('.step.on')?.dataset.complete==='1'"): break
                        for el in pg.query_selector_all('.step.on [data-solve-fill]'):
                            try:
                                if not el.input_value(): el.fill('A short answer.')
                            except Exception: pass
                        t = pg.query_selector('.step.on [data-solve]')
                        if t: pg.evaluate("e=>e.click()", t)
                        pg.wait_for_timeout(25)
                    pg.wait_for_timeout(900 if cur == 'finish' else 250)
                    o = pg.evaluate(PROBE)
                    for k, v in o.items(): res[k] |= {f'{theme}/{cur}: {x}' for x in v}
                    if cur == 'finish': break
                    pg.click('#next'); pg.wait_for_timeout(40)
                c.close()
            res = {k: sorted(v) for k, v in res.items()}
            fail = bool(res['O1'] or res['O2'] or res['O3']); bad += fail; report[lid] = {'pass': not fail, **res}
            print(('PASS ' if not fail else 'FAIL ') + lid + '  ' + '  '.join(f'{k}={len(v)}' for k, v in res.items()))
            for k in ('O1', 'O2', 'O3', 'O4'):
                for x in res[k][:4]: print(f'  {k} {x}')
        br.close()
    try: os.remove(html)
    except Exception: pass
    out = os.environ.get('OVERLAP_OUT') or os.path.join(HERE, 'results', 'overlap.json'); prev = {}
    if os.path.exists(out):
        try: prev = json.load(open(out))
        except Exception: pass
    prev.update(report); json.dump(prev, open(out, 'w'), indent=1)
    print(f'\n{len(targets) - bad}/{len(targets)} screens sets pass the collision check'); return bad

if __name__ == '__main__':
    ids = sys.argv[1:] or json.load(open(os.path.join(ROOT, 'course.json')))['order']
    sys.exit(1 if run(ids, hub=not sys.argv[1:]) else 0)

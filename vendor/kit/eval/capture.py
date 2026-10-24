"""Capture screens for taste review.

python3 eval/capture.py --html dist/index.html --label v2 [--ids ch01 ch12] [--all-steps]
Saves eval/taste/<label>/<id>/<theme>-<step>.png for: the cover, every step containing an
exhibit / stop / simulation, and the finish. Themes: desktop-light (1280) and phone-dark (390).
Sticky bars are made static so full-page shots read cleanly.
"""
import sys, os, argparse
from playwright.sync_api import sync_playwright
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.dirname(HERE)
sys.path.insert(0,HERE); import fonts
ap=argparse.ArgumentParser(); ap.add_argument('--html',default='dist/index.html'); ap.add_argument('--label',default='v2'); ap.add_argument('--ids',nargs='*'); ap.add_argument('--all-steps',action='store_true'); ap.add_argument('--hub',action='store_true')
a=ap.parse_args()
KEY={'doc','chat','tapfind','compare','stop','runaway','vigil','ledger','waffle','sort','cards'}
html=os.path.abspath(a.html)
if a.html=='dist/index.html':
    sys.path.insert(0,ROOT); import build; html=os.path.join(ROOT,'dist',f'capture-{os.getpid()}.html'); build.build(only=(set(a.ids) if a.ids and not a.hub else None),out=html)
ids=a.ids or [f[:-3] for f in sorted(os.listdir(os.path.join(ROOT,'lessons')))]
with sync_playwright() as p:
    b=p.chromium.launch()
    for theme,vp,cs in (('desktop-light',{'width':1280,'height':900},'light'),('phone-dark',{'width':390,'height':844},'dark')):
        c=b.new_context(viewport=vp,color_scheme=cs,device_scale_factor=1); c.add_init_script('window.__FAST=true;'); fonts.install(c)
        c.add_init_script("document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='.top,.bar{position:static!important}';document.head.appendChild(s)})")
        pg=c.new_page()
        if a.hub:
            pg.goto('file://'+html); pg.wait_for_timeout(600)
            d=os.path.join(HERE,'taste',a.label,'hub'); os.makedirs(d,exist_ok=True); pg.screenshot(path=os.path.join(d,theme+'.png'),full_page=True)
        for lid in ids:
            pg.goto('file://'+html+'#'+lid); pg.wait_for_selector('.step.on'); pg.evaluate("localStorage.clear()")
            d=os.path.join(HERE,'taste',a.label,lid); os.makedirs(d,exist_ok=True)
            for _ in range(20):
                cur=pg.evaluate("(()=>{const s=document.querySelector('.step.on');return s.classList.contains('finish')?'finish':s.dataset.step})()")
                if cur=='finish':
                    pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(d,f'{theme}-finish.png'),full_page=True); break
                for _ in range(400):
                    if pg.evaluate("document.querySelector('.step.on')?.dataset.complete==='1'"): break
                    for el in pg.query_selector_all('.step.on [data-solve-fill]'):
                        try:
                            if not el.input_value(): el.fill('I would want to see it in writing first.')
                        except Exception: pass
                    t=pg.query_selector('.step.on [data-solve]')
                    if t: pg.evaluate("e=>e.click()",t)
                    pg.wait_for_timeout(30)
                types=pg.evaluate("[...document.querySelectorAll('.step.on .blk')].map(e=>e.dataset.type)")
                if a.all_steps or cur=='0' or (KEY & set(types)):
                    pg.wait_for_timeout(150); pg.screenshot(path=os.path.join(d,f'{theme}-step{int(cur):02d}.png'),full_page=True)
                pg.mouse.move(0,0); pg.click('#next', force=True); pg.wait_for_timeout(50)
            print(theme,lid,'ok')
        c.close()
    b.close()
if a.html=='dist/index.html':
    try: os.remove(html)
    except Exception: pass

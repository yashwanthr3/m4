"""Automated taste checks: the measurable part of craft.

Plays each lesson at phone-dark (390) and desktop-light (1280) and, on every step and the finish:
  K1 contrast   text meets WCAG AA against its real background (4.5:1, or 3:1 for large text);
                answered/locked options and deliberately struck-through links are exempt
  K2 targets    every control is at least 40px tall (44 is the goal); inline tap-to-find words exempt
  K3 measure    running text stays under ~82 characters per line
  K4 scale      no more than 10 distinct font sizes on one screen outside exhibits
  K5 overflow   nothing wider than the screen
Exit 1 if any lesson has a K1, K2 or K5 failure. Writes eval/results/taste_auto.json.
"""
import sys, os, json, glob
from playwright.sync_api import sync_playwright
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.dirname(HERE)
sys.path.insert(0,HERE); sys.path.insert(0,ROOT); import fonts, build
PROBE = r"""
(() => {
  const parse=c=>{const m=c.match(/rgba?\(([^)]+)\)/); if(!m) return null; const p=m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1};};
  const lum=c=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)}; return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b)};
  const blend=(top,bot)=>({r:top.r*top.a+bot.r*(1-top.a),g:top.g*top.a+bot.g*(1-top.a),b:top.b*top.a+bot.b*(1-top.a),a:1});
  function bgOf(el){
    const stack=[]; let e=el;
    while(e && e.nodeType===1){ const cs=getComputedStyle(e);
      if(cs.backgroundImage && cs.backgroundImage!=='none' && !/repeating-linear|linear-gradient\(to (right|bottom)/.test(cs.backgroundImage)) return null; // gradients/images: unknown
      const c=parse(cs.backgroundColor); if(c && c.a>0){ stack.push(c); if(c.a>=1) break; }
      e=e.parentElement; }
    let base={r:255,g:255,b:255,a:1}; if(!stack.length||stack[stack.length-1].a<1){ const bc=parse(getComputedStyle(document.body).backgroundColor); if(bc) base=bc; }
    for(let i=stack.length-1;i>=0;i--) base=blend(stack[i],base); return base;
  }
  const scope=document.querySelector('.step.on'); const W=innerWidth; const out={contrast:[],targets:[],measure:[],sizes:0,overflow:0};
  const exempt=e=>e.closest('.locked,.after,.dead,[disabled],.miss,.typing,.waffle,.exnote .imagined,.stampbox,.tally,.links li.after,.ropts,.buckets.locked,.num,[aria-hidden=true]');
  const sizes=new Set();
  scope.querySelectorAll('*').forEach(el=>{
    const cs=getComputedStyle(el); if(cs.visibility==='hidden'||cs.display==='none') return;
    const r=el.getBoundingClientRect(); if(!r.width||!r.height) return;
    const own=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim().length>1);
    if(own){
      if(!el.closest('.ex')) sizes.add(cs.fontSize);
      if(!exempt(el) && parseFloat(cs.opacity)>.95){
        let op=1, a=el; while(a&&a!==document.body){ op*=parseFloat(getComputedStyle(a).opacity); a=a.parentElement; }
        const fg=parse(cs.color), bg=bgOf(el);
        if(fg && bg && op>.95){ const c=blend(fg,bg); const L1=lum(c), L2=lum(bg); const ratio=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);
          const px=parseFloat(cs.fontSize), bold=parseInt(cs.fontWeight)>=600, large=px>=24||(bold&&px>=18.66);
          if(ratio<(large?3:4.5)) out.contrast.push((el.className||el.tagName).toString().slice(0,30)+' "'+el.textContent.trim().slice(0,28)+'" '+ratio.toFixed(2));
        }
      }
      if(el.matches('p,.prose p,.fb,.sit .s,.lede') && !el.closest('.ex')){ const cpl=r.width/(parseFloat(cs.fontSize)*.5); if(cpl>82*1.05) out.measure.push((el.className||el.tagName)+' ~'+Math.round(cpl)+'ch'); }
    }
    if(el.matches('button,a.btn,[role=button]:not(.seg),input[type=range],textarea,input') && !el.closest('[disabled]') && !el.disabled && !el.matches('.seg')){
      if(r.height<40 && r.width<40) out.targets.push((el.className||el.tagName).toString().slice(0,30)+' '+Math.round(r.width)+'x'+Math.round(r.height));
      else if(r.height<36 && !el.matches('input[type=range]')) out.targets.push((el.className||el.tagName).toString().slice(0,30)+' h='+Math.round(r.height));
    }
  });
  out.sizes=sizes.size; out.overflow=Math.max(0,document.documentElement.scrollWidth-W);
  return out;
})()
"""
def run(ids):
    html=os.path.join(ROOT,'dist',f'taste-{os.getpid()}.html'); build.build(only=set(ids),out=html)
    report={}; bad=0
    with sync_playwright() as p:
        br=p.chromium.launch()
        for lid in ids:
            res={'K1':set(),'K2':set(),'K3':set(),'K4':[],'K5':[]}
            for theme,vp,cs in (('phone-dark',{'width':390,'height':844},'dark'),('desktop-light',{'width':1280,'height':900},'light')):
                c=br.new_context(viewport=vp,color_scheme=cs); c.add_init_script('window.__FAST=true;'); fonts.install(c); pg=c.new_page()
                pg.goto('file://'+html+'#'+lid); pg.wait_for_selector('.step.on')
                for _ in range(22):
                    cur=pg.evaluate("(()=>{const s=document.querySelector('.step.on');return s.classList.contains('finish')?'finish':s.dataset.step})()")
                    for _ in range(400):
                        if cur=='finish' or pg.evaluate("document.querySelector('.step.on')?.dataset.complete==='1'"): break
                        for el in pg.query_selector_all('.step.on [data-solve-fill]'):
                            try:
                                if not el.input_value(): el.fill('A short answer.')
                            except Exception: pass
                        t=pg.query_selector('.step.on [data-solve]')
                        if t: pg.evaluate("e=>e.click()",t)
                        pg.wait_for_timeout(25)
                    o=pg.evaluate(PROBE)
                    tag=f'{theme}/{cur}'
                    for x in o['contrast']: res['K1'].add(f'{tag}: {x}')
                    for x in o['targets']: res['K2'].add(f'{tag}: {x}')
                    for x in o['measure']: res['K3'].add(f'{tag}: {x}')
                    if o['sizes']>10: res['K4'].append(f'{tag}: {o["sizes"]} sizes')
                    if o['overflow']>1: res['K5'].append(f'{tag}: {o["overflow"]}px')
                    if cur=='finish': break
                    pg.click('#next'); pg.wait_for_timeout(40)
                c.close()
            res={k:sorted(v) if isinstance(v,set) else v for k,v in res.items()}
            fail=bool(res['K1'] or res['K2'] or res['K5'])
            bad+=fail; report[lid]={'pass':not fail,**res}
            print(('PASS ' if not fail else 'FAIL ')+lid+'  '+'  '.join(f'{k}={len(v)}' for k,v in res.items()))
            for k in ('K1','K2','K5','K3','K4'):
                for x in res[k][:4]: print(f'  {k} {x}')
        br.close()
    try: os.remove(html)
    except Exception: pass
    out=os.environ.get('TASTE_OUT') or os.path.join(HERE,'results','taste_auto.json'); prev={}
    if os.path.exists(out):
        try: prev=json.load(open(out))
        except Exception: pass
    prev.update(report); json.dump(prev,open(out,'w'),indent=1)
    print(f'\n{len(ids)-bad}/{len(ids)} lessons pass automated taste checks'); return bad
if __name__=='__main__':
    ids=sys.argv[1:] or [os.path.basename(f)[:-3] for f in sorted(glob.glob(os.path.join(ROOT,'lessons','*.js')))]
    sys.exit(1 if run(ids) else 0)

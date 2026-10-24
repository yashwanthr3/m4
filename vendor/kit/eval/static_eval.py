"""Static evals for course lessons.

Usage: python3 eval/static_eval.py [lesson ids...]   (default: every file in lessons/)
Exit code 1 if any lesson has an ERROR. Writes eval/results/static.json.

Checks
  S  schema       every block type known, required fields present, ids unique
  P  pedagogy     act-before-told, mechanic variety, stop button, toolkit, reflection,
                  feedback that teaches, screen load, transfer takeaway
  F  fidelity     every number and every quotation in non-imagined content appears in
                  the manuscript chapter (or its notes); source URLs come from the notes
  V  voice        book style: no em dashes, no filler words, short sentences
"""
import json, os, re, subprocess, sys, html, difflib, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')

GATES = {'rate','chat','choice','toolkit','slider','tapfind','stop','sort','order','reflect','fill','cards','runaway','vigil'}
ACTIVE = GATES - {'chat'}            # learner acts
DOING = ACTIVE - {'reflect','cards','fill','rate'}   # learner makes a call that can be scored or simulated
STATIC = {'text','sit','quote','doc','compare','ledger','stat','waffle','bars'}
REQ = {
 'text':['html'], 'sit':['html'], 'quote':['text'], 'doc':['html'], 'compare':['left','right'],
 'chat':['messages'], 'choice':['id','options'], 'toolkit':['id','answer','fb'], 'slider':['id','min','max'],
 'tapfind':['id','segments'], 'stop':['id','nodes'], 'sort':['id','buckets','items'], 'order':['id','items'],
 'reflect':['id','prompt'], 'fill':['id','fields'], 'ledger':['rows'], 'stat':['value'], 'waffle':['total','hi'],
 'bars':['items'], 'cards':['cards'], 'rate':['id','items'], 'runaway':['id','max','outcomes'], 'vigil':['id','rounds','fb'],
}
BANNED = [r'\bgenuinely\b', r'\bhonestly\b', r'\bstraightforward\b', r'\bdelve', r"\bit'?s worth noting", r'\bworth noting\b',
          r'\bgreat job\b', r'\bwell done\b', r'\bcorrect!', r'\bwrong!', r'\boops\b', r'\bnailed it\b', r'\bawesome\b',
          r'\bin today.s world\b', r'\bgame.changer\b', r'\blet.s dive\b', r'\bjourney\b']
EMOJI = re.compile('[\U0001F300-\U0001FAFF☀-➿]')

def norm_src(t):
    t = t.replace('\\', '')
    t = re.sub(r'\^\d+\^', '', t)
    t = re.sub(r'!\[[^\]]*\]\([^)]*\)(\{[^}]*\})?', ' ', t)
    t = t.replace('**','').replace('*','')
    return t

def plain(s):
    s = re.sub(r'<[^>]+>', ' ', str(s))
    s = html.unescape(s)
    s = s.replace(' ',' ')
    return re.sub(r'\s+', ' ', s).strip()

def canon(s):
    s = s.lower()
    s = s.replace('’',"'").replace('‘',"'").replace('“','"').replace('”','"')
    s = re.sub(r"[^a-z0-9$£€%' ]+", ' ', s)
    return re.sub(r'\s+',' ',s).strip()

def _course():
    try: return json.load(open(os.path.join(ROOT, 'course.json')))
    except Exception: return {}
COURSE_CFG = _course()
NQ = len((COURSE_CFG.get('config') or {}).get('questions') or []) or 8

def source_for(lid):
    files = (COURSE_CFG.get('sources') or {}).get(lid) or [f'{lid}.md']
    txt = '\n'.join(open(os.path.join(SRC,f)).read() for f in files if os.path.exists(os.path.join(SRC,f)))
    return norm_src(txt)

def walk_text(lesson):
    """Yield (where, text, imagined, kind) for every learner-visible string."""
    out = []
    def add(w, t, im, k='prose'):
        if t: out.append((w, str(t), im, k))
    add('title', lesson.get('title'), False, 'title'); add('question', lesson.get('question'), False, 'title')
    for si, st in enumerate(lesson.get('steps', [])):
        sim = bool(st.get('imagined'))
        w0 = f'step{si}'
        for k in ('eyebrow','title','lede'): add(f'{w0}.{k}', st.get(k), sim, 'head')
        for bi, b in enumerate(st.get('blocks', [])):
            im = sim or bool(b.get('imagined'))
            w = f'{w0}.b{bi}:{b.get("type")}'
            t = b.get('type')
            for k in ('html','text','prompt','cite','title','tag','meta','fb','fbWrong','reveal','fbClose','fbFar','fbBlank','fbFull','caption','label','hiLabel','restLabel','placeholder'):
                if k in b and isinstance(b[k], str): add(f'{w}.{k}', b[k], im, 'fb' if k.startswith('fb') or k=='reveal' else 'prose')
            for m in b.get('messages', []) or []: add(f'{w}.msg', m.get('text'), im or m.get('imagined', False), 'chat')
            for o in b.get('options', []) or []: add(f'{w}.opt', o.get('text'), im, 'opt'); add(f'{w}.optfb', o.get('fb'), im, 'fb')
            for s in b.get('segments', []) or []: add(f'{w}.seg', s.get('text'), im or bool(b.get('paraphrase')), 'seg'); add(f'{w}.segfb', s.get('miss'), im, 'fb'); add(f'{w}.segfb', s.get('fb'), im, 'fb')
            for n in b.get('nodes', []) or []: add(f'{w}.node', n.get('who'), im, 'opt'); add(f'{w}.node', n.get('what'), im, 'opt'); add(f'{w}.nodefb', n.get('fb'), im, 'fb')
            for it in b.get('items', []) or []:
                if isinstance(it, str): add(f'{w}.item', it, im, 'opt')
                else: add(f'{w}.item', it.get('text') or it.get('label'), im, 'opt'); add(f'{w}.itemfb', it.get('why'), im, 'fb')
            if t == 'rate':
                for it in b.get('items', []) or []: add(f'{w}.rate', it, im, 'opt')
            for c in b.get('cards', []) or []: add(f'{w}.card', c.get('front'), im, 'opt'); add(f'{w}.card', c.get('back'), im, 'fb')
            for r in b.get('rows', []) or []: add(f'{w}.row', ' '.join(map(str, r[:2])), im, 'opt')
            for f_ in b.get('fields', []) or []: add(f'{w}.field', f_.get('label'), im, 'opt')
            if t == 'runaway':
                for k, v in (b.get('outcomes') or {}).items(): add(f'{w}.outcome.{k}', v, im, 'fb')
                for e in b.get('events', []) or []: add(f'{w}.event', e, True, 'opt')
            if t == 'vigil':
                for r in b.get('rounds', []): add(f'{w}.round', r.get('label'), True, 'opt')
            if t == 'compare':
                for side in ('left','right'):
                    s = b.get(side) or {}
                    add(f'{w}.{side}', s.get('html'), im or bool(s.get('imagined')), 'prose')
    f = lesson.get('finish', {}) or {}
    for k in ('headline','takeaway','sit','note'): add(f'finish.{k}', f.get(k), False, 'prose')
    for e in f.get('elsewhere', []) or []: add('finish.elsewhere', e.get('text'), False, 'prose'); add('finish.elsewhere.when', e.get('when'), False, 'prose')
    return out

NUM = re.compile(r'(?<![\w.])[$£€]?\d[\d,]*(?:\.\d+)?(?:\s?(?:%|percent))?')
def numbers(s):
    res = []
    for m in NUM.finditer(s):
        tok = m.group(0)
        core = re.sub(r'[^\d.]', '', tok).rstrip('.')
        if not core: continue
        try: val = float(core)
        except: continue
        res.append((tok, core, val))
    return res

QUOTE = re.compile(r'[“"]([^”"]{3,}?)[”"]')
def quotes(s):
    return [q for q in QUOTE.findall(s) if len(q.split()) >= 4]

def in_source(q, srcc):
    qc = canon(q)
    if not qc: return True
    if qc in srcc: return True
    # tolerate small edits (trimmed words, bracketed changes): best matching window
    words = qc.split(); n = len(words)
    sw = srcc.split()
    best = 0.0
    first = words[0]
    for i, w in enumerate(sw):
        if w != first and (i == 0 or sw[i-1] != first): continue
        window = ' '.join(sw[i:i+n+3])
        r = difflib.SequenceMatcher(None, qc, window[:len(qc)+15]).ratio()
        best = max(best, r)
        if best > 0.9: return True
    return best > 0.9

def check(lid, L, src):
    E, W = [], []
    err = lambda c, m: E.append(f'{c}: {m}')
    warn = lambda c, m: W.append(f'{c}: {m}')
    kind = L.get('kind')
    for k in ('id','kind','part','title','question','steps','finish'):
        if k not in L: err('S1', f'missing lesson field {k}')
    if L.get('id') != lid: err('S1', f'id {L.get("id")} does not match file {lid}')
    steps = L.get('steps', [])
    ids = set(); types = []; seq = []
    for si, st in enumerate(steps):
        for bi, b in enumerate(st.get('blocks', [])):
            t = b.get('type')
            if t not in REQ: err('S2', f'step{si}.b{bi}: unknown block type {t!r}'); continue
            for r in REQ[t]:
                if r not in b: err('S3', f'step{si}.b{bi} {t}: missing {r}')
            if 'id' in b:
                if b['id'] in ids: err('S4', f'duplicate block id {b["id"]}')
                ids.add(b['id'])
            types.append(t); seq.append((si, t))
            # per type quality
            if t == 'choice':
                opts = b.get('options', [])
                if not 2 <= len(opts) <= 5: err('S5', f'step{si} choice {b.get("id")}: {len(opts)} options (want 2-5)')
                for o in opts:
                    if len(plain(o.get('fb',''))) < 40: err('P9', f'step{si} choice {b.get("id")}: option feedback under 40 chars: {plain(o.get("text",""))[:50]!r}')
            if t == 'stop':
                nodes = b.get('nodes', [])
                if not any(n.get('stop') for n in nodes): err('S5', f'stop {b.get("id")}: no node has stop:true')
                if len(nodes) < 3: err('S5', f'stop {b.get("id")}: fewer than 3 nodes')
                for n in nodes:
                    if len(plain(n.get('fb',''))) < 40: err('P9', f'stop {b.get("id")}: node feedback under 40 chars: {plain(n.get("who",""))[:50]!r}')
            if t == 'tapfind':
                segs = b.get('segments', [])
                if not any(s.get('hit') for s in segs): err('S5', f'tapfind {b.get("id")}: no hit segment')
                if len(segs) < 2: err('S5', f'tapfind {b.get("id")}: needs at least 2 segments')
                for s in segs:
                    if not s.get('hit') and not (s.get('miss') or b.get('missFb')): warn('P9', f'tapfind {b.get("id")}: miss segment without a hint')
            if t == 'sort':
                nb = len(b.get('buckets', []))
                if len(b.get('items', [])) < 4: err('S5', f'sort {b.get("id")}: fewer than 4 items')
                for it in b.get('items', []):
                    if not isinstance(it.get('bucket'), int) or not 0 <= it['bucket'] < nb: err('S5', f'sort {b.get("id")}: bad bucket index on {plain(it.get("text",""))[:40]!r}')
                    if len(plain(it.get('why',''))) < 30: err('P9', f'sort {b.get("id")}: item "why" under 30 chars')
            if t == 'order' and len(b.get('items', [])) < 4: err('S5', f'order {b.get("id")}: fewer than 4 items')
            if t == 'slider' and b.get('answer') is not None:
                if not (b['min'] <= b['answer'] <= b['max']): err('S5', f'slider {b.get("id")}: answer outside range')
                if not (b.get('fbClose') or b.get('reveal')): err('P9', f'slider {b.get("id")}: answer with no reveal text')
            if t == 'toolkit':
                a = b.get('answer', [])
                if not a or any(not isinstance(x,int) or not 1 <= x <= NQ for x in a): err('S5', f'toolkit answer must be integers 1-{NQ}')
                if not set(a) & set(L.get('questions', [])): err('P6', f'toolkit answer {a} not among lesson.questions {L.get("questions")}')
            if t == 'runaway':
                oc = b.get('outcomes', {})
                need = ['early','late','max'] + (['limit'] if b.get('limit') else [])
                for k in need:
                    if not oc.get(k): err('S5', f'runaway {b.get("id")}: missing outcome {k}')
            if t == 'vigil' and not b.get('rounds'): err('S5', 'vigil needs rounds')
            if t == 'chat':
                for m in b.get('messages', []):
                    if m.get('from') not in ('you','bot','them','sys'): err('S5', f'chat message from must be you|bot|them|sys, got {m.get("from")!r}')
    # design (visual language)
    DOC_SKINS={'sheet','web','email','letter','notification','filing','recipe','obituary','dictionary','terms','search','popup','log','file','form','memo','card'}
    CHAT_SKINS={'widget','messenger','call','workspace','assistant','script'}
    for si, st in enumerate(steps):
        for b in st.get('blocks', []):
            t=b.get('type')
            if t in ('doc','tapfind'):
                if b.get('skin') not in DOC_SKINS: err('D1', f'step{si} {t} {b.get("id","")}: needs skin from {sorted(DOC_SKINS)} (got {b.get("skin")!r})')
            if t=='chat' and b.get('skin') not in CHAT_SKINS: err('D1', f'step{si} chat: needs skin from {sorted(CHAT_SKINS)} (got {b.get("skin")!r})')
            if t=='compare':
                for side in ('left','right'):
                    if (b.get(side) or {}).get('skin') not in DOC_SKINS: err('D1', f'step{si} compare.{side}: needs skin (got {(b.get(side) or {}).get("skin")!r})')
            if t=='stop':
                for n in b.get('nodes',[]):
                    sh=n.get('short','')
                    if not sh: err('D2', f'step{si} stop node needs a short label for the chain: {plain(n.get("who",""))[:50]!r}')
                    elif len(sh)>22: err('D2', f'step{si} stop short label over 22 chars: {sh!r}')
                if not 3<=len(b.get('nodes',[]))<=7: warn('D4', f'stop chain has {len(b.get("nodes",[]))} links (3-7 reads best)')
    if re.search(r'style\s*=|#[0-9a-fA-F]{3,6}\b', json.dumps(L)): err('D3', 'inline style or hex colour in lesson content; use the engine skins')
    # pedagogy
    act = [t for t in types if t in ACTIVE]; doing = [t for t in types if t in DOING]
    distinct = set(act)
    is_ch = kind == 'chapter'
    if is_ch or kind in ('intro','closing'):
        if not 5 <= len(steps) <= 9: err('P1', f'{len(steps)} steps (want 5-9)')
        if len(act) < 6: err('P3', f'only {len(act)} interactive blocks (want 6+)')
        if len(distinct) < 4: err('P3', f'only {len(distinct)} distinct interaction types {sorted(distinct)} (want 4+)')
        first_doing = next((si for si, t in seq if t in DOING), 99)
        if first_doing > 1: err('P4', f'learner makes no call until step {first_doing} (must act by step 1: predict before being told)')
        if 'stop' not in types and is_ch: err('P5', 'no stop block: every chapter must ask who could have said stop')
        if 'toolkit' not in types and is_ch: err('P6', 'no toolkit block linking to the eight questions')
        if 'reflect' not in types: err('P7', 'no reflect block (sit-with-it writing)')
        if not any(t in ('sit',) for t in types) and not (L.get('finish') or {}).get('sit'): warn('P7', 'no sit block')
    elif kind == 'checkpoint':
        if not 5 <= len(steps) <= 10: err('P1', f'{len(steps)} steps (want 5-10)')
        if len(act) < 7: err('P3', f'checkpoint has only {len(act)} interactive blocks (want 7+)')
        if 'reflect' not in types: err('P7', 'no reflect block')
        if not {'sort','order','toolkit'} & set(types): err('P3', 'checkpoint needs retrieval practice (sort/order/toolkit)')
    if steps and not any(b.get('type') in DOING for b in steps[0].get('blocks', [])) and len(steps) > 1 and not any(b.get('type') in DOING for b in steps[1].get('blocks', [])):
        pass
    if is_ch:
        q = L.get('question','')
        if canon(q) not in canon(src): err('F4', f'lesson.question is not the chapter question from the manuscript: {q!r}')
    # screen load
    for si, st in enumerate(steps):
        words = len(plain(st.get('lede','')).split())
        for b in st.get('blocks', []):
            if b.get('type') in ('text','sit','quote','doc'):
                n = len(plain(b.get('html') or b.get('text') or '').split()); words += n
                if b.get('type') == 'text' and n > 120: err('P10', f'step{si}: text block of {n} words (max 120); break it up or make it interactive')
        if words > 220: err('P10', f'step{si}: {words} words of reading before interaction (max 220)')
        elif words > 170: warn('P10', f'step{si}: {words} words of reading (aim under 170)')
    # finish
    f = L.get('finish') or {}
    if not f.get('takeaway'): err('P8', 'finish.takeaway missing (a concrete thing to do)')
    srcs = f.get('sources') or []
    if kind in ('chapter','intro','closing') and not any(s.get('url') for s in srcs): err('P8', 'finish.sources has no URL')
    for s in srcs:
        u = s.get('url')
        if u and u.rstrip('/') not in src.replace('\\',''): err('F3', f'source URL not in chapter notes: {u}')
    if is_ch and 'ELSEWHERE' in src and not f.get('elsewhere'): warn('P8', 'chapter has ELSEWHERE cases but finish.elsewhere is empty')
    if f.get('echo'):
        for e in [].__class__(f['echo']) if isinstance(f['echo'], list) else [f['echo']]:
            if e not in ids: err('S4', f'finish.echo refers to unknown block id {e}')
    # interpolation refs
    blob = json.dumps(L)
    for ref in set(re.findall(r'\{\{(\w+)\}\}', blob)):
        if ref not in ids: err('S4', f'{{{{{ref}}}}} refers to unknown block id')
    # voice + fidelity
    srcc = canon(src)
    src_nums = set()
    for tok, core, val in numbers(src): src_nums.add(core.lstrip('0') or '0'); src_nums.add(core.replace(',', ''))
    src_nums |= {re.sub(r'\.0+$','',x) for x in list(src_nums)}
    words_all = [];
    for where, text, imagined, k in walk_text(L):
        p = plain(text)
        if '—' in text or ' -- ' in text or '&mdash;' in text: err('V1', f'{where}: em dash (the book uses none): {p[:70]!r}')
        pq = QUOTE.sub(lambda m: '' if in_source(m.group(1), canon(src)) else m.group(0), p)
        for pat in BANNED:
            if re.search(pat, pq, re.I): err('V2', f'{where}: banned phrase /{pat}/: {p[:70]!r}')
        if EMOJI.search(p): err('V2', f'{where}: emoji')
        if k in ('prose','fb','head'): words_all.append(p)
        if imagined: continue
        for tok, core, val in numbers(p):
            c = core.replace(',', '')
            c2 = re.sub(r'\.0+$','',c).lstrip('0') or '0'
            if val <= 12 and '.' not in core and not tok.startswith(('$','£','€')): continue
            if c in src_nums or c2 in src_nums: continue
            # money written as 812.02 vs 812, or 1,206 vs 1206: try integer part
            if c.split('.')[0] in src_nums and tok.startswith(('$','£','€')) and c.endswith('.00'): continue
            err('F1', f'{where}: number {tok!r} not found in the manuscript chapter: {p[:80]!r}')
        for q in quotes(text if '<' not in text else html.unescape(re.sub(r'<[^>]+>','',text))):
            if not in_source(q, srcc): err('F2', f'{where}: quotation not found in manuscript: “{q[:80]}”')
    for si, st in enumerate(steps):
        for b in st.get('blocks', []):
            if b.get('type') == 'quote' and not (st.get('imagined') or b.get('imagined')):
                if not in_source(plain(b.get('text','')), srcc): err('F2', f'step{si} quote block not found in manuscript: {plain(b.get("text",""))[:80]!r}')
            if b.get('type') == 'slider' and b.get('answer') is not None and not (st.get('imagined') or b.get('imagined')):
                a = str(b['answer']); a2 = re.sub(r'\.0+$','',a)
                if a not in src_nums and a2 not in src_nums: err('F1', f'step{si} slider {b.get("id")}: answer {a} not in manuscript')
            if b.get('type') in ('stat','waffle') and not (st.get('imagined') or b.get('imagined')):
                for key in ('value','total','hi'):
                    if key in b:
                        a = str(b[key]); a2 = re.sub(r'\.0+$','',a)
                        if a not in src_nums and a2 not in src_nums: err('F1', f'step{si} {b["type"]}: {key} {a} not in manuscript')
    sents = [s for p in words_all for s in re.split(r'(?<=[.!?])\s+', p) if len(s.split()) > 2]
    if sents:
        avg = sum(len(s.split()) for s in sents) / len(sents)
        if avg > 20: err('V3', f'average sentence length {avg:.1f} words (book voice: under 20)')
        long = [s for s in sents if len(s.split()) > 38]
        for s in long[:3]: warn('V3', f'long sentence ({len(s.split())} words): {s[:80]!r}')
    return E, W, {'steps': len(steps), 'interactive': len(act), 'types': sorted(distinct), 'device': L.get('device')}

def main():
    args = sys.argv[1:]
    files = sorted(glob.glob(os.path.join(ROOT, 'lessons', '*.js')))
    if args: files = [os.path.join(ROOT, 'lessons', a + '.js') for a in args]
    raw = subprocess.run(['node', os.path.join(ROOT, 'eval', 'dump.js')] + files, capture_output=True, text=True)
    if raw.returncode: print(raw.stderr); sys.exit(2)
    data = json.loads(raw.stdout)
    report = {}; fails = 0
    for f in files:
        lid = os.path.basename(f)[:-3]
        L = data.get(f, {})
        if '__error' in L:
            report[lid] = {'pass': False, 'errors': ['S0: does not load: ' + L['__error']], 'warnings': []}; fails += 1
            print(f'FAIL {lid}\n  S0: {L["__error"]}'); continue
        E, W, info = check(lid, L, source_for(lid))
        report[lid] = {'pass': not E, 'errors': E, 'warnings': W, **info}
        print(('PASS ' if not E else 'FAIL ') + lid + f"  steps={info['steps']} interactive={info['interactive']} types={','.join(info['types'])}")
        for e in E: print('  ERROR ' + e)
        for w in W: print('  warn  ' + w)
        fails += bool(E)
    os.makedirs(os.path.join(ROOT, 'eval', 'results'), exist_ok=True)
    out = os.path.join(ROOT, 'eval', 'results', 'static.json')
    prev = {}
    if args and os.path.exists(out):
        try: prev = json.load(open(out))
        except: prev = {}
    prev.update(report); json.dump(prev, open(out, 'w'), indent=1)
    print(f'\n{len(files) - fails}/{len(files)} lessons pass static evals')
    sys.exit(1 if fails else 0)

if __name__ == '__main__':
    main()

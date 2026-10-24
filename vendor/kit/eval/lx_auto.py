"""Automated learner-experience proxies, plus learner-view transcripts for simulated learners.

python3 eval/lx_auto.py            -> eval/results/lx_auto.json, eval/transcripts/<id>.md, table on stdout

Per lesson:
  grade      Flesch-Kincaid grade of everything the learner reads (target <= 9)
  sent       average sentence length in words (target < 16)
  first      words read before the first action (target <= 120)
  maxread    most words read on one step before its first action (target <= 150)
  prompts    share of interactive blocks with an explicit instruction (target 100%)
  acr        acronyms used but never expanded in the lesson (CISSP-common ones allowed)
  harsh      wrong-answer feedback that opens with a verdict instead of acknowledging the choice
  validate   share of wrong-answer feedback whose opener credits the choice before explaining its cost (target >= 50%; a word-list proxy, explanatory openers count as neutral)
  you        second-person density per 100 words (engagement proxy)
  passive    longest run of consecutive steps with no action (target <= 1)
  minutes    estimated minutes (200 wpm + 12 s per action) vs declared
"""
import json, os, re, subprocess, glob, html, statistics as st
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
ACTIVE = {'choice','toolkit','slider','tapfind','stop','sort','order','reflect','fill','cards','runaway','vigil','rate'}
# Acronyms the target learner already knows. Extend per course (this list suits a CISSP audience).
COMMON = set('MOST LEAST BEST FIRST URGENT OF OH NY EST PASS REQUIRED ACTION ACTIVE IT US UK CEO CISO CSO CISSP VPN MFA SEC FBI DOJ FTC OCC ICO GDPR HR IP PDF CVE UTC ET SOC DDoS PCI USB SMS AM PM OK API OS EU FOI WEP WPA SBOM BTC'.split())
VALIDATE = re.compile(r'^(<b>)?\s*(a |an |the )?(natural|reasonable|fair|tempting|understandable|common|sensible|careful|sharp|good instinct|a real|real|close|this is what|that is what|it is what|what most|the move|the reflex|plausible|honest|quick|true|right|intuitive|tidy|you could|fast|moving|smart|a good|good|useful|helpful|worth|planning|the research made|a step|safer|better)', re.I)
HARSH = re.compile(r'^(<b>)?\s*(no[.!,]|wrong|incorrect|not quite|nope|that is not|that\'s not)', re.I)

def plain(s): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', str(s or '')))).strip()
def syl(w):
    w = w.lower(); w = re.sub(r'[^a-z]', '', w)
    if not w: return 0
    if len(w) <= 3: return 1
    w = re.sub(r'(?:[^laeiouy]es|ed|[^laeiouy]e)$', '', w); w = re.sub(r'^y', '', w)
    return max(1, len(re.findall(r'[aeiouy]{1,2}', w)))
def fk(text):
    sents = [s for s in re.split(r'(?<=[.!?])\s+', text) if len(s.split()) > 1]
    words = re.findall(r"[A-Za-z][A-Za-z'’-]*", text)
    if not sents or not words: return 0, 0
    W = len(words); S = len(sents); Sy = sum(syl(w) for w in words)
    return round(0.39 * W / S + 11.8 * Sy / W - 15.59, 1), round(W / S, 1)

def block_reading(b):
    t = b.get('type'); out = []
    for k in ('html', 'text', 'caption', 'label'):
        if isinstance(b.get(k), str): out.append(b[k])
    if t == 'chat': out += [m.get('text', '') for m in b.get('messages', [])]
    if t == 'ledger': out += [' '.join(map(str, r[:2])) for r in b.get('rows', [])]
    return ' '.join(plain(x) for x in out)

def block_after(b):
    """text read while or after acting (prompt, options, feedback)"""
    out = [b.get('prompt', ''), b.get('fb', ''), b.get('reveal', ''), b.get('fbClose', ''), b.get('fbFar', '')]
    for o in b.get('options', []) or []: out += [o.get('text', ''), o.get('fb', '')]
    for n in b.get('nodes', []) or []: out += [n.get('who', ''), n.get('what', ''), n.get('fb', '')]
    for s in b.get('segments', []) or []: out += [s.get('text', ''), s.get('miss', ''), s.get('fb', '')]
    for it in b.get('items', []) or []:
        out += [it] if isinstance(it, str) else [it.get('text', ''), it.get('why', '')]
    for c in b.get('cards', []) or []: out += [c.get('front', ''), c.get('back', '')]
    for k, v in (b.get('outcomes') or {}).items(): out.append(v)
    return ' '.join(plain(x) for x in out)

def transcript(L):
    o = [f"# {plain(L['title'])}", f"_{L.get('kind')} · part {L.get('part')} · {L.get('minutes', 8)} min · device: {L.get('device', '')} · first button: {plain(L.get('cta') or 'Press to continue')}_", '']
    for si, s in enumerate(L['steps']):
        o.append(f"## Step {si}" + (f" · {plain(s.get('eyebrow'))}" if s.get('eyebrow') else '') + (' · IMAGINED SCENE' if s.get('imagined') else ''))
        if s.get('title'): o.append(f"**{plain(s['title'])}**")
        if s.get('lede'): o.append(f"_{plain(s['lede'])}_")
        for b in s.get('blocks', []):
            t = b.get('type'); tag = f"[{t}" + (f" · skin {b['skin']}" if b.get('skin') else '') + (' · paraphrased/reconstructed' if b.get('paraphrase') else '') + (' · imagined' if b.get('imagined') else '') + ']'
            o.append(tag)
            head = ' · '.join(plain(b.get(k)) for k in ('title', 'subject', 'from', 'to', 'date', 'filename', 'meta', 'tag') if b.get(k))
            if head: o.append(f"  ({head})")
            r = block_reading(b)
            if r: o.append('  ' + r)
            if b.get('prompt'): o.append(f"  PROMPT: {plain(b['prompt'])}")
            btn = b.get('button') or b.get('lockLabel') or b.get('startLabel')
            if btn: o.append(f"  BUTTON: {plain(btn)}")
            if t == 'choice':
                for k, op in enumerate(b.get('options', [])): o.append(f"  ({'ABCDE'[k]}) {plain(op.get('text'))}\n      -> feedback: {plain(op.get('fb'))}")
            if t == 'stop':
                for k, n in enumerate(b.get('nodes', [])): o.append(f"  link {k+1} [{plain(n.get('short'))}] {plain(n.get('who'))}. {plain(n.get('what'))}{'  (CONTROL)' if n.get('stop') else ''}\n      -> feedback: {plain(n.get('fb'))}")
                if b.get('afterNote') is not None: o.append(f"  after-note: {b.get('afterNote')}")
            if t == 'tapfind':
                for sg in b.get('segments', []): o.append(f"  - {plain(sg.get('text'))}{'  (THE ANSWER)' if sg.get('hit') else ''}")
                o.append(f"  -> feedback when found: {plain(b.get('fb'))}")
            if t in ('sort',):
                o.append(f"  folders: {' | '.join(plain(x) for x in b.get('buckets', []))}")
                for it in b.get('items', []): o.append(f"  - {plain(it.get('text'))} -> {plain(b['buckets'][it['bucket']])}: {plain(it.get('why'))}")
            if t == 'order':
                o.append('  correct order: ' + ' > '.join(plain(x) for x in b.get('items', [])))
            if t in ('slider',):
                o.append(f"  range {b.get('min')}-{b.get('max')} {b.get('unit','')}; answer {b.get('answer')}; reveal: {plain(b.get('reveal'))}")
            if t == 'toolkit': o.append(f"  answer question(s) {b.get('answer')}; feedback: {plain(b.get('fb'))}")
            if t == 'runaway': o.append(f"  counter {b.get('counter')} up to {b.get('max')} {b.get('unit','')}; outcomes: " + ' / '.join(f"{k}: {plain(v)}" for k, v in (b.get('outcomes') or {}).items()))
            if t == 'vigil': o.append(f"  rounds: {len(b.get('rounds', []))}; feedback: {plain(b.get('fb'))}")
            if t in ('reflect', 'fill'):
                for f in b.get('fields', []) or []: o.append(f"  field: {plain(f.get('label'))}")
            if t == 'cards':
                for c in b.get('cards', []): o.append(f"  card: {plain(c.get('front'))} / back: {plain(c.get('back'))}")
            if t == 'stat': o.append(f"  {b.get('pre','')} {b.get('prefix','')}{b.get('value')}{b.get('suffix','')}: {plain(b.get('label'))}")
            if t == 'quote': o.append(f"  cite: {plain(b.get('cite'))}")
        o.append('')
    f = L.get('finish', {})
    o.append('## Finish'); o.append(f"**{plain(f.get('headline'))}**"); o.append('Take this to work: ' + plain(f.get('takeaway'))); o.append('Sit with: ' + plain(f.get('sit')))
    return '\n'.join(o)

def main():
    files = sorted(glob.glob(os.path.join(ROOT, 'lessons', '*.js')))
    data = json.loads(subprocess.run(['node', os.path.join(HERE, 'dump.js')] + files, capture_output=True, text=True).stdout)
    order = json.load(open(os.path.join(ROOT, 'course.json')))['order']
    os.makedirs(os.path.join(HERE, 'transcripts'), exist_ok=True)
    rep = {}
    for f, L in data.items():
        lid = L['id']; open(os.path.join(HERE, 'transcripts', lid + '.md'), 'w').write(transcript(L))
        alltext = []; first = None; acc = 0; maxread = 0; prompts = [0, 0]; wrongfb = []; actions = 0; passive = 0; runp = 0
        for si, s in enumerate(L['steps']):
            pre = ' '.join(plain(s.get(k)) for k in ('title', 'lede')); alltext.append(pre)
            read = len(pre.split()); acted = False
            for b in s.get('blocks', []):
                r = block_reading(b); a = block_after(b); alltext += [r, a]
                if not acted: read += len(r.split())
                if b.get('type') in ACTIVE:
                    actions += 1; prompts[1] += 1; prompts[0] += bool(plain(b.get('prompt')) or b.get('type') in ('stop', 'toolkit'))
                    if not acted:
                        acted = True
                        if first is None: first = acc + read
                    for o in b.get('options', []) or []:
                        if not o.get('correct') and any(x.get('correct') for x in b['options']): wrongfb.append(o.get('fb', ''))
                    for n in b.get('nodes', []) or []:
                        if not n.get('stop'): wrongfb.append(n.get('fb', ''))
            acc += read; maxread = max(maxread, read)
            runp = 0 if acted else runp + 1; passive = max(passive, runp)
        text = ' '.join(alltext); g, sl = fk(text); words = len(text.split())
        acrs = set(re.findall(r'\b[A-Z][A-Z0-9]{1,6}s?\b', text)) - COMMON
        acrs = {a for a in acrs if not re.search(r'\(' + re.escape(a.rstrip('s')) + r'\)|' + re.escape(a.rstrip('s')) + r'\s*\(|called ' + re.escape(a.rstrip('s')) + r'|' + re.escape(a.rstrip('s')) + r', (the|a|an) ', text) and not a.isdigit() and not re.match(r'^[A-Z]\d', a)}
        val = [bool(VALIDATE.search(plain(x)) or VALIDATE.search(x)) for x in wrongfb]
        harsh = sum(bool(HARSH.search(x)) for x in wrongfb)
        you = round(100 * len(re.findall(r'\byou(r|rs|rself)?\b', text, re.I)) / max(1, words), 1)
        est = round(words / 200 + actions * 12 / 60, 1)
        rep[lid] = {'grade': g, 'sent': sl, 'first': first, 'maxread': maxread, 'prompts': round(100 * prompts[0] / max(1, prompts[1])),
                    'acr': sorted(acrs), 'harsh': harsh, 'validate': round(100 * sum(val) / max(1, len(val))), 'you': you,
                    'passive': passive, 'words': words, 'actions': actions, 'est_min': est, 'declared_min': L.get('minutes', 8)}
    json.dump(rep, open(os.path.join(HERE, 'results', 'lx_auto.json'), 'w'), indent=1)
    print(f"{'id':8}{'grade':>6}{'sent':>6}{'first':>6}{'maxrd':>6}{'prmt%':>6}{'val%':>6}{'harsh':>6}{'you':>5}{'pass':>5}{'est/decl':>10}  undefined acronyms")
    for lid in order:
        r = rep.get(lid)
        if not r: continue
        print(f"{lid:8}{r['grade']:>6}{r['sent']:>6}{r['first'] or 0:>6}{r['maxread']:>6}{r['prompts']:>6}{r['validate']:>6}{r['harsh']:>6}{r['you']:>5}{r['passive']:>5}{str(r['est_min'])+'/'+str(r['declared_min']):>10}  {', '.join(r['acr'][:6])}")
    R = [rep[k] for k in order if k in rep]
    def m(k): return round(st.mean(x[k] for x in R), 1)
    print(f"\nmeans: grade {m('grade')} | sentence {m('sent')} | words before first action {m('first')} | max read/step {m('maxread')} | prompts {m('prompts')}% | wrong-answer feedback that acknowledges the choice {m('validate')}% | harsh openers {sum(x['harsh'] for x in R)} | longest passive run {max(x['passive'] for x in R)} | undefined acronyms {sum(len(x['acr']) for x in R)}")
    print('targets: grade <= 9, sentence < 16, first <= 120, max read <= 150, prompts 100%, acknowledge >= 50%, harsh 0, passive <= 1')

if __name__ == '__main__': main()

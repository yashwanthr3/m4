// Writes the SAMPLE pattern catalogue (vendor/patterns) used until the real 135-pattern
// catalogue is vendored with `npm run vendor:diff -- patterns <dir>`. Numbers 901-906 never
// collide with real catalogue numbers. Every page follows vendor/patterns/CONTRACT.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'vendor/patterns');
fs.mkdirSync(path.join(OUT, 'pages'), { recursive: true });

const TOKENS = `--bg:#f6f6f1;--surface:#efefe9;--surface-2:#e9ebe5;--ink:#16181b;--ink-2:#43484e;--muted:#575d63;--line:#c9ccc3;
--accent:#2450b8;--on-accent:#f6f6f1;--accent-soft:#dfe2da;--good:#1d7448;--good-soft:#d7ecdf;--bad:#b3261b;--bad-soft:#f5dcd8;--warn:#765000;--warn-soft:#f6e9c4;
--font-body:system-ui,sans-serif;--font-display:Georgia,serif;--font-sign:"Arial Narrow",sans-serif`;

const BASE = `*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--font-body);font-size:16px;line-height:1.5}
.pattern{padding:18px 18px 20px;max-width:720px;margin:0 auto}
.sit{font-family:var(--font-display);font-size:19px;margin:0 0 14px;color:var(--ink)}
.say{margin:0 0 10px;color:var(--ink-2)}
.stage{position:relative;min-width:0}
button{font:inherit;cursor:pointer}
.act{border:0;border-radius:999px;background:var(--accent);color:var(--on-accent);padding:12px 22px;font-weight:600;min-height:44px}
.act:disabled{opacity:.5;cursor:default}
.ghost{border:1.5px solid var(--line);border-radius:999px;background:transparent;color:var(--ink-2);padding:10px 18px;min-height:44px}
.opt{display:block;width:100%;text-align:left;border:1.5px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);padding:12px 14px;margin:0 0 8px;min-height:48px}
.opt:hover,.opt:focus-visible{border-color:var(--accent);outline:none}
.opt.pick{border-color:var(--accent);background:var(--accent-soft)}
.cons{margin-top:14px;padding:12px 14px;border-radius:12px;border-left:4px solid var(--line);background:var(--surface)}
.cons.good{border-color:var(--good);background:var(--good-soft)}
.cons.bad{border-color:var(--bad);background:var(--bad-soft)}
.cons.warn{border-color:var(--warn);background:var(--warn-soft)}
.why{color:var(--ink-2);margin:10px 0 0}
.remember{margin-top:14px;border:1.5px dashed var(--accent);border-radius:14px;padding:12px 14px;display:flex;gap:12px;align-items:flex-start;background:var(--bg)}
.remember b{display:block;font-family:var(--font-sign);letter-spacing:.08em;text-transform:uppercase;font-size:13px;color:var(--muted)}
.remember .ic{font-size:26px;line-height:1}
.row{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
[hidden]{display:none!important}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}`;

const ADAPTER = `<script id="trust-adapter">
/* Theme adapter: do not edit. Receives {type:'trust-theme',vars,theme,only}; reports height and the gate. */
(function(){
  var N = Number(document.querySelector('.pattern').dataset.n);
  window.addEventListener('message', function(ev){
    var d = ev.data || {};
    if (d.type !== 'trust-theme') return;
    var r = document.documentElement;
    Object.keys(d.vars || {}).forEach(function(k){ if (d.vars[k]) r.style.setProperty(k, d.vars[k]); });
    r.dataset.scheme = d.theme || 'light';
    height();
  });
  function height(){ try { parent.postMessage({type:'trust-height', h: document.documentElement.scrollHeight, n: N}, '*'); } catch(e){} }
  if (window.ResizeObserver) new ResizeObserver(height).observe(document.body);
  window.addEventListener('load', height);
  window.trustGate = function(event){ try { parent.postMessage({type:'trust-pattern', event: event || 'remember', n: N}, '*'); } catch(e){} };
})();
</script>`;

const HELPERS = `const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches||window.__FAST;
const wait=ms=>new Promise(r=>setTimeout(r,reduce?0:ms));
function show(id,html,tone){const e=$(id);e.innerHTML=html;e.hidden=false;if(tone){e.className='cons '+tone;}}
function remember(){ $('.remember').hidden=false; $('.replay').hidden=false; window.trustGate&&window.trustGate('remember'); }
function reset(){ $$('.cons,.why,.remember,.replay').forEach(e=>e.hidden=true); }`;

function page(p) {
  return `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${p.n} · ${p.name}</title>
<style>:root{${TOKENS}}
${BASE}
/* ${p.n} — ${p.name} */
${p.css}</style></head>
<body>
<section class="pattern" id="p${p.n}" data-n="${p.n}" data-theme="${p.theme}" data-gesture="${p.gesture}" data-mechanic="${p.mechanic}" data-nearest="${p.nearest ?? ''}" data-differs="${p.differs ?? ''}">
<p class="sit">${p.situation}</p>
<div class="stage">${p.html}</div>
<div class="cons" id="c${p.n}" hidden role="status"></div>
<p class="why" id="w${p.n}" hidden>${p.why}</p>
<div class="remember" hidden><span class="ic" aria-hidden="true">${p.icon}</span><div><b>Remember</b>${p.learns}</div></div>
<div class="row"><button class="ghost replay" hidden>Try again</button></div>
</section>
<script>
${HELPERS}
/* ${p.n} — ${p.name} */ (() => { ${p.js} })();
</script>
${ADAPTER}
</body></html>
`;
}

const P = [
  {
    n: 901, slug: 'HOLD', name: 'Hold before you send', theme: 'mirror', gesture: 'hold', course: 'mixed',
    audience: 'everyone', topics: ['urgency', 'payments', 'social engineering', 'pause'], novelty: 'gesture',
    mechanic: 'press and hold send for three seconds while the urgent note pulses', icon: '⏳',
    learns: 'An urgent request is the moment to slow down, not speed up.',
    situation: 'A note from "the director" asks you to send a payment in the next five minutes.',
    why: 'Pressure is a tool. A short pause gives you time to notice what is wrong.',
    css: `.note901{border:1.5px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--surface);margin-bottom:12px}
.note901.pulse{animation:p901 1s infinite}@keyframes p901{50%{border-color:var(--warn)}}
.hold901{position:relative;overflow:hidden;width:100%;max-width:340px}
.hold901 i{position:absolute;inset:0;width:0;background:color-mix(in srgb,var(--on-accent) 30%,transparent);pointer-events:none}
.flag901{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.flag901 span{border-radius:999px;padding:4px 10px;background:var(--warn-soft);color:var(--warn);font-size:14px}`,
    html: `<div class="note901 pulse" id="n901"><b>From: director@brightway-pay.example</b><br>Send 9,400 to the new supplier account now. I am in a meeting. Do not call.</div>
<p class="say">Hold the button to send. Let go early to stop and look again.</p>
<button class="act hold901" id="h901" aria-describedby="n901"><i></i><span>Hold to send</span></button>
<div class="flag901" id="f901" hidden><span>Sender domain is new</span><span>"Do not call"</span><span>New account</span></div>`,
    js: `const b=$('#h901'),bar=$('i',b),f=$('#f901');let t0=0,raf=0,sent=false,looked=false;
function tick(){const p=Math.min(1,(performance.now()-t0)/(reduce?300:3000));bar.style.width=(p*100)+'%';if(p>=1){done(true);return;}raf=requestAnimationFrame(tick);}
function start(e){if(sent)return;e.preventDefault();t0=performance.now();raf=requestAnimationFrame(tick);}
function stop(){if(sent)return;cancelAnimationFrame(raf);const p=parseFloat(bar.style.width)||0;bar.style.width='0';if(p>5){looked=true;f.hidden=false;done(false);}}
function done(s){sent=true;cancelAnimationFrame(raf);$('#n901').classList.remove('pulse');
 if(s) show('#c901','<b>Sent.</b> The money left. Three warning signs were on the note: a new domain, "do not call", a new account.','bad');
 else show('#c901','<b>You stopped.</b> In the pause you can see three warning signs. Next step: call the director on the number you already have.','good');
 f.hidden=false;$('#w901').hidden=false;remember();}
b.addEventListener('pointerdown',start);b.addEventListener('pointerup',stop);b.addEventListener('pointerleave',stop);
b.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat)start(e);});b.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter')stop();});
$('.replay').onclick=()=>{sent=false;looked=false;bar.style.width='0';f.hidden=true;$('#n901').classList.add('pulse');reset();};
window.__autoplay=async(path)=>{ if(path==='right'){t0=performance.now();bar.style.width='40%';stop();} else {done(true);} };`
  },
  {
    n: 902, slug: 'CALLBACK', name: 'Call back on a number you trust', theme: 'briefing', gesture: 'tap-choose', course: 'cyber',
    audience: 'everyone', topics: ['verification', 'vishing', 'payments', 'out-of-band'], novelty: null,
    mechanic: 'choose which phone number to dial from the email, the signature or your own directory', icon: '📞',
    learns: 'Check a request through a channel you already had, never one the request gives you.',
    situation: 'A supplier email says their bank details changed. It gives a number to "confirm".',
    why: 'Anyone can write a phone number in an email. Your own records were made before the attacker arrived.',
    css: `.dial902{display:grid;gap:8px}.dial902 .opt small{display:block;color:var(--muted)}`,
    html: `<p class="say">Which number do you call to check?</p><div class="dial902" id="d902">
<button class="opt" data-k="email">0161 496 0731<small>Written in the email body</small></button>
<button class="opt" data-k="sig">0161 496 0198<small>In the email signature</small></button>
<button class="opt" data-k="dir">0161 496 0004<small>In your supplier directory from last year</small></button></div>`,
    js: `const fb={email:['bad','<b>The person who answers wrote the email.</b> They will "confirm" the new account.'],
sig:['bad','<b>The signature is part of the same email.</b> If the email is fake, so is the signature.'],
dir:['good','<b>You reach the real supplier.</b> They have not changed their bank details.']};
let picked=false;$$('#d902 .opt').forEach(b=>b.onclick=()=>{if(picked)return;picked=true;b.classList.add('pick');const [t,h]=fb[b.dataset.k];show('#c902',h,t);$('#w902').hidden=false;remember();});
$('.replay').onclick=()=>{picked=false;$$('#d902 .opt').forEach(b=>b.classList.remove('pick'));reset();};
window.__autoplay=async(path)=>{$('#d902 [data-k="'+(path==='right'?'dir':'email')+'"]').click();};`
  },
  {
    n: 903, slug: 'REVOKE', name: 'Revoke on the last day', theme: 'yard', gesture: 'watch-and-intervene', course: 'cyber',
    audience: 'everyone', topics: ['access', 'leavers', 'offboarding', 'revocation'], novelty: null,
    mechanic: 'tap leaver badges as they drift towards the door before they cross it', icon: '🚪',
    learns: 'Remove access on the day a person leaves, every time.',
    situation: 'It is the end of the month. Five people leave today. Their badges still open every door.',
    why: 'Old access is an open door. Removing it the same day is a habit, not a project.',
    css: `.lane903{position:relative;height:220px;border:1.5px solid var(--line);border-radius:12px;background:var(--surface);overflow:hidden}
.door903{position:absolute;right:0;top:0;bottom:0;width:46px;background:var(--surface-2);border-left:3px solid var(--ink-2);display:grid;place-items:center;font-size:22px}
.badge903{position:absolute;left:8px;min-width:96px;padding:6px 10px;border-radius:10px;border:1.5px solid var(--accent);background:var(--bg);color:var(--ink);font-size:14px;transition:left linear}
.badge903.off{border-color:var(--good);background:var(--good-soft);text-decoration:line-through}
.badge903.out{border-color:var(--bad);background:var(--bad-soft)}
.score903{font-family:var(--font-sign);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-top:8px}`,
    html: `<p class="say">Tap each badge to revoke it before it reaches the door.</p>
<div class="lane903" id="l903"><div class="door903" aria-hidden="true">🚪</div></div>
<div class="score903" id="s903">Revoked 0 of 5</div><div class="row"><button class="act" id="go903">Start the day</button></div>`,
    js: `const names=['A. Okafor','J. Lind','M. Sato','R. Haddad','T. Byrne'];let off=0,out=0,live=[],ended=false;
const lane=$('#l903');
function end(){if(ended)return;ended=true;live.forEach(x=>clearTimeout(x));
 if(out===0) show('#c903','<b>All five badges revoked.</b> No old access left the building today.','good');
 else show('#c903','<b>'+out+' badge'+(out>1?'s':'')+' still work'+(out>1?'':'s')+'.</b> Each one is a door that stays open after the person has gone.', out>2?'bad':'warn');
 $('#w903').hidden=false;remember();}
function spawn(i){const b=document.createElement('button');b.className='badge903';b.textContent=names[i];b.style.top=(12+i*40)+'px';lane.appendChild(b);
 const W=lane.clientWidth-150;const dur=reduce?200:(4200-i*350);
 requestAnimationFrame(()=>{b.style.transitionDuration=dur+'ms';b.style.left=W+'px';});
 b.onclick=()=>{if(b.dataset.s)return;b.dataset.s=1;b.classList.add('off');b.style.left=getComputedStyle(b).left;off++;$('#s903').textContent='Revoked '+off+' of 5';if(off+out===5)end();};
 live.push(setTimeout(()=>{if(b.dataset.s)return;b.dataset.s=1;b.classList.add('out');out++;if(off+out===5)end();},dur+30));}
$('#go903').onclick=()=>{$('#go903').disabled=true;names.forEach((_,i)=>live.push(setTimeout(()=>spawn(i),reduce?0:i*600)));};
$('.replay').onclick=()=>{off=0;out=0;ended=false;live=[];$$('.badge903',lane).forEach(b=>b.remove());$('#s903').textContent='Revoked 0 of 5';$('#go903').disabled=false;reset();};
window.__autoplay=async(path)=>{$('#go903').click();await new Promise(r=>setTimeout(r,reduce?50:3000));if(path==='right')$$('.badge903:not(.off):not(.out)',lane).forEach(b=>b.click());else await new Promise(r=>setTimeout(r,reduce?400:4500));};`
  },
  {
    n: 904, slug: 'DIAL', name: 'How sure are you?', theme: 'mirror', gesture: 'slider', course: 'ai',
    audience: 'everyone', topics: ['ai output', 'calibration', 'overconfidence', 'verification'], novelty: null,
    mechanic: 'set a confidence dial for each assistant answer, then see which were true', icon: '🎯',
    learns: 'A fluent answer is not a checked answer. Match your trust to the evidence.',
    situation: 'An assistant gives you three answers for a report due today. All three sound sure.',
    why: 'Confidence in your head should follow evidence, not the tone of the answer.',
    css: `.q904{border:1.5px solid var(--line);border-radius:12px;padding:10px 12px;background:var(--surface);margin-bottom:10px}
.q904 label{display:flex;justify-content:space-between;color:var(--muted);font-size:14px;margin-top:6px}
.q904 input{width:100%;accent-color:var(--accent);min-height:32px}
.q904.t{border-color:var(--good)}.q904.f{border-color:var(--bad)}`,
    html: `<p class="say">Set how sure you are that each answer is true. Then check.</p>
<div class="q904" data-t="1">"The policy took effect in March."<label><span>Not sure</span><output>50%</output><span>Certain</span></label><input type="range" min="0" max="100" value="50" aria-label="Confidence in answer one"></div>
<div class="q904" data-t="0">"The policy covers contractors too."<label><span>Not sure</span><output>50%</output><span>Certain</span></label><input type="range" min="0" max="100" value="50" aria-label="Confidence in answer two"></div>
<div class="q904" data-t="0">"Section 4 was removed last year."<label><span>Not sure</span><output>50%</output><span>Certain</span></label><input type="range" min="0" max="100" value="50" aria-label="Confidence in answer three"></div>
<div class="row"><button class="act" id="ck904">Check the answers</button></div>`,
    js: `$$('.q904 input').forEach(i=>i.oninput=()=>i.parentNode.querySelector('output').textContent=i.value+'%');
$('#ck904').onclick=()=>{$('#ck904').disabled=true;let gap=0;$$('.q904').forEach(q=>{const t=q.dataset.t==='1';const v=+q.querySelector('input').value;q.classList.add(t?'t':'f');gap+=Math.abs((t?100:0)-v);q.querySelector('input').disabled=true;});
 const g=Math.round(gap/3);show('#c904','<b>Only one of three was true.</b> Your average distance from the truth: '+g+' points. '+(g>45?'The tone pulled your trust up.':'You held your trust back until you checked.'),g>45?'warn':'good');$('#w904').hidden=false;remember();};
$('.replay').onclick=()=>{$$('.q904').forEach(q=>{q.classList.remove('t','f');const i=q.querySelector('input');i.disabled=false;i.value=50;i.oninput();});$('#ck904').disabled=false;reset();};
window.__autoplay=async(path)=>{const v=path==='right'?[90,10,10]:[95,95,95];$$('.q904 input').forEach((i,k)=>{i.value=v[k];i.oninput();});$('#ck904').click();};`
  },
  {
    n: 905, slug: 'MATCH', name: 'Does the change match the ticket?', theme: 'casebook', gesture: 'tap-choose', course: 'tech',
    audience: 'everyone', topics: ['change control', 'approval', 'scope', 'deployment'], novelty: null,
    mechanic: 'tap the line in the deployed change that the approved ticket never mentioned', icon: '🧾',
    learns: 'Compare what was deployed with what was approved, line by line.',
    situation: 'A change was approved on Monday. On Friday you read what was actually deployed.',
    why: 'Approval covers what was written down. Anything extra was never approved.',
    css: `.two905{display:grid;grid-template-columns:1fr 1fr;gap:12px}.two905>div{min-width:0;border:1.5px solid var(--line);border-radius:12px;padding:10px 12px;background:var(--surface)}
.two905 h4{margin:0 0 6px;font-family:var(--font-sign);letter-spacing:.08em;text-transform:uppercase;font-size:13px;color:var(--muted)}
.ln905{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid var(--line);background:transparent;color:var(--ink);padding:9px 4px;min-height:44px}
.ln905:hover,.ln905:focus-visible{background:var(--accent-soft);outline:none}.ln905.hit{background:var(--good-soft)}.ln905.miss{background:var(--bad-soft)}
@media (max-width:560px){.two905{grid-template-columns:1fr}}`,
    html: `<p class="say">Tap the deployed line that the ticket did not approve.</p><div class="two905">
<div><h4>Approved ticket</h4><p>Update the login page text.</p><p>Fix the date format on receipts.</p></div>
<div><h4>Deployed change</h4><button class="ln905">Login page text updated</button><button class="ln905" data-hit="1">Admin role added to service account</button><button class="ln905">Receipt date format fixed</button></div></div>`,
    js: `let tries=0,ok=false;$$('.ln905').forEach(b=>b.onclick=()=>{if(ok)return;tries++;if(b.dataset.hit){ok=true;b.classList.add('hit');
 show('#c905',tries===1?'<b>Found on the first look.</b> A new admin role was never in the ticket, so no one approved it.':'<b>Found it.</b> The text and date lines match the ticket. The admin role does not.',tries===1?'good':'warn');$('#w905').hidden=false;remember();}
 else{b.classList.add('miss');}});
$('.replay').onclick=()=>{tries=0;ok=false;$$('.ln905').forEach(b=>b.classList.remove('hit','miss'));reset();};
window.__autoplay=async(path)=>{if(path==='wrong')$$('.ln905')[0].click();$('.ln905[data-hit]').click();};`
  },
  {
    n: 906, slug: 'RIPPLE', name: 'How far does it spread?', theme: 'control', gesture: 'slider', course: 'privacy',
    audience: 'everyone', topics: ['sharing', 'data minimisation', 'audience', 'oversharing'], novelty: 'medium-as-mechanic',
    mechanic: 'drag the sharing scope and watch ripples reach more rings of people', icon: '🌊',
    learns: 'Share personal data with the smallest group that needs it.',
    situation: 'You are sharing a spreadsheet of customer complaints. It has names and phone numbers.',
    why: 'Each wider ring is more people who can copy the data. You cannot pull it back.',
    css: `.rings906{position:relative;height:220px;display:grid;place-items:center}
.rings906 span{position:absolute;border-radius:50%;border:2px solid var(--line);pointer-events:none;transition:border-color .3s,background .3s}
.rings906 span.on{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 8%,transparent)}
.lbl906{text-align:center;font-family:var(--font-sign);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-2)}
.sl906{width:100%;accent-color:var(--accent);min-height:32px}`,
    html: `<div class="rings906" id="r906" aria-hidden="true"><span style="width:50px;height:50px"></span><span style="width:110px;height:110px"></span><span style="width:160px;height:160px"></span><span style="width:210px;height:210px"></span></div>
<p class="lbl906" id="t906">Only me</p><input class="sl906" id="s906" type="range" min="0" max="3" value="0" aria-label="Who can open the file">
<div class="row"><button class="act" id="sh906">Share the file</button></div>`,
    js: `const L=['Only me','My team (6 people)','The whole company (2,000 people)','Anyone with the link'];
const s=$('#s906');s.oninput=()=>{$('#t906').textContent=L[s.value];$$('#r906 span').forEach((r,i)=>r.classList.toggle('on',i<=+s.value));};s.oninput();
$('#sh906').onclick=()=>{$('#sh906').disabled=true;s.disabled=true;const v=+s.value;
 const m=[['warn','<b>Only you can open it.</b> The team that handles complaints still cannot work on it.'],['good','<b>Six people who need it can open it.</b> No one else can.'],['bad','<b>2,000 people can open names and phone numbers.</b> Most of them never needed to.'],['bad','<b>Anyone who gets the link can open it.</b> Links get forwarded.']][v];
 show('#c906',m[1],m[0]);$('#w906').hidden=false;remember();};
$('.replay').onclick=()=>{s.disabled=false;s.value=0;s.oninput();$('#sh906').disabled=false;reset();};
window.__autoplay=async(path)=>{s.value=path==='right'?1:3;s.oninput();$('#sh906').click();};`
  }
];

const catalogue = {
  version: 'sample-1',
  note: 'SAMPLE catalogue (6 patterns, numbers 901-906). Replace with the real 135-pattern catalogue: see vendor/patterns/README.md.',
  patterns: P.map(p => ({
    n: p.n, slug: p.slug, name: p.name, mechanic: p.mechanic, learns: p.learns, theme: p.theme,
    audience: p.audience, course: p.course, topics: p.topics, gesture: p.gesture, novelty: p.novelty,
    page: `pages/${p.n}.html`
  }))
};
fs.writeFileSync(path.join(OUT, 'catalogue.json'), JSON.stringify(catalogue, null, 1) + '\n');
for (const p of P) fs.writeFileSync(path.join(OUT, 'pages', `${p.n}.html`), page(p));
console.log('wrote', P.length, 'sample patterns to', OUT);

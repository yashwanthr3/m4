/* Who Could Have Said Stop? — course engine v2 ("The Evidence Room").
   Lessons register with COURSE.lesson({...}) before this file runs. */
(function(){
'use strict';
const C = window.COURSE;
const FAST = !!window.__FAST;
document.documentElement.lang=document.documentElement.lang||'en';
if(FAST) document.documentElement.classList.add('fast');
const $ = (s,r=document)=>r.querySelector(s);
const h = (tag, cls, html)=>{const e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e;};
const esc = s=>String(s==null?'':s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
const fmt = (n,d=0)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const wait = ms=>FAST?Math.min(ms,30):ms;
const LETTERS='ABCDEFGHIJ';
let UID=0;
const WORDS=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten'];
/* ---------------- course config: every course-specific word lives here ----------------
   Defaults reproduce "Who Could Have Said Stop?". A course overrides any key in course.json -> COURSE.config. */
const DEFAULTS={
  id:'wcss',
  title:'Who Could Have Said Stop?',
  heroHTML:'Who could have said <em>stop?</em>',
  mast:'Who could have said stop?',
  ring:'WHO COULD HAVE SAID STOP?',
  sub:'Real AI failures, replayed so you make the calls. Every case ends at the same question: where was the stop button, and who was standing next to it?',
  footer:'Built from the manuscript <i>Who Could Have Said Stop?</i> (October 2026). Every real fact has a source in its lesson.',
  questions:[
    'Who answers for it?',
    'What is it allowed to do, how much and how fast?',
    'Who checks its work, apart from the people who built it?',
    'What record will show what happened?',
    'If it gets something wrong about you, how do you get it fixed?',
    'When does someone look at it again?',
    'What is it really rewarded for?',
    'Is the safe way also the easy way?'
  ],
  parts:{
    0:{name:'Start here',job:'',desc:'Why AI failures keep happening, and the eight questions that catch them.',special:true,mark:'\u2022'},
    1:{name:'When AI talks for you',job:'Talks',desc:'Chatbots and AI answers that speak in a company\u2019s name, or in yours.'},
    2:{name:'When AI judges people',job:'Judges',desc:'Software that decides who gets hired, graded, treated, matched or paid.'},
    3:{name:'When AI acts',job:'Acts',desc:'Agents that buy, delete and obey, using permissions someone gave them.'},
    4:{name:'When the ground shifts',job:'Ground shifts',desc:'Updates, changing terms, leaked chats and faked faces.'},
    5:{name:'Taking it back',job:'Takes it back',desc:'The eight questions at work, as a customer and as a citizen.'},
    6:{name:'Closing',job:'',desc:'The version where someone said stop.',special:true,mark:'\u25A0'}
  },
  t:{
    lessonsEyebrow:'An interactive course in {n} lessons', points:'insight', pressBegin:'Press to begin', pressContinue:'Press to continue',
    frameworkTitle:'The eight questions', frameworkHint:'Each lesson trains one or more. Tap a card to see where.',
    ladderTitle:'Each part hands AI a bigger job', ladderPrefix:'AI ', ladderNote:'The last step hands the stop button back to you',
    pathTitle:'The casebook', chapter:'Chapter', checkpoint:'Part {p} checkpoint', intro:'Introduction', closing:'Closing',
    coverCap:'{N} hands on this case. {K} could have said stop.', coverOne:'One of them', coverMany:'{K} of them',
    finishOne:'The stop button belonged at link {links}.', finishMany:'Links {links} were each a place someone could have said stop.',
    finishAfterOne:' After that, the rest need not have happened.', finishAfterMany:' After the last of them, the rest need not have happened.',
    finishNoAfter:'The stop button belonged at {linkword} {links}.',
    afterNote:'From here on, none of this needed to happen.',
    stopPrompt:'Who could have said stop?', stopHint:'Tap the link in the chain where the stop button belonged.', stopHintMany:' There are {n} to find.', stopAria:'Place the stop button at: ',
    toolkitPrompt:'Which of the eight questions does this case turn on?',
    recapNone:'{N} cases, {n} stop buttons. This checkpoint brings them together.', recapSome:'You have found the stop button in {k} of these {n} cases.', recapAll:'You found the stop button in all {n} cases of this part. Now use it on your own.',
    recapFinish:'{N} cases, {n} stop buttons, all in your hands now. ', recapNext:'The next part hands AI a bigger job.', recapLast:'The closing shows the version where someone used one.',
    cpMark:'TRY IT', sortAlso:'Defensible, and it counts. The best fit is', qrefButton:'8Q', qrefTitle:'The eight questions', qrefClose:'Close',  nextLabel:'Next', needLabel:'Make your call above to continue',  stampFound:'STOP FOUND', stampCheckpoint:'STOPS HELD', stampClosing:'STOPPED IN TIME', stampPlain:'CLOSED',
    closed:'Case closed', checkpointDone:'Checkpoint complete', takeaway:'Take this with you', trained:'Questions trained', wrote:'What you wrote',
    lastSit:'One last thing to sit with', elsewhere:'Elsewhere \u00B7 the same gap, other places', sources:'Sources', sit:'Sit with this', reflect:'Write before you read on',
    firstTry:'first-try calls', streakDay:'day in a row', streakDays:'days in a row', reset:'Reset my progress', resetConfirm:'Tap again to erase all progress',
    nextCase:'Next case', nextCheckpoint:'Next: checkpoint', nextClosing:'Next: the closing', backToCourse:'Back to the course', closeCase:'Close the case'
  },
  theme:{}   /* optional: {light:{'--stop':'#..'}, dark:{...}} overrides engine tokens */
};
const CFG=(()=>{ const u=C.config||{}; const o=Object.assign({},DEFAULTS,u); o.t=Object.assign({},DEFAULTS.t,u.t||{}); o.parts=u.parts||DEFAULTS.parts; o.questions=u.questions||DEFAULTS.questions; return o; })();
const T=(k,v)=>String(CFG.t[k]==null?k:CFG.t[k]).replace(/\{(\w+)\}/g,(m,x)=>v&&v[x]!=null?v[x]:m);
const QUESTIONS=CFG.questions, PARTS=CFG.parts;
const CONTENT_PARTS=Object.keys(PARTS).map(Number).filter(p=>!PARTS[p].special).sort((a,b)=>a-b);
C.QUESTIONS=QUESTIONS; C.PARTS=PARTS; C.CFG=CFG;
if(CFG.theme&&(CFG.theme.light||CFG.theme.dark)){ const v=o=>Object.entries(o||{}).map(([k,x])=>k+':'+x).join(';'); const st=document.createElement('style');
  st.textContent=':root{'+v(CFG.theme.light)+'}@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){'+v(CFG.theme.dark)+'}}:root[data-theme="dark"]{'+v(CFG.theme.dark)+'}'; document.head.appendChild(st); }

/* ---------------- progress store ---------------- */
const KEY=CFG.id+'-course-v1';
let P={done:{},xp:0,refl:{},days:[]};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null'); if(s&&s.done) P=Object.assign(P,s);}catch(e){}
function saveP(){try{localStorage.setItem(KEY,JSON.stringify(P))}catch(e){}}
function today(){const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()}
function streak(){
  const set=new Set(P.days); let n=0; const d=new Date();
  for(;;){const k=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); if(set.has(k)){n++; d.setDate(d.getDate()-1);} else break;}
  return n;
}
const order=()=>C.lessons;
const byId=id=>C.lessons.find(l=>l.id===id);
const partColor=p=>'var(--p'+((PARTS[p]&&PARTS[p].special)||!(p>0)?0:(p>8?((p-1)%8)+1:p))+')';

/* ---------------- sound: synthesized, soft, optional ---------------- */
const S={on:true,ctx:null};
try{S.on=localStorage.getItem(CFG.id+'-sound')!=='off';}catch(e){}
function ac(){ if(!S.on||FAST) return null; try{ if(!S.ctx){const A=window.AudioContext||window.webkitAudioContext; if(!A) return null; S.ctx=new A();} if(S.ctx.state==='suspended') S.ctx.resume(); return S.ctx;}catch(e){return null;} }
function tone(f,d,type,g,at,f2){ const c=ac(); if(!c) return; const t=c.currentTime+(at||0); const o=c.createOscillator(), v=c.createGain(); o.type=type||'sine'; o.frequency.setValueAtTime(f,t); if(f2) o.frequency.exponentialRampToValueAtTime(f2,t+d); v.gain.setValueAtTime(0,t); v.gain.linearRampToValueAtTime(g||.05,t+.008); v.gain.exponentialRampToValueAtTime(.0001,t+d); o.connect(v); v.connect(c.destination); o.start(t); o.stop(t+d+.02); }
function noise(d,g){ const c=ac(); if(!c) return; const b=c.createBuffer(1,Math.floor(c.sampleRate*d),c.sampleRate), a=b.getChannelData(0); for(let i=0;i<a.length;i++) a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,3); const s=c.createBufferSource(), f=c.createBiquadFilter(), v=c.createGain(); f.type='lowpass'; f.frequency.value=900; v.gain.value=g; s.buffer=b; s.connect(f); f.connect(v); v.connect(c.destination); s.start(); }
const sfx={
  tick(){ tone(1600,.025,'square',.012); },
  ok(){ tone(660,.1,'sine',.045); tone(990,.16,'sine',.045,.07); },
  no(){ tone(196,.18,'triangle',.05,0,150); },
  thunk(){ tone(120,.22,'sine',.12,0,48); noise(.09,.18); },
  done(){ [523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,.22,'sine',.04,i*.085)); }
};

/* ---------------- shared pieces ---------------- */
function estopHTML(cls,size,tag){
  const id='ring'+(++UID); tag=tag||'span';
  return '<'+tag+' class="estop '+(cls||'')+'"'+(size?' style="--s:'+size+'px"':'')+(tag==='span'?' aria-hidden="true"':'')+'>'+
    '<svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><defs><path id="'+id+'" d="M50,50 m-40.5,0 a40.5,40.5 0 1,1 81,0 a40.5,40.5 0 1,1 -81,0"/></defs>'+
    '<text font-size="8.4" textLength="252" lengthAdjust="spacing"><textPath href="#'+id+'">'+esc(CFG.ring)+' · '+esc(CFG.ring)+' ·</textPath></text></svg>'+
    '<span class="head"></span></'+tag+'>';
}
const ICON={
  back:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sound:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6h3l4-3v10L5 10H2z" fill="currentColor"/><path d="M11 5.5c1.2 1.4 1.2 3.6 0 5M12.8 3.8c2.2 2.4 2.2 6 0 8.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  mute:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6h3l4-3v10L5 10H2z" fill="currentColor"/><path d="M11 6l4 4M15 6l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
};
function soundBtn(){
  const b=h('button','iconbtn',S.on?ICON.sound:ICON.mute); b.setAttribute('aria-label',S.on?'Turn sound off':'Turn sound on'); b.title=b.getAttribute('aria-label');
  b.onclick=()=>{ S.on=!S.on; try{localStorage.setItem(CFG.id+'-sound',S.on?'on':'off')}catch(e){} b.innerHTML=S.on?ICON.sound:ICON.mute; b.setAttribute('aria-label',S.on?'Turn sound off':'Turn sound on'); if(S.on) sfx.tick(); };
  return b;
}
function shortWho(n){
  if(n.short) return n.short;
  const t=stripTags(n.who).replace(/[.,;:]+$/,'').split(/\s+/);
  return t.slice(0,3).join(' ')+(t.length>3?'…':'');
}
function stripTags(s){const d=document.createElement('div'); d.innerHTML=s==null?'':String(s); return d.textContent;}
function firstStop(lesson){ for(const s of lesson.steps) for(const b of (s.blocks||[])) if(b.type==='stop') return b; return null; }
/* the handover chain: cover (with an empty socket) and finish (with the stop placed) */
function chainEl(stopB, mode){
  const nodes=stopB.nodes, n=nodes.length;
  const stops=nodes.map((x,i)=>x.stop?i:-1).filter(i=>i>=0); const first=stops.length?Math.max(...stops):-1;
  const w=h('div','chain'+(mode==='finish'?' found':'')+(n>=6?' dense':''));
  w.style.setProperty('--n',n);
  const ol=h('ol','links');
  nodes.forEach((x,i)=>{
    const li=h('li',(mode==='finish'&&i>first&&!x.stop)?'after':''); if(mode==='finish') li.style.setProperty('--d',(900+(i-first)*180)+'ms');
    li.style.animationDelay=(i*90)+'ms';
    const isStop=mode==='finish'&&x.stop;
    li.innerHTML='<i>'+(isStop?estopHTML('mini'):i+1)+'</i><span>'+esc(shortWho(x))+'</span>';
    ol.appendChild(li);
  });
  w.appendChild(ol);
  if(mode==='finish') requestAnimationFrame(()=>requestAnimationFrame(()=>w.classList.add('dying')));
  if(mode==='cover'){
    const k=stops.length, who=k>1?T('coverMany',{K:WORDS[k]||k}):T('coverOne');
    w.appendChild(h('p','cap','<span class="sockinline" aria-hidden="true">?</span>'+T('coverCap',{N:WORDS[n]||n,K:who,n:n})));
  } else {
    const list=stops.map(i=>i+1); if(stopB.afterNote===false){ w.appendChild(h('p','cap',T('finishNoAfter',{linkword:list.length>1?'links':'link',links:list.length>1?list.slice(0,-1).join(', ')+' and '+list[list.length-1]:list[0]}))); return w; } const joined=list.length>1?list.slice(0,-1).join(', ')+' and '+list[list.length-1]:list[0];
    w.appendChild(h('p','cap', stops.length>1? T('finishMany',{links:joined})+(first<n-1?T('finishAfterMany'):'') : T('finishOne',{links:joined})+(first<n-1?T('finishAfterOne'):'')));
  }
  return w;
}
const CHAIN_CSS=`
.links{list-style:none;margin:0;padding:34px 0 0;display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));position:relative}
.links li{display:flex;flex-direction:column;align-items:center;gap:8px;position:relative;text-align:center;animation:rise .5s cubic-bezier(.2,.7,.2,1) both;min-width:0}
.links li+li::before{content:"";position:absolute;top:19px;right:calc(50% + 25px);width:calc(100% - 50px);border-top:2px solid var(--ink-3);z-index:0}
.links li i{position:relative;z-index:1;width:40px;height:40px;border-radius:50%;border:2px solid var(--ink-3);background:var(--ground);display:grid;place-items:center;font-style:normal;font-family:var(--sign);font-weight:700;font-size:17px;color:var(--ink-2)}
.links li span{font-size:13px;line-height:1.25;color:var(--ink-2);padding:0 3px;overflow-wrap:break-word;word-break:normal;hyphens:auto;-webkit-hyphens:auto;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.chain:not(.found) .links li i{border-style:dashed}
.chain.found .links li.after i,.chain.found .links li.after span{transition:color .4s,border-color .4s;transition-delay:var(--d,0ms)}
.chain.found.dying .links li.after i{border-color:var(--rule);color:var(--ink-3)}
.chain.found.dying .links li.after span{color:var(--ink-3)}
.chain.found .links li i .estop{animation:drop .6s .35s cubic-bezier(.3,.8,.3,1) both}
.chain .socket{position:absolute;top:-6px;left:50%;transform:translateX(-50%);width:34px;height:34px;border-radius:50%;border:2px dashed var(--stop);display:grid;place-items:center;color:var(--stop);font-family:var(--sign);font-weight:700;font-size:18px;animation:blink 1.8s infinite;background:var(--ground)}
.chain.found .links li i{border-color:var(--ink)}
.chain.found .links li i .estop{--s:44px}
.chain.found .links li i:has(.estop){border:0;background:none}

.chain.found .links li.after+li::before,.chain.found .links li.after::before{border-top-style:dashed}
@media (max-width:480px){.links li span{font-size:11.5px}.links li i{width:34px;height:34px;font-size:15px}.links li+li::before{top:16px;right:calc(50% + 22px);width:calc(100% - 44px)}.chain.found .links li i .estop{--s:38px}}
`;
document.head.appendChild(h('style',null,CHAIN_CSS));
function recapEl(lesson,mode){
  const chs=order().filter(l=>l.part===lesson.part&&l.kind==='chapter');
  if(!chs.length) return h('div',null);
  const W=x=>String(WORDS[x]||x).toLowerCase();
  const w=h('div',null); const g=h('div','recap'+(mode==='finish'?' full':''));
  chs.forEach((l,i)=>{ const got=mode==='finish'||(P.done[l.id]&&P.done[l.id].stop); const a=h('a',null,'<span class="slot" style="--d:'+(300+i*220)+'ms">'+(got?estopHTML('mini'):l.num)+'</span><span>'+esc(stripTags(l.title))+'</span>'); a.href='#'+l.id; g.appendChild(a); });
  w.appendChild(g);
  const Nc=W(chs.length).charAt(0).toUpperCase()+W(chs.length).slice(1);
  const one=s=>chs.length===1?s.replace(/\bcases\b/g,'case').replace(/\bcontrols\b/g,'control').replace(/\ball one case\b/g,'the one case'):s;
  const nxp=CONTENT_PARTS[CONTENT_PARTS.indexOf(lesson.part)+1]; const nextLine=T('recapNext',{np:nxp,next:nxp!=null&&PARTS[nxp]?PARTS[nxp].name:''});
  if(mode==='finish'){ w.appendChild(h('p','recapcap',one(T('recapFinish',{N:Nc,n:W(chs.length)}))+(lesson.part>=CONTENT_PARTS[CONTENT_PARTS.length-1]?T('recapLast'):nextLine))); return w; }
  const n=chs.filter(l=>P.done[l.id]&&P.done[l.id].stop).length;
  w.appendChild(h('p','recapcap', one(n===chs.length?T('recapAll',{n:W(n)}):n?T('recapSome',{k:W(n),n:W(chs.length)}):T('recapNone',{N:Nc,n:W(chs.length)}))));
  return w;
}
function shortTitle(t){ const w=stripTags(t).split(/\s+/); return w.slice(0,4).join(' ')+(w.length>4?'\u2026':''); }
function stampSVG(top,bottom){
  const id='ink'+(++UID);
  return '<svg viewBox="0 0 220 120" role="img" aria-label="'+esc(top+' '+bottom)+'"><defs><filter id="'+id+'" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="1.4"/><feComponentTransfer><feFuncA type="discrete" tableValues="0 .85 1 1 .9 1"/></feComponentTransfer></filter></defs>'+
    '<g filter="url(#'+id+')" fill="none" stroke="currentColor"><rect x="5" y="5" width="210" height="110" rx="10" stroke-width="5"/><rect x="14" y="14" width="192" height="92" rx="5" stroke-width="1.6"/></g>'+
    '<g filter="url(#'+id+')" fill="currentColor" style="font-family:var(--sign);font-weight:700"><text x="110" y="62" text-anchor="middle" font-size="38" letter-spacing="2"'+(top.length>10?' textLength="178" lengthAdjust="spacingAndGlyphs"':'')+'>'+esc(top)+'</text><text x="110" y="90" text-anchor="middle" font-size="15" letter-spacing="3.5"'+(bottom.length>20?' textLength="176" lengthAdjust="spacingAndGlyphs"':'')+'>'+esc(bottom)+'</text></g></svg>';
}

/* ---------------- routing ---------------- */
const app=$('#app');
function route(){
  const id=(location.hash||'').slice(1);
  window.scrollTo(0,0);
  if(id && byId(id)) openLesson(byId(id)); else renderHub();
}
window.addEventListener('hashchange',route);

/* ---------------- hub ---------------- */
let qFilter=null;
function renderHub(){
  document.title=CFG.title;
  const L=order(); const doneN=L.filter(l=>P.done[l.id]).length;
  const next=L.find(l=>!P.done[l.id])||L[0];
  app.innerHTML='';
  const top=h('div','top'); const tw=h('div','wrap');
  tw.appendChild(h('span','mast',estopHTML('mini')+'<span>'+CFG.mast+'</span>'));
  tw.appendChild(h('span','xp','<i></i><b>'+fmt(P.xp)+'</b> '+T('points')));
  tw.appendChild(soundBtn());
  top.appendChild(tw); app.appendChild(top);
  const hub=h('main','wrap hub');
  const hero=h('section','hero');
  const left=h('div',null,'<span class="eyebrow">'+T('lessonsEyebrow',{n:L.length})+'</span><div class="ttl" role="heading" aria-level="1">'+CFG.heroHTML+'</div><p class="sub">'+CFG.sub+'</p>');
  hero.appendChild(left);
  const press=h('div','press');
  const pb=h('button',null); pb.outerHTML;
  press.innerHTML=estopHTML('live',176,'button')+'<span>'+(doneN?T('pressContinue'):T('pressBegin'))+'</span>';
  const btn=$('button.estop',press); btn.setAttribute('aria-label',(doneN?'Continue with ':'Begin with ')+next.title);
  btn.onclick=()=>{ btn.classList.add('pressed'); sfx.thunk(); setTimeout(()=>{ location.hash=next.id; }, FAST?0:280); };
  hero.appendChild(press);
  hub.appendChild(hero);
  const st=h('div','stats');
  st.innerHTML='<div><b>'+doneN+'<span style="font-size:20px;color:var(--ink-3)">/'+L.length+'</span></b><span>Lessons</span></div><div><b>'+fmt(P.xp)+'</b><span>Insight</span></div><div><b>'+streak()+'</b><span>Day streak</span></div><div style="margin-left:auto;align-self:center"><a class="btn small" href="#'+next.id+'">'+(doneN?'Continue':'Start')+' <span class="arrow">→</span></a></div>';
  hub.appendChild(st);

  const lad=h('section','sect');
  lad.innerHTML='<header><h2>'+T('ladderTitle')+'</h2></header>';
  const st5=h('div','steps5'); st5.style.gridTemplateColumns='repeat('+CONTENT_PARTS.length+',minmax(0,1fr))';
  CONTENT_PARTS.forEach((p,pi)=>{ const pl=L.filter(l=>l.part===p), pd=pl.filter(l=>P.done[l.id]).length; const c=h('a','st'); c.href='#'+((pl.find(l=>!P.done[l.id])||pl[0]||{}).id||''); c.style.setProperty('--pc',partColor(p)); c.style.height=(96+(pi+1)*26)+'px'; c.style.textDecoration='none'; c.style.color='inherit';
    c.innerHTML='<span class="fillp" style="height:'+(pl.length?100*pd/pl.length:0)+'%"></span><b>'+p+'</b><span>'+T('ladderPrefix')+PARTS[p].job+'</span><small>'+pd+'/'+pl.length+'</small>'+(pi===CONTENT_PARTS.length-1?estopHTML('mini'):''); st5.appendChild(c); });
  lad.appendChild(st5); lad.appendChild(h('div','stepsnote',T('ladderNote')));
  hub.appendChild(lad);

  const qs=h('section','sect');
  qs.innerHTML='<header><h2>'+T('frameworkTitle')+'</h2><span class="hint">'+T('frameworkHint')+'</span></header>';
  const qg=h('div','qgrid');
  QUESTIONS.forEach((q,i)=>{
    const n=i+1, tagged=L.filter(l=>(l.questions||[]).includes(n)), got=tagged.filter(l=>P.done[l.id]).length;
    const t=h('button','qtile'+(qFilter===n?' sel':''));
    t.innerHTML='<span class="n">'+n+'</span><span class="q">'+esc(q)+'</span><span class="pc">'+got+' of '+tagged.length+' cases</span><span class="pips" aria-label="'+got+' of '+tagged.length+' lessons done">'+tagged.map((l,k)=>'<i class="'+(k<got?'on':'')+'"></i>').join('')+'</span>';
    t.setAttribute('aria-pressed',qFilter===n);
    t.onclick=()=>{ sfx.tick(); qFilter=qFilter===n?null:n; renderHub(); const el=$('#path'); el&&el.scrollIntoView({behavior:FAST?'auto':'smooth',block:'start'}); };
    qg.appendChild(t);
  });
  qs.appendChild(qg); hub.appendChild(qs);

  const path=h('section','sect'); path.id='path';
  path.innerHTML='<header><h2>'+T('pathTitle')+'</h2>'+(qFilter?'<span class="hint">Lessons for question '+qFilter+'. <a href="#" id="clearq">Show all</a></span>':'')+'</header>';
  Object.keys(PARTS).map(Number).sort((a,b)=>a-b).forEach(p=>{
    const pl=L.filter(l=>l.part===p); if(!pl.length) return;
    const part=h('div','part'); part.style.setProperty('--pc',partColor(p));
    if(!PARTS[p].special) part.innerHTML='<header><span class="pn">'+p+'</span><span class="t">'+PARTS[p].name+'</span><span class="d">'+PARTS[p].desc+'</span></header>';
    else part.innerHTML='<header><span class="pn" style="font-size:40px">'+(PARTS[p].mark||'\u2022')+'</span><span class="t">'+PARTS[p].name+'</span><span class="d">'+(PARTS[p].desc||'')+'</span></header>';
    const pa=h('div','path');
    pl.forEach(l=>{
      const a=h('a','lrow'+(P.done[l.id]?' done':'')+(l===next&&!P.done[l.id]?' next':'')+(l.kind==='checkpoint'?' cp':''));
      if(qFilter && !(l.questions||[]).includes(qFilter)) a.classList.add('dim');
      a.href='#'+l.id;
      const nlabel=l.kind==='chapter'?String(l.num).padStart(2,'0'):l.kind==='checkpoint'?T('cpMark'):l.kind==='intro'?'00':'END';
      a.innerHTML='<span class="nd">'+nlabel+'</span><span class="tt"><b>'+esc(l.title)+'</b><span>'+esc(l.question||'')+'</span></span><span class="rt">'+(P.done[l.id]?fmt(P.done[l.id].xp)+'<span class="ck" aria-label="done"></span>':(l.minutes||8)+' min')+'</span>';
      pa.appendChild(a);
    });
    part.appendChild(pa); path.appendChild(part);
  });
  hub.appendChild(path);
  const foot=h('footer','foot');
  foot.innerHTML='<span>'+CFG.footer+'</span><button id="reset">'+T('reset')+'</button>';
  hub.appendChild(foot);
  app.appendChild(hub);
  const cq=$('#clearq'); if(cq) cq.onclick=e=>{e.preventDefault(); qFilter=null; renderHub();};
  let armed=false; $('#reset').onclick=e=>{ if(!armed){armed=true;e.target.textContent=T('resetConfirm');return;} P={done:{},xp:0,refl:{},days:[]}; saveP(); renderHub(); };
}

/* ---------------- lesson runtime ---------------- */
let L=null;
function openLesson(lesson){
  document.title=lesson.title+' · '+CFG.title;
  app.innerHTML='';
  const ctx={lesson, xp:0, vals:{}, badges:{}, stepEls:[], cur:0, graded:0, firstTry:0};
  L=ctx;
  const top=h('div','top'); const tw=h('div','wrap');
  tw.innerHTML='<a class="iconbtn" href="#" aria-label="Back to the course">'+ICON.back+'<span>Course</span></a><div class="prog" role="progressbar" aria-label="Lesson progress"></div><span class="xp"><i></i><b>0</b></span>';
  const qb=h('button','iconbtn qref',esc(T('qrefButton'))); qb.setAttribute('aria-label',T('qrefTitle')); qb.onclick=()=>openQRef(); tw.appendChild(qb);
  tw.appendChild(soundBtn()); top.appendChild(tw); app.appendChild(top);
  const prog=$('.prog',top), xpEl=$('.xp b',top);
  const total=lesson.steps.length+1;
  for(let i=0;i<total;i++) prog.appendChild(h('i'));
  const main=h('main','wrap lesson'); app.appendChild(main);
  const bar=h('div','bar'); bar.innerHTML='<div class="wrap"><button class="btn ghost" id="back">Back</button><span class="teaser" id="teaser" aria-live="polite"></span><button class="btn" id="next" disabled>Continue <span class="arrow">→</span></button></div>';
  app.appendChild(bar);
  const back=$('#back'), next=$('#next'), teaser=$('#teaser');
  ctx.award=(n)=>{ctx.xp+=n; xpEl.textContent=fmt(ctx.xp); xpEl.classList.remove('bump'); void xpEl.offsetWidth; xpEl.classList.add('bump');};
  ctx.grade=(first)=>{ctx.graded++; if(first) ctx.firstTry++;};
  function paintProg(){[...prog.children].forEach((d,k)=>d.className=k<ctx.cur?'done':k===ctx.cur?'cur':''); prog.setAttribute('aria-valuenow',ctx.cur+1); prog.setAttribute('aria-valuemax',total);}
  function show(i){
    ctx.cur=i; paintProg();
    ctx.stepEls.forEach((s,k)=>s&&s.classList.toggle('on',k===i));
    if(!ctx.stepEls[i]){ const el = i<lesson.steps.length ? buildStep(lesson.steps[i],i) : buildFinish(); main.appendChild(el); ctx.stepEls[i]=el; el.classList.add('on'); }
    back.style.visibility=i===0?'hidden':'visible';
    syncNext();
    window.scrollTo({top:0,behavior:FAST?'auto':'smooth'});
  }
  function label(t){ next.innerHTML=esc(t)+' <span class="arrow">→</span>'; }
  function syncNext(){
    const el=ctx.stepEls[ctx.cur]; const done=el && el.dataset.complete==='1';
    if(ctx.cur>=lesson.steps.length){ const nx=order()[order().indexOf(lesson)+1]; label(nx?(nx.kind==='checkpoint'?T('nextCheckpoint'):nx.kind==='closing'?T('nextClosing'):T('nextCase')):T('backToCourse')); next.dataset.go=nx?nx.id:''; next.disabled=false; return; }
    label(ctx.cur===lesson.steps.length-1?T('closeCase'):(ctx.cur===0?(lesson.cta||'Begin'):'Continue'));
    const was=next.disabled; next.disabled=!done;
    const ns=lesson.steps[ctx.cur+1]; const tz=ns?(ns.teaser||stripTags(ns.eyebrow||'').replace(/^Exhibit\s*\d+\s*·\s*/i,'')):''; teaser.innerHTML=done?(tz&&ctx.cur>0?'<span>'+esc(T('nextLabel'))+'</span> '+esc(tz):''):'<span class="need">'+esc(T('needLabel'))+'</span>';
    if(done&&was){next.classList.remove('ready'); void next.offsetWidth; next.classList.add('ready');}
  }
  ctx.syncNext=syncNext;
  back.onclick=()=>{ if(ctx.cur>0) show(ctx.cur-1); };
  next.onclick=()=>{ sfx.tick(); if(ctx.cur>=lesson.steps.length){ location.hash=next.dataset.go||''; return;} show(ctx.cur+1); };
  show(0);
}

function buildStep(step,idx){
  const ctx=L, lesson=ctx.lesson;
  const el=h('section','step'); el.dataset.step=idx;
  if(idx===0){
    const cv=h('div','cover'+(lesson.kind==='checkpoint'?' cp':''));
    const numTxt=lesson.kind==='chapter'?String(lesson.num).padStart(2,'0'):lesson.kind==='checkpoint'?T('cpMark'):lesson.kind==='intro'?'00':'END';
    const pn = lesson.kind==='chapter'?T('chapter')+' '+lesson.num : lesson.kind==='checkpoint'?T('checkpoint',{p:lesson.part}) : lesson.kind==='intro'?T('intro'):T('closing');
    cv.innerHTML='<div class="row" style="gap:14px"><span class="chip" style="--pc:'+partColor(lesson.part)+'">'+pn+'</span>'+(PARTS[lesson.part]&&!PARTS[lesson.part].special?'<span class="eyebrow">'+PARTS[lesson.part].name+'</span>':'')+'</div>'+
      '<div class="num" aria-hidden="true">'+numTxt+'</div><h1>'+(step.title||lesson.title)+'</h1>'+(step.lede?'<p class="q">'+interp(step.lede)+'</p>':'');
    const sb=firstStop(lesson);
    if(sb) cv.appendChild(chainEl(sb,'cover'));
    else if(lesson.kind==='checkpoint') cv.appendChild(recapEl(lesson));
    const meta=h('div','meta stephead');
    meta.className='stephead'; meta.style.padding='0';
    meta.innerHTML='<div class="meta">'+[(lesson.minutes||8)+' min', lesson.device?esc(lesson.device.charAt(0).toUpperCase()+lesson.device.slice(1)):''].filter(Boolean).map(s=>'<span>'+s+'</span>').join('')+'</div>';
    cv.appendChild(meta);
    if(step.imagined) cv.appendChild(h('span','imagined','Imagined scene'));
    el.appendChild(cv);
  } else {
    const head=h('div','stephead');
    let eb='';
    if(step.eyebrow){ eb+= /^exhibit/i.test(stripTags(step.eyebrow)) ? '<span class="tagx">'+step.eyebrow+'</span>' : '<span class="eyebrow">'+step.eyebrow+'</span>'; }
    if(step.imagined) eb+='<span><span class="imagined">Imagined scene</span></span>';
    head.innerHTML=eb+(step.title?'<h2>'+step.title+'</h2>':'')+(step.lede?'<p class="lede">'+interp(step.lede)+'</p>':'');
    el.appendChild(head);
  }
  const body=h('div','blocks'); el.appendChild(body);
  const blocks=step.blocks||[]; let i=0;
  function pump(){
    while(i<blocks.length){
      const b=blocks[i++]; const R=RENDER[b.type];
      if(!R){ console.error('Unknown block type',b.type); continue; }
      let finished=false;
      const done=()=>{ if(finished) return; finished=true; setTimeout(()=>{ pump(); },wait(300)); };
      const r=R(b,ctx,done);
      r.el.classList.add('blk'); r.el.dataset.type=b.type; if(b.id) r.el.dataset.id=b.id;
      if(b.type==='stop' && step.title && stripTags(step.title).trim().replace(/[?.]$/,'')===stripTags(b.prompt||T('stopPrompt')).trim().replace(/[?.]$/,'')){ const bb=r.el.querySelector('.sh .t b'); if(bb) bb.remove(); }
      if((b.paraphrase||(b.imagined&&!step.imagined)) && !r.noted){ if(r.el.classList.contains('ex')){ const w=h('div',null); w.appendChild(r.el); r.el=w; r.el.appendChild(note(b)); } else { const pr=r.el.querySelector(':scope > .prompt'); if(pr) pr.after(note(b)); else r.el.appendChild(note(b)); } }
      body.appendChild(r.el);
      if(i>1 && !FAST) setTimeout(()=>{ try{ r.el.scrollIntoView({behavior:'smooth',block:'nearest'});}catch(e){} },80);
      if(r.gate) return;
    }
    el.dataset.complete='1'; ctx.syncNext && ctx.syncNext();
  }
  setTimeout(pump,0);
  return el;
}
function note(b){ return h('p','exnote', b.imagined?'<span class="imagined">Imagined</span>This part is invented to let you practise.':(typeof b.paraphrase==='string'?esc(b.paraphrase):'Wording paraphrased from the record.')); }

/* value interpolation: {{blockId}} or {{blockId.N}} */
function interp(s){
  if(!s) return '';
  return String(s).replace(/\{\{(\w+)(?:\.(\d+))?\}\}/g,(m,id,k,off,all)=>{const v=L&&L.vals[id]; if(v==null) return '—'; if(k!=null) return v.parts&&v.parts[+k]!=null?v.parts[+k]:'—'; return midCase(v.display, all.slice(0,off));});
}
const STARTERS=new Set('accept ask approve take roll run keep leave book install wait tell call pay send escalate flag forward ignore check delete disable remove revoke block verify change reset skip use set sign treat report hold pull push follow hang read write close open stop start let do it this that a an the yes no only both all none nothing someone nobody everyone my our we they give file put move trust buy sell delay defer schedule patch mark note log document compare confirm require rotate pause retire limit isolate segment switch go hire fire find look trace contact notify'.split(' '));
function midCase(val, before){ const t=String(before).replace(/<[^>]+>/g,'').replace(/\s+$/,''); if(!t||/[.!?\u201c"\u2018(]$/.test(t)) return val; const m=String(val).match(/^([A-Z])([a-z\u2019']*)/); if(!m||!STARTERS.has((m[1]+m[2]).toLowerCase())) return val; return m[1].toLowerCase()+String(val).slice(1); }
function openQRef(){ let d=document.getElementById('qref'); if(!d){ d=document.createElement('dialog'); d.id='qref'; document.body.appendChild(d); d.addEventListener('click',ev=>{ if(ev.target===d) d.close(); }); }
  const hints=CFG.questionHints||[]; d.innerHTML='<div class="qr"><header><h3>'+esc(T('qrefTitle'))+'</h3><button class="iconbtn" aria-label="Close">'+esc(T('qrefClose'))+'</button></header><ol>'+QUESTIONS.map((q,i)=>'<li><b>'+esc(q)+'</b>'+(hints[i]?'<span>'+esc(hints[i])+'</span>':'')+'</li>').join('')+'</ol></div>'; $('button',d).onclick=()=>d.close(); d.showModal(); }
function fb(container, tone, html){
  const f=h('div','fb '+(tone||'')); f.setAttribute('role','status'); f.innerHTML=interp(html); container.appendChild(f); return f;
}
function solveMark(el,on){ if(!el) return; if(on) el.setAttribute('data-solve',''); else el.removeAttribute('data-solve'); }
function toneSfx(t){ if(t==='ok') sfx.ok(); else if(t==='no') sfx.no(); else sfx.tick(); }

/* ---------------- exhibit skins ---------------- */
function frame(b, inner, kind){
  const s=b.skin||(kind==='chat'?'widget':(b.url?'web':'card'));
  const tag=b.tag||'', meta=b.meta||'';
  let e;
  const put=(sel,el)=>{ const slot=$(sel,e); slot.replaceWith(el); };
  const body=()=>{ const d=h('div','exbody'); if(typeof inner==='string') d.innerHTML=inner; else d.appendChild(inner); return d; };
  switch(s){
    case 'web':
      e=h('div','ex ex-web',(b.url?'<div class="chrome"><span class="dots"><i></i><i></i><i></i></span><span class="addr">'+esc(stripTags(b.url))+'</span></div>':'')+'<div class="slot"></div>');
      { const bd=body(); if(b.title) bd.prepend(h('h3',null,b.title)); if(b.site||(b.url&&tag)) bd.prepend(h('div','site',esc(stripTags(b.site||tag)))); put('.slot',bd); }
      break;
    case 'email':
      e=h('div','ex ex-email','<div class="hdr">'+((b.subject||b.title)?'<div class="subj">'+(b.subject||b.title)+'</div>':'')+(b.from?'<span class="l">From</span><span class="v">'+b.from+'</span>':'')+(b.to?'<span class="l">To</span><span class="v">'+b.to+'</span>':'')+((b.date||meta)?'<span class="l">Date</span><span class="v">'+(b.date||meta)+'</span>':'')+'</div><div class="slot"></div>');
      put('.slot',body()); break;
    case 'letter':
      e=h('div','ex ex-letter',((b.date||meta)?'<div class="date">'+(b.date||meta)+'</div>':'')+(b.title?'<h3>'+b.title+'</h3>':'')+'<div class="slot"></div>');
      put('.slot',body()); break;
    case 'notification':
      e=h('div','ex ex-notif',(b.clock?'<div class="clock">'+esc(b.clock)+'</div>':'')+'<div class="day">'+esc(stripTags(b.day||meta||'Lock screen'))+'</div><div class="note"><div class="app"><span>'+esc(stripTags(b.app||tag))+'</span><span>'+esc(stripTags(b.time||'now'))+'</span></div>'+(b.title?'<div class="title">'+b.title+'</div>':'')+'<div class="slot"></div></div>');
      put('.slot',body()); break;
    case 'filing': {
      let ln=''; for(let k=1;k<=60;k++) ln+=k+'<br>';
      e=h('div','ex ex-filing','<div class="court">'+(b.court||tag)+'</div>'+((b.caption||b.docket)?'<div class="caption"><span>'+(b.caption||'')+'</span><span>'+(b.docket||meta)+'</span></div>':'')+(b.title?'<div style="font-weight:700;text-transform:uppercase;text-align:center;line-height:1.4;margin-bottom:6px">'+b.title+'</div>':'')+'<div class="fbody"><div class="lines" aria-hidden="true">'+ln+'</div><div class="slot"></div></div>');
      put('.slot',body()); break; }
    case 'recipe':
      e=h('div','ex ex-recipe','<div class="rtitle">'+(b.title||tag)+'</div><div class="slot"></div>');
      put('.slot',body()); break;
    case 'obituary':
      e=h('div','ex ex-obit','<div class="mast"><span>'+(b.masthead||'Obituaries')+'</span><span>'+(b.dateline||meta)+'</span></div>'+((b.title||tag)?'<h3>'+(b.title||tag)+'</h3>':'')+(b.dek?'<div class="dek">'+b.dek+'</div>':'')+'<div class="slot"></div>');
      put('.slot',body()); break;
    case 'dictionary':
      e=h('div','ex ex-dict','<div class="hw">'+(b.headword||b.title||tag)+'</div>'+((b.pron||b.pos)?'<div class="pron">'+(b.pron?esc(b.pron)+' ':'')+(b.pos?'<i>'+esc(b.pos)+'</i>':'')+'</div>':'')+'<div class="slot"></div>');
      put('.slot',body()); break;
    case 'terms':
      e=h('div','ex ex-terms','<div class="sec">'+(b.section?'<b>'+esc(b.section)+'</b>':'')+'<span>'+(b.title||tag)+'</span></div><div class="slot"></div>');
      put('.slot',body()); break;
    case 'search':
      e=h('div','ex ex-search','<div class="qbox">'+(b.query||tag)+'</div><div class="ov"><div class="lab">'+esc(b.overview||'AI Overview')+'</div><div class="slot"></div></div><div class="links" aria-hidden="true"><i></i><i></i><i></i></div>');
      put('.slot',body()); break;
    case 'popup':
      e=h('div','ex ex-popup','<div class="dlg">'+((b.title||tag)?'<h3>'+(b.title||tag)+'</h3>':'')+'<div class="slot"></div><div class="btns">'+(b.buttons||['Cancel','OK']).map(x=>'<span>'+esc(x)+'</span>').join('')+'</div></div>');
      put('.slot',body()); break;
    case 'log':
      e=h('div','ex ex-log','<div class="bar2"><i></i><i></i><i></i><span>'+esc(stripTags(b.title||tag))+(meta?' · '+esc(stripTags(meta)):'')+'</span></div><div class="slot"></div>');
      put('.slot',body()); break;
    case 'file':
      e=h('div','ex ex-file','<div class="fname">'+esc(stripTags(b.filename||tag))+(meta?' — '.replace('—','·')+esc(stripTags(meta)):'')+'</div><div class="slot"></div>');
      put('.slot',body()); break;
    case 'form':
      e=h('div','ex ex-form','<div class="fh"><b>'+(b.title||tag)+'</b><span>'+(meta||'')+'</span></div><div class="slot"></div>'+(b.stamp?'<span class="stampmark">'+esc(b.stamp)+'</span>':''));
      put('.slot',body()); break;
    case 'sheet': {
      const tabs=(b.tabs||[]).map(x=>{ const o=typeof x==='string'?{name:x}:x; return '<span class="'+(o.on?'on':'')+(o.hidden?' hid':'')+'">'+esc(o.name)+'</span>'; }).join('');
      e=h('div','ex ex-sheet','<div class="sname">'+esc(stripTags(b.filename||b.title||tag))+(meta?'<span>'+esc(stripTags(meta))+'</span>':'')+'</div><div class="slot"></div>'+(tabs?'<div class="tabs" aria-label="Worksheets">'+tabs+'</div>':''));
      put('.slot',body()); break; }
    case 'memo':
      e=h('div','ex ex-memo','<div class="mh">'+(b.title||tag)+'</div>'+(meta?'<div class="eyebrow" style="color:var(--paper-ink-2);margin:-6px 0 10px">'+meta+'</div>':'')+'<div class="slot"></div>');
      put('.slot',body()); break;
    /* chat skins */
    case 'widget':
      e=h('div','ex ex-chat','<div class="ch"><span class="av">'+esc(stripTags(b.botName||tag||'A').trim().charAt(0).toUpperCase())+'</span><span><b>'+esc(stripTags(tag||b.botName||'Chat'))+'</b><small>'+esc(stripTags(meta||'online'))+'</small></span></div>');
      e.appendChild(inner); break;
    case 'messenger':
      e=h('div','ex ex-phone','<div class="scr"><div class="sb"><span>'+esc(stripTags(b.clock||''))+'</span><i></i><span></span></div><div class="th"><div class="av">'+esc(stripTags(tag||'?').trim().charAt(0).toUpperCase())+'</div><b>'+esc(stripTags(tag))+'</b>'+(meta?'<div class="hint" style="font-size:12px;color:var(--paper-ink-2)">'+esc(stripTags(meta))+'</div>':'')+'</div><div class="slot"></div></div>');
      put('.slot',inner); break;
    case 'call':
      e=h('div','ex ex-call','<div class="scr"><div class="who2">'+esc(stripTags(b.caller||tag))+'</div><div class="sub2">'+esc(stripTags(meta||'Incoming call'))+'</div><div class="slot"></div>'+(b.ringing?'<div class="acts" aria-hidden="true"><span>Decline</span><span>Accept</span></div>':'<div class="acts live" aria-hidden="true"><em>Call in progress</em></div>')+'</div>');
      put('.slot',inner); break;
    case 'script':
      e=h('div','ex ex-script','<div class="sh2">'+esc(stripTags(tag||'The scene'))+(meta?' \u00B7 '+esc(stripTags(meta)):'')+'</div>');
      e.appendChild(inner); break;
    case 'workspace':
      e=h('div','ex ex-work','<div class="ch">'+esc(stripTags(b.channel||tag))+(meta?'<span class="hint" style="font-weight:400;color:var(--paper-ink-2);margin-left:auto;font-size:13px">'+esc(stripTags(meta))+'</span>':'')+'</div>');
      e.appendChild(inner); break;
    case 'assistant':
      e=h('div','ex ex-ai','<div class="ch"><span>'+esc(stripTags(tag||'Assistant'))+(meta?'<span class="m"> · '+esc(stripTags(meta))+'</span>':'')+'</span></div>');
      e.appendChild(inner); break;
    default:
      e=h('div','ex ex-card',((tag||meta)?'<div class="exhead"><b>'+tag+'</b><span>'+meta+'</span></div>':'')+'<div class="slot"></div>');
      { const bd=body(); if(b.title) bd.prepend(h('h3',null,b.title)); if(b.url&&s!=='web') bd.prepend(h('div','hint',esc(b.url))); put('.slot',bd); }
  }
  return e;
}

/* ---------------- block renderers ---------------- */
const RENDER={};
RENDER.text=b=>({el:h('div','prose',interp(b.html))});
RENDER.sit=b=>{const e=h('aside','sit'); e.innerHTML='<span class="eyebrow">'+(b.label||T('sit'))+'</span><p class="s">'+interp(b.html)+'</p>'; return {el:e};};
RENDER.quote=b=>({el:h('blockquote','quote',interp(b.text)+(b.cite?'<small>'+b.cite+'</small>':''))});
RENDER.doc=b=>({el:frame(b, interp(b.html||''), 'doc')});
RENDER.compare=b=>{
  const e=h('div','cmp');
  [b.left,b.right].forEach(s=>{ const w=h('div',null); w.appendChild(RENDER.doc(s).el); if(s.paraphrase||s.imagined) w.appendChild(note(s)); e.appendChild(w); });
  return {el:e};
};
RENDER.chat=(b,ctx,done)=>{
  const c=h('div','chat'); c.setAttribute('aria-live','polite');
  const e=frame(b,c,'chat');
  const msgs=b.messages||[]; let k=0;
  function add(m){ const d=h('div','msg '+(m.from||'bot')); const nm=m.name||(m.from==='bot'?(b.botName||'Assistant'):m.from==='you'?'You':''); if(b.skin==='workspace') d.dataset.i=stripTags(nm||'?').trim().charAt(0).toUpperCase(); d.innerHTML=((m.name||m.from==='bot'||b.skin==='workspace')&&m.from!=='sys'?'<span class="who">'+nm+'</span>':'')+interp(m.text); c.appendChild(d); if(m.from!=='sys') sfx.tick(); }
  function step(){
    if(k>=msgs.length){ done(); return; }
    const m=msgs[k++];
    if(m.from==='you'||m.from==='sys'){ setTimeout(()=>{add(m); step();}, wait(k===1?200:700)); return; }
    const t=h('div','typing','<i></i><i></i><i></i>'); setTimeout(()=>{ c.appendChild(t);
      setTimeout(()=>{ t.remove(); add(m); step(); }, wait(Math.min(2000, 600+String(m.text).length*9))); }, wait(380));
  }
  step();
  return {el:e,gate:true};
};
RENDER.choice=(b,ctx,done)=>{
  const e=h('div','ask'); if(b.prompt) e.appendChild(h('p','prompt',interp(b.prompt)));
  const list=h('div','choices'+(b.grid?' grid2':'')); e.appendChild(list);
  const hasRight=b.options.some(o=>o.correct);
  let opts=b.options.slice(); if(hasRight && b.shuffle!==false){ let seed=0; for(const ch of (ctx.lesson.id+':'+b.id)) seed=(seed*31+ch.charCodeAt(0))>>>0; for(let i=opts.length-1;i>0;i--){ seed=(seed*1103515245+12345)>>>0; const j=seed%(i+1); [opts[i],opts[j]]=[opts[j],opts[i]]; } }
  opts.forEach((o,k)=>{
    const btn=h('button','choice','<span class="k">'+LETTERS[k]+'</span><span class="t">'+o.text+'</span>');
    if(hasRight? o.correct : k===0) solveMark(btn,true);
    btn.onclick=()=>{
      if(list.classList.contains('locked')) return;
      list.classList.add('locked'); [...list.children].forEach(x=>{x.disabled=true; solveMark(x,false);});
      let tone='neutral';
      if(hasRight){
        if(o.correct){ btn.classList.add('right'); tone=o.tone||'ok'; ctx.award(o.xp||20); ctx.grade(true); }
        else { btn.classList.add('wrong'); b.options.forEach((x,j)=>{ if(x.correct) list.children[j].classList.add('right'); }); tone=o.tone||'no'; ctx.award(o.xp||5); ctx.grade(false); }
      } else { btn.classList.add('pick'); tone=o.tone||'neutral'; ctx.award(o.xp||15); }
      toneSfx(tone);
      ctx.vals[b.id]={display:esc(stripTags(o.text).trim().replace(/[.]$/,'')), index:k, correct:!!o.correct};
      fb(e,tone,(o.fb||'')+(b.reveal?'<div>'+b.reveal+'</div>':''));
      done();
    };
    list.appendChild(btn);
  });
  return {el:e,gate:true};
};
RENDER.toolkit=(b,ctx,done)=>{
  const ans=b.answer||[1];
  const e=h('div','ask'); e.appendChild(h('p','prompt',interp(b.prompt||T('toolkitPrompt'))));
  const list=h('div','choices grid2'); e.appendChild(list);
  QUESTIONS.forEach((q,k)=>{
    const ok=ans.includes(k+1);
    const btn=h('button','choice qopt','<span class="k">'+(k+1)+'</span><span class="t">'+esc(q)+'</span>');
    if(ok && k+1===ans[0]) solveMark(btn,true);
    btn.onclick=()=>{
      if(list.classList.contains('locked')) return;
      list.classList.add('locked'); [...list.children].forEach(x=>{x.disabled=true; solveMark(x,false);});
      if(ok){ btn.classList.add('right'); ctx.award(20); ctx.grade(true); sfx.ok(); fb(e,'ok',b.fb); }
      else { btn.classList.add('wrong'); ans.forEach(a=>list.children[a-1].classList.add('right')); ctx.award(5); ctx.grade(false); sfx.no(); const why=b.why&&b.why[k+1]; fb(e,'warn',(why?'<b>Why not question '+(k+1)+'?</b> '+why+' ':(b.fbWrong?b.fbWrong+' ':''))+b.fb); }
      ctx.vals[b.id]={display:'question '+(k+1)};
      done();
    };
    list.appendChild(btn);
  });
  return {el:e,gate:true};
};
RENDER.slider=(b,ctx,done)=>{
  const e=h('div','ask'); if(b.prompt) e.appendChild(h('p','prompt',interp(b.prompt)));
  const s=h('div','slider'); e.appendChild(s);
  const log=!!b.log, min=b.min, max=b.max, stepv=b.step||1;
  const lmin=Math.log(Math.max(min,1)), lmax=Math.log(max);
  const toVal=p=> log? Math.round(Math.exp(lmin+(lmax-lmin)*p/1000)/stepv)*stepv : Number(p);
  const toPos=v=> log? 1000*(Math.log(Math.max(v,1))-lmin)/(lmax-lmin) : v;
  const start=b.start!=null?b.start:(min+max)/2;
  const show=v=>{ const u=b.unit?(Number(v)===1&&b.unitOne?b.unitOne:b.unit):''; return (b.prefix||'')+fmt(v,b.decimals||0)+(u?(u.length<=2?u:' '+u):''); };
  s.innerHTML='<div class="big" aria-live="polite">'+show(start)+'</div><div class="trk"><span class="ticks"></span><input type="range" id="sl-'+ctx.lesson.id+'-'+b.id+'" aria-label="'+esc(stripTags(b.prompt||'Estimate'))+'" min="'+(log?0:min)+'" max="'+(log?1000:max)+'" step="'+(log?1:stepv)+'" value="'+toPos(start)+'"></div><div class="ends"><span>'+(b.labels?b.labels[0]:show(min))+'</span><span>'+(b.labels?b.labels[1]:show(max))+'</span></div>';
  const inp=$('input',s), big=$('.big',s);
  let v=start, lastTick=0; inp.oninput=()=>{v=toVal(inp.value); big.textContent=show(v); const n=performance.now(); if(n-lastTick>70){ lastTick=n; tone(900,.015,'square',.006);} };
  const lock=h('button','btn small',esc(b.lockLabel||'Lock it in')); solveMark(lock,true);
  const row=h('div','row'); row.appendChild(lock); e.appendChild(row);
  lock.onclick=()=>{
    lock.disabled=true; inp.disabled=true; solveMark(lock,false); row.remove();
    ctx.vals[b.id]={display:show(v), value:v};
    if(b.answer!=null){
      const lo=log?0:min, hi=log?1000:max, pct=100*(toPos(b.answer)-lo)/(hi-lo);
      const a=h('span','ans'+(pct<12?' l':pct>88?' r':''),esc(b.answerLabel||'Actual: ')+esc(show(b.answer))); s.classList.add('answered');
      a.style.left=pct+'%'; $('.trk',s).appendChild(a);
      big.innerHTML='<span class="lab">'+esc(stripTags(b.answerLabel||'Actual: ').replace(/:\s*$/,''))+'</span>'+esc(show(b.answer))+'<span class="you">You said '+esc(show(v))+'</span>';
      const tol=b.tolerance!=null?b.tolerance:(b.max-b.min)*0.1;
      const close= log? Math.abs(Math.log(Math.max(v,1))-Math.log(Math.max(b.answer,1)))<=Math.log(1+(b.tolerance||0.5)) : Math.abs(v-b.answer)<=tol;
      ctx.award(close?20:10); ctx.grade(close); toneSfx(close?'ok':'neutral');
      const dir = v<b.answer?'under':'over';
      fb(e, close?'ok':'warn', (close?(b.fbClose||''):(b.fbFar||'').replace('{dir}',dir))+(b.reveal?'<div>'+b.reveal+'</div>':''));
    } else { ctx.award(10); sfx.tick(); if(b.reveal||b.fb) fb(e,'neutral',b.reveal||b.fb); }
    done();
  };
  return {el:e,gate:true};
};
RENDER.tapfind=(b,ctx,done)=>{
  const e=h('div','ask'); if(b.prompt) e.appendChild(h('p','prompt',interp(b.prompt)));
  const inner=h('div','tfwrap');
  const need=b.need||b.segments.filter(s=>s.hit).length;
  let found=0, misses=0, fbEl=null; const hitsFb=[]; let para=h('p','tfp'); inner.appendChild(para);
  const card=frame(Object.assign({},b,{skin:b.skin||(b.url?'web':'card')}), inner, 'doc'); card.classList.add('tf');
  e.appendChild(card);
  if(b.paraphrase||b.imagined) e.appendChild(note(b));
  b.segments.forEach(sg=>{
    if(sg.br){ para=h('p','tfp'); para.style.marginTop='12px'; inner.appendChild(para); }
    const sp=h('span','seg',sg.text); sp.tabIndex=0; sp.setAttribute('role','button');
    if(sg.hit) solveMark(sp,true);
    const act=()=>{
      if(card.classList.contains('done')||sp.classList.contains('hit')||sp.classList.contains('miss')) return;
      if(sg.hit){ sp.classList.add('hit'); solveMark(sp,false); found++; sfx.ok();
        if(fbEl) fbEl.remove();
        if(found>=need){ card.classList.add('done'); card.querySelectorAll('[data-solve]').forEach(x=>solveMark(x,false)); ctx.award(Math.max(5,20-misses*5)); ctx.grade(misses===0); fbEl=fb(e,'ok',(hitsFb.length&&need>1?hitsFb.map(x=>'<div>'+x+'</div>').join(''):'')+(sg.fb?sg.fb+' ':'')+(b.fb||'')); done(); }
        else { if(sg.fb) hitsFb.push(sg.fb); fbEl=fb(e,'ok',(sg.fb?sg.fb+' ':'')+'<span class="hint">Found '+found+' of '+need+'. Keep looking.</span>'); }
      } else { misses++; sfx.no(); sp.classList.add('miss'); if(fbEl) fbEl.remove(); fbEl=fb(e,'warn',sg.miss||b.missFb||'Not that one. Look again.'); }
    };
    sp.onclick=act; sp.onkeydown=ev=>{ if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();act();} };
    para.appendChild(sp); para.appendChild(document.createTextNode(' '));
  });
  return {el:e,gate:true,noted:true};
};
RENDER.stop=(b,ctx,done)=>{
  const e=h('div','stopblk');
  e.appendChild(h('div','hazard'));
  const need=b.need||b.nodes.filter(n=>n.stop).length||1;
  e.appendChild(h('div','sh',estopHTML('live',64)+'<span class="t"><b>'+interp(b.prompt||T('stopPrompt'))+'</b><span>'+(b.hint===false?'':(b.hint||(T('stopHint')+(need>1?T('stopHintMany',{n:need}):''))))+'</span></span>'));
  const tl=h('div','tl'); e.appendChild(tl);
  let found=0, tries=0, fbEl=null, finished=false;
  const nodesEl=[];
  b.nodes.forEach((n,k)=>{
    const nd=h('div','node');
    const dot=h('button','sock',String(k+1)); dot.setAttribute('aria-label',T('stopAria')+stripTags(n.who));
    if(n.stop) solveMark(dot,true);
    nd.appendChild(dot); nd.appendChild(h('div',null,'<div class="who">'+n.who+'</div>'+(n.what?'<div class="what">'+n.what+'</div>':''))); tl.appendChild(nd); nodesEl.push(nd);
    dot.onclick=()=>{
      if(finished||dot.disabled) return; tries++; dot.disabled=true; solveMark(dot,false);
      if(fbEl) fbEl.remove();
      if(n.stop){ dot.classList.add('ok'); dot.innerHTML=estopHTML('mini'); found++; sfx.thunk();
        if(found>=need){ finished=true; tl.querySelectorAll('[data-solve]').forEach(x=>solveMark(x,false));
          let first=-1; b.nodes.forEach((x,j)=>{ if(x.stop) first=j; });
          let d=0; if(b.afterNote!==false && nodesEl[first+1]){ const an=h('div','aftnote row',b.afterNote||T('afterNote')); setTimeout(()=>{ tl.insertBefore(an,nodesEl[first+1]); }, wait(450)); } nodesEl.forEach((x,j)=>{ if(j>first&&!b.nodes[j].stop){ d++; setTimeout(()=>{ x.classList.add('after'); }, wait(450+d*220)); } });
          const wrong=tries-found; ctx.award(wrong===0?30:wrong===1?20:10); ctx.grade(wrong===0); ctx.badges.stop=true; ctx.stopBlock=b;
          fbEl=fb(e,'ok',(n.fb||'')+(b.fb?'<div>'+b.fb+'</div>':'')); done(); }
        else fbEl=fb(e,'ok',(n.fb||'')+'<div class="hint">'+found+' of '+need+' found.</div>');
      } else { dot.classList.add('bad'); sfx.no(); setTimeout(()=>{dot.classList.remove('bad'); dot.classList.add('dead');},450); fbEl=fb(e,n.tone||'no',n.fb||'Not here. Try again.'); }
    };
  });
  return {el:e,gate:true};
};
RENDER.sort=(b,ctx,done)=>{
  const e=h('div','ask sorter'); if(b.prompt) e.appendChild(h('p','prompt',interp(b.prompt)));
  const tally=h('div','tally'); tally.setAttribute('aria-hidden','true'); b.items.forEach(()=>tally.appendChild(h('i'))); e.appendChild(tally);
  const stage=h('div','sorter'); e.appendChild(stage);
  let k=0, right=0; const picks=[];
  function card(){
    stage.innerHTML='';
    if(k>=b.items.length){
      const sum=h('div','sortsum'); sum.style.setProperty('--nb',b.buckets.length);
      b.buckets.forEach((name,j)=>{ const col=h('div','col','<h4>'+name+'</h4>'); const ul=h('ul'); b.items.forEach((it,i)=>{ if(it.bucket===j){ const ok=picks[i]===j; ul.appendChild(h('li',ok?'':'w',it.text+(ok?'':'<span class="was">You put it under '+esc(stripTags(b.buckets[picks[i]]))+'</span>'))); } }); col.appendChild(ul); sum.appendChild(col); });
      stage.appendChild(sum);
      ctx.award(right*5); ctx.grade(right===b.items.length);
      ctx.vals[b.id]={display:right+' of '+b.items.length, value:right};
      const t=right===b.items.length?'ok':right>=b.items.length/2?'warn':'no'; toneSfx(t==='ok'?'ok':'neutral');
      fb(stage, t, '<b>'+right+' of '+b.items.length+'.</b> '+(b.fb||''));
      done(); return;
    }
    const it=b.items[k];
    const deck=h('div','deck'+(k>=b.items.length-1?' last':'')); deck.appendChild(h('div','sortcard','<span class="n">'+(k+1)+' / '+b.items.length+'</span><span>'+it.text+'</span>'));
    stage.appendChild(deck);
    const bk=h('div','buckets'); bk.style.setProperty('--nb',b.buckets.length); stage.appendChild(bk);
    b.buckets.forEach((name,j)=>{
      const btn=h('button','bucket',name); if(j===it.bucket) solveMark(btn,true);
      btn.onclick=()=>{
        bk.classList.add('locked'); [...bk.children].forEach(x=>{x.disabled=true; solveMark(x,false);});
        const alt=j!==it.bucket && (it.also||[]).includes(j); const ok=j===it.bucket||alt; if(ok) right++; picks[k]=alt?it.bucket:j;
        btn.classList.add(ok?'right':'wrong'); if(!ok||alt) bk.children[it.bucket].classList.add('right');
        tally.children[k].className=ok?'r':'w'; toneSfx(ok?'ok':'no');
        fb(stage, ok?'ok':'no', (alt?'<b>'+esc(T('sortAlso'))+' '+esc(stripTags(b.buckets[it.bucket]))+'.</b> '+(it.alsoWhy?it.alsoWhy+' ':''):ok?'':'<b>'+esc(stripTags(b.buckets[it.bucket]))+'.</b> ')+(it.why||''));
        const nx=h('button','btn small line',k===b.items.length-1?'See my score':'Next card'); solveMark(nx,true);
        nx.onclick=()=>{ nx.disabled=true; deck.classList.add('filed'); const tgt=bk.children[it.bucket]; if(tgt) tgt.classList.add('took'); setTimeout(()=>{ k++; card(); }, wait(320)); };
        const r=h('div','row'); r.appendChild(nx); stage.appendChild(r);
      };
      bk.appendChild(btn);
    });
  }
  card();
  return {el:e,gate:true};
};
RENDER.order=(b,ctx,done)=>{
  const e=h('div','ask'); if(b.prompt) e.appendChild(h('p','prompt',interp(b.prompt)));
  e.appendChild(h('p','hint','Tap the items in the order you think is right. Tap a numbered item to take it back.'));
  const list=h('div','order'); e.appendChild(list);
  const n=b.items.length; let idx=b.items.map((_,i)=>i);
  let seed=7; const rnd=()=>{seed=(seed*9301+49297)%233280; return seed/233280;};
  for(let i=n-1;i>0;i--){const j=Math.floor(rnd()*(i+1)); [idx[i],idx[j]]=[idx[j],idx[i]];}
  if(idx.every((v,i)=>v===i)) idx.reverse();
  const placed=[]; const btns=[];
  idx.forEach(orig=>{
    const btn=h('button','oitem','<span class="k"></span><span class="t">'+b.items[orig]+'</span>'); btn.dataset.o=orig; btns[orig]=btn;
    btn.onclick=()=>{
      if(list.classList.contains('locked')) return;
      const p=placed.indexOf(orig);
      if(p>=0){ placed.splice(p); } else placed.push(orig);
      sfx.tick(); paint();
      if(placed.length===n) setTimeout(check, wait(250));
    };
    list.appendChild(btn);
  });
  function paint(){
    btns.forEach((btn,orig)=>{ const p=placed.indexOf(orig); btn.classList.toggle('placed',p>=0); $('.k',btn).textContent=p>=0?p+1:''; solveMark(btn,false); });
    if(placed.length<n) solveMark(btns[placed.length],!placed.includes(placed.length));
  }
  function check(){
    if(list.classList.contains('locked')) return;
    list.classList.add('locked'); let right=0;
    placed.forEach((orig,p)=>{ const ok=orig===p; if(ok) right++; btns[orig].classList.add(ok?'right':'wrong'); btns[orig].disabled=true; });
    btns.forEach((x,i)=>{ list.appendChild(x); $('.k',x).textContent=i+1; });
    ctx.award(5+right*3); ctx.grade(right===n); toneSfx(right===n?'ok':'neutral');
    fb(e, right===n?'ok':'warn', '<b>'+(right===n?'All in order.':right+' of '+n+' in the right place. Here is the real order.')+'</b> '+(b.fb||''));
    done();
  }
  paint();
  return {el:e,gate:true};
};
RENDER.reflect=(b,ctx,done)=>{
  const e=h('div','ask');
  e.appendChild(h('div','sit','<span class="eyebrow">'+(b.label||T('reflect'))+'</span><p class="s">'+interp(b.prompt)+'</p>'));
  const pad=h('div','notepad'); const ta=h('textarea'); ta.id='rf-'+ctx.lesson.id+'-'+b.id; ta.placeholder=b.placeholder||'A sentence or two, for yourself.'; ta.setAttribute('aria-label',stripTags(b.prompt)); ta.setAttribute('data-solve-fill','');
  pad.appendChild(ta); e.appendChild(pad);
  const row=h('div','row'); const keep=h('button','btn small',esc(b.button||'Keep this')); solveMark(keep,true); const skip=h('button','btn ghost small','Skip');
  row.appendChild(keep); row.appendChild(skip); e.appendChild(row);
  const fin=(kept)=>{
    keep.disabled=skip.disabled=true; ta.readOnly=true; solveMark(keep,false); ta.removeAttribute('data-solve-fill'); row.remove();
    const v=ta.value.trim();
    ctx.vals[b.id]={display:v?'“'+esc(v)+'”':'(you skipped this one)', text:v};
    if(kept&&v.length>=8){ ctx.award(15); sfx.tick(); (P.refl[ctx.lesson.id]=P.refl[ctx.lesson.id]||{})[b.id]=v; saveP(); }
    if(b.fb) fb(e,'neutral',b.fb);
    done();
  };
  keep.onclick=()=>fin(true); skip.onclick=()=>fin(false);
  return {el:e,gate:true};
};
RENDER.fill=(b,ctx,done)=>{
  const e=h('div','ask'); if(b.prompt) e.appendChild(h('p','prompt',interp(b.prompt)));
  const fs=h('div','fields'); e.appendChild(fs);
  const ins=b.fields.map((f,k)=>{ const l=h('label','field'); l.innerHTML='<span>'+f.label+'</span>'; const i=h('textarea'); i.rows=1; const grow=()=>{ i.style.height='auto'; i.style.height=i.scrollHeight+'px'; }; i.addEventListener('input',grow); setTimeout(grow,0); i.id='fl-'+ctx.lesson.id+'-'+b.id+'-'+k; i.placeholder=f.placeholder||''; i.setAttribute('data-solve-fill',''); l.appendChild(i); fs.appendChild(l); return i; });
  const btn=h('button','btn small',esc(b.button||'Check the gaps')); solveMark(btn,true); const row=h('div','row'); row.appendChild(btn); e.appendChild(row);
  btn.onclick=()=>{
    btn.disabled=true; solveMark(btn,false); row.remove();
    const blanks=ins.filter(i=>!i.value.trim()); ins.forEach(i=>{i.classList.toggle('gap',!i.value.trim()); i.classList.toggle('good',!!i.value.trim()); i.readOnly=true; i.removeAttribute('data-solve-fill');});
    ctx.award(15); toneSfx(blanks.length?'neutral':'ok');
    ctx.vals[b.id]={display:ins.map(i=>esc(i.value.trim())||'(blank)').join(', '), parts:ins.map(i=>esc(i.value.trim().replace(/[.]+$/,''))||'(blank)')};
    fb(e, blanks.length?'warn':'ok', blanks.length? '<b>'+blanks.length+' blank.</b> '+(b.fbBlank||'') : (b.fbFull||''));
    done();
  };
  return {el:e,gate:true};
};
const RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function countUp(el,target,dec,prefix,suffix){
  el.textContent=(prefix||'')+fmt(target,dec)+(suffix||'');   /* resting state is always the true figure */
  if(FAST||RM) return;
  const t0=performance.now(), dur=1300;
  (function tick(now){const p=Math.min(1,(now-t0)/dur), k=1-Math.pow(1-p,3); el.textContent=(prefix||'')+fmt(target*k,dec)+(suffix||''); if(p<1) requestAnimationFrame(tick);})(t0);
}
RENDER.ledger=b=>{
  const e=h('div','ex ex-receipt');
  e.innerHTML=(b.tag||b.meta)?'<div class="rh">'+(b.tag||'')+(b.meta?'<span>'+b.meta+'</span>':'')+'</div>':'';
  if(b.total!=null){ const st=h('div',null,'<div class="tot">'+(b.totalLabel||'Total')+'</div><div class="big"></div>'); e.appendChild(st); countUp($('.big',st),b.total,b.decimals||0,b.prefix,b.suffix); }
  const lg=h('div','ledger'); (b.rows||[]).forEach(r=>lg.appendChild(h('div','r'+(r[2]==='sum'?' sum':''),'<span>'+r[0]+'</span><span>'+r[1]+'</span>'))); e.appendChild(lg);
  const w=h('div',null); w.appendChild(e);
  if(b.caption) w.appendChild(h('p','cap',b.caption));
  return {el:w};
};
RENDER.stat=b=>{
  const e=h('div','stat'); e.innerHTML=(b.label?'<span class="eyebrow">'+b.label+'</span>':'')+(b.pre?'<span class="pre">'+b.pre+'</span>':'')+'<b>'+(b.prefix||'')+'0</b>'+(b.caption?'<span class="cap">'+interp(b.caption)+'</span>':'');
  countUp($('b',e),b.value,b.decimals||0,b.prefix,b.suffix);
  return {el:e};
};
RENDER.waffle=b=>{
  const e=h('div','ask');
  if(b.title) e.appendChild(h('p','prompt',b.title));
  const g=h('div','waffle'); const cols=b.cols||(b.total>400?40:b.total>100?25:10); g.style.setProperty('--cols',cols); g.setAttribute('role','img'); g.setAttribute('aria-label',b.hi+' of '+b.total+(b.hiLabel?': '+stripTags(b.hiLabel):''));
  for(let i=0;i<b.total;i++) g.appendChild(h('i'));
  e.appendChild(g);
  e.appendChild(h('div','legend','<span><i class="h"></i>'+(b.hiLabel||'')+'</span><span><i></i>'+(b.restLabel||'')+'</span>'));
  if(b.caption) e.appendChild(h('p','cap',b.caption));
  const cells=g.children; let k=0; const step=Math.max(1,Math.ceil(b.hi/40));
  (function fill(){ for(let j=0;j<step&&k<b.hi;j++,k++) cells[k].classList.add('h'); if(k<b.hi) setTimeout(fill,FAST?0:18); })();
  return {el:e};
};
RENDER.bars=b=>{
  const e=h('div','ask'); if(b.title) e.appendChild(h('p','prompt',b.title));
  const w=h('div','bars'); e.appendChild(w);
  const max=b.max||(/%/.test(b.suffix||'')?100:Math.max(...b.items.map(i=>i.value)));
  b.items.forEach(it=>{ const r=h('div','b'+(it.hi?' hi':'')); r.innerHTML='<span class="lab">'+it.label+'</span><span class="track"><span class="fill"></span></span><span class="v">'+(b.prefix||'')+(it.display||fmt(it.value,b.decimals||0))+(b.suffix||'')+'</span>'; w.appendChild(r);
    setTimeout(()=>{ $('.fill',r).style.width=(100*it.value/max)+'%'; },150); });
  if(b.caption) e.appendChild(h('p','cap',b.caption));
  return {el:e};
};
RENDER.rate=(b,ctx,done)=>{
  const e=h('div','ask'); if(b.prompt) e.appendChild(h('p','prompt',interp(b.prompt)));
  const scale=b.scale||['No','Partly','Yes']; const picks=new Array(b.items.length).fill(null);
  const g=h('div','rate'); e.appendChild(g);
  const btn=h('button','btn small',esc(b.button||'Done')); btn.disabled=true; const row=h('div','row'); row.appendChild(btn);
  b.items.forEach((it,k)=>{
    const r=h('div','rrow'); r.innerHTML='<span class="rl">'+it+'</span>'; const opts=h('div','ropts'); opts.setAttribute('role','group');
    scale.forEach((lab,j)=>{ const o=h('button','ropt',esc(lab)); if(j===Math.min(1,scale.length-1)) solveMark(o,true); o.setAttribute('aria-label',stripTags(it)+': '+lab);
      o.onclick=()=>{ if(btn.dataset.done) return; sfx.tick(); picks[k]=j; [...opts.children].forEach((x,q)=>{x.classList.toggle('on',q===j); x.setAttribute('aria-pressed',q===j); solveMark(x,false);}); if(picks.every(p=>p!=null)){btn.disabled=false; solveMark(btn,true);} };
      opts.appendChild(o); });
    r.appendChild(opts); g.appendChild(r);
  });
  e.appendChild(row);
  btn.onclick=()=>{
    btn.dataset.done='1'; btn.disabled=true; solveMark(btn,false); row.remove(); g.querySelectorAll('.ropt').forEach(x=>x.disabled=true);
    const min=Math.min(...picks); const lowest=b.items.filter((_,k)=>picks[k]===min).map(stripTags);
    const same=picks.every(p=>p===picks[0]);
    ctx.vals[b.id]={display:same?'none stands out (you marked every one “'+esc(scale[picks[0]])+'”)':esc(lowest.join('; ')), parts:picks.map(p=>esc(scale[p])), value:picks};
    ctx.award(15); sfx.ok();
    const counts=scale.map((_,j)=>picks.filter(p=>p===j).length);
    fb(e,'neutral','<b>'+scale.map((l,j)=>counts[j]+' '+esc(l)).join(' · ')+'.</b> '+(b.fb||''));
    done();
  };
  return {el:e,gate:true};
};
RENDER.cards=(b,ctx,done)=>{
  const e=h('div','ask'); if(b.prompt) e.appendChild(h('p','prompt',interp(b.prompt)));
  const g=h('div','flips'); e.appendChild(g); let open=0;
  b.cards.forEach((c,i)=>{
    const f=h('button','flip','<span class="in"><span class="face front"><span>'+c.front+'</span><span class="tapme">Turn over</span></span><span class="face back"><span class="bf">'+esc(stripTags(c.front))+'</span>'+c.back+'</span></span>'); solveMark(f,true);
    f.setAttribute('aria-expanded','false');
    f.onclick=()=>{ if(f.classList.contains('open')) return; f.classList.add('open'); f.setAttribute('aria-expanded','true'); solveMark(f,false); sfx.tick(); open++; if(open===b.cards.length){ ctx.award(10); if(b.fb) fb(e,'neutral',b.fb); done(); } };
    g.appendChild(f);
  });
  return {el:e,gate:true};
};
RENDER.runaway=(b,ctx,done)=>{
  const e=h('div','ask run'); if(b.prompt) e.appendChild(h('p','prompt',interp(b.prompt)));
  let limit=null;
  const con=h('div','console'); con.innerHTML='<div class="ch"><span>'+(b.tag?esc(stripTags(b.tag)):'Running')+'</span><span>'+(b.meta?esc(stripTags(b.meta)):'')+'</span></div>';
  const inn=h('div','body'); con.appendChild(inn); e.appendChild(con);
  let limIn=null;
  if(b.limit){
    const lw=h('div','slider'); lw.innerHTML='<span class="eyebrow">'+(b.limit.label||'Set a limit before you start')+'</span><div class="big">'+fmt(b.limit.start)+(b.unit?' '+b.unit:'')+'</div><div class="trk"><input type="range" id="lim-'+ctx.lesson.id+'-'+b.id+'" min="'+b.limit.min+'" max="'+b.limit.max+'" step="'+(b.limit.step||1)+'" value="'+b.limit.start+'" aria-label="Limit"></div>';
    inn.appendChild(lw); limIn=$('input',lw); limIn.oninput=()=>{ $('.big',lw).textContent=fmt(limIn.value)+(b.unit?' '+b.unit:''); };
  }
  const meter=h('div','meter'); meter.innerHTML='<div><div class="lbl">'+(b.counter||'Count')+'</div><div class="count"><span>'+(b.prefix||'')+'0</span><small>'+(b.unit||'')+'</small></div></div>';
  meter.insertAdjacentHTML('beforeend',estopHTML('',112,'button'));
  const stopB=$('button.estop',meter); stopB.disabled=true; stopB.setAttribute('aria-label','Stop');
  inn.appendChild(meter);
  const gauge=h('div','gauge','<i></i>'); inn.appendChild(gauge);
  const log=h('div','log'); inn.appendChild(log);
  const startB=h('button','btn small',esc(b.startLabel||'Start')); solveMark(startB,true); const row=h('div','row'); row.appendChild(startB); e.appendChild(row);
  const cnt=$('.count span',meter);
  let v=0, rate=b.rate||1, timer=null, ended=false, ev=0, lastEv=0;
  function end(kind){
    if(ended) return; ended=true; clearInterval(timer); stopB.disabled=true; stopB.classList.remove('live'); solveMark(stopB,false);
    let html, tone, xp;
    if(kind==='limit'){ html=b.outcomes.limit; tone='ok'; xp=25; }
    else if(kind==='max'){ html=b.outcomes.max; tone=b.maxTone||'no'; xp=b.maxTone?15:5; }
    else if(v<=(b.okBelow||0)){ html=b.outcomes.early; tone='ok'; xp=20; }
    else { html=b.outcomes.late; tone='warn'; xp=10; }
    if(kind==='human'){ stopB.classList.add('pressed'); sfx.thunk(); } else toneSfx(tone==='ok'?'ok':'no');
    const n=Math.floor(v), u=b.unit?(n===1?(b.unitOne||b.unit.replace(/s$/,'')):b.unit):'';
    ctx.award(xp); ctx.vals[b.id]={display:(b.prefix||'')+fmt(n)+(u?' '+u:''), value:v, kind};
    fb(e,tone,'<b>'+esc(kind==='limit'?(b.limitLabel||'Halted at'):(b.endLabel||'Stopped at'))+' '+(b.prefix||'')+fmt(n)+(u?' '+u:'')+'.</b> '+interp(html||''));
    done();
  }
  startB.onclick=()=>{
    startB.disabled=true; solveMark(startB,false); row.remove(); if(!b.limit){ const hint=h('p','runhint',esc(b.stopHint||'Press the red button when you would stop it.')); e.insertBefore(hint,con); } if(limIn){limIn.disabled=true; limit=Number(limIn.value);
      const m=h('b'); m.style.left=(100*limit/b.max)+'%'; gauge.appendChild(m); }
    stopB.disabled=false; stopB.classList.add('live'); if(!b.limit) setTimeout(()=>{ if(!ended) solveMark(stopB,true); }, FAST?700:900);
    const tick=FAST?10:60; const t0=performance.now();
    timer=setInterval(()=>{
      const sec=(performance.now()-t0)/1000;
      rate=(b.rate||1)*Math.pow(b.accel||1.5, FAST?sec*20:sec);
      v+=rate*tick/1000;
      if(limit!=null && v>=limit){ v=limit; render(); end('limit'); return; }
      if(v>=b.max){ v=b.max; render(); end('max'); return; }
      render();
    },tick);
  };
  function render(){
    cnt.textContent=(b.prefix||'')+fmt(Math.floor(v)); $('i',gauge).style.width=Math.min(100,100*v/b.max)+'%';
    if(b.events && b.events.length && Math.floor(v)>lastEv){ const steps=Math.max(1,Math.floor(b.max/(b.events.length*3))); if(Math.floor(v)-lastEv>=steps){ lastEv=Math.floor(v); log.prepend(h('div',null,'› '+b.events[ev++%b.events.length].replace('{n}',fmt(Math.floor(v))))); } }
  }
  stopB.onclick=()=>end('human');
  return {el:e,gate:true};
};
RENDER.vigil=(b,ctx,done)=>{
  const e=h('div','ask'); if(b.prompt) e.appendChild(h('p','prompt',interp(b.prompt)));
  const inn=h('div','vig'); e.appendChild(inn);
  const clock=h('div','clock','Press the light only when it turns red'); clock.setAttribute('aria-live','polite');
  const bez=h('div','bezel'); const lamp=h('button','lamp off'); lamp.setAttribute('aria-label','The light. Press it when it turns red.'); bez.appendChild(lamp);
  const start=h('button','btn small','Start my shift'); solveMark(start,true);
  inn.appendChild(clock); inn.appendChild(bez); inn.appendChild(start);
  const rounds=b.rounds; let r=0, red=false, t0=0, results=[], timer=null, ticker=null;
  const win=b.window||2000;
  function round(){
    if(r>=rounds.length) return finish();
    const R=rounds[r]; lamp.className='lamp'; red=false; clock.textContent=R.label||('Round '+(r+1));
    const ms=FAST?120:(R.wait[0]+Math.random()*(R.wait[1]-R.wait[0]));
    if(R.ticker && !FAST){ let k=0; ticker=setInterval(()=>{ clock.textContent=R.ticker[k++%R.ticker.length]; }, 1800); }
    timer=setTimeout(()=>{
      clearInterval(ticker); red=true; lamp.className='lamp red'; t0=performance.now(); solveMark(lamp,true); clock.textContent=''; tone(880,.12,'square',.03);
      timer=setTimeout(()=>{ if(red){ red=false; solveMark(lamp,false); results.push({label:R.label,ms:null}); lamp.className='lamp off'; clock.textContent='Missed. It went back to green.'; sfx.no(); r++; setTimeout(round,wait(1400)); } }, FAST?2000:win);
    }, ms);
  }
  lamp.onclick=()=>{
    if(lamp.classList.contains('off')) return;
    if(!red){ clock.textContent='That was still green'; sfx.tick(); return; }
    red=false; clearTimeout(timer); solveMark(lamp,false); sfx.thunk();
    const ms=Math.round(performance.now()-t0); results.push({label:rounds[r].label,ms});
    lamp.className='lamp off'; clock.textContent=(ms/1000).toFixed(2)+' seconds'; r++; setTimeout(round,wait(1300));
  };
  start.onclick=()=>{ start.remove(); round(); };
  function finish(){
    lamp.className='lamp off';
    const caught=results.filter(x=>x.ms!=null).length;
    const tb=h('table'); tb.innerHTML='<tr><th>When</th><th>Your time</th></tr>'+results.map(x=>'<tr><td>'+esc(x.label||'')+'</td><td>'+(x.ms==null?'missed':(x.ms/1000).toFixed(2)+' s')+'</td></tr>').join('');
    inn.appendChild(tb);
    ctx.award(10+caught*5);
    ctx.vals[b.id]={display:caught+' of '+results.length, value:caught};
    fb(e,'neutral',(b.fb||''));
    done();
  }
  return {el:e,gate:true};
};

/* ---------------- finish ---------------- */
function buildFinish(){
  const ctx=L, lesson=ctx.lesson, f=lesson.finish||{};
  const el=h('section','step finish');
  const prev=P.done[lesson.id];
  P.done[lesson.id]={xp:Math.max(ctx.xp,prev?prev.xp:0), at:Date.now(), stop:!!ctx.badges.stop||!!(prev&&prev.stop)};
  P.xp=Object.values(P.done).reduce((a,d)=>a+d.xp,0);
  if(!P.days.includes(today())) P.days.push(today());
  saveP(); setTimeout(()=>sfx.done(),300);
  const acc=ctx.graded?Math.round(100*ctx.firstTry/ctx.graded):null;
  const num=(lesson.kind==='chapter'?T('chapter')+' '+String(lesson.num).padStart(2,'0'):lesson.kind==='checkpoint'?T('checkpoint',{p:lesson.part}):lesson.kind==='intro'?T('intro'):T('closing')).toUpperCase();
  const top=lesson.kind==='closing'?T('stampClosing'):ctx.badges.stop?T('stampFound'):lesson.kind==='checkpoint'?T('stampCheckpoint'):T('stampPlain');
  const cl=h('div','closed');
  cl.innerHTML='<span class="eyebrow">'+(lesson.kind==='checkpoint'?T('checkpointDone'):T('closed'))+'</span><h2>'+(f.headline||esc(lesson.title))+'</h2><div class="stampbox'+(ctx.badges.stop||lesson.kind==='checkpoint'?'':' ink')+'">'+stampSVG(top,num)+'</div>';
  el.appendChild(cl);
  const m=h('div','medal'); m.innerHTML='<span><b>'+fmt(ctx.xp)+'</b>'+T('points')+'</span>'+(acc!=null?'<span><b>'+acc+'%</b>'+T('firstTry')+'</span>':'')+'<span><b>'+streak()+'</b>'+(streak()===1?T('streakDay'):T('streakDays'))+'</span>';
  el.appendChild(m);
  const sb=ctx.stopBlock||firstStop(lesson);
  if(sb && ctx.badges.stop) el.appendChild(chainEl(sb,'finish'));
  else if(lesson.kind==='checkpoint') el.appendChild(recapEl(lesson,'finish'));
  if((lesson.questions||[]).length){
    const q=h('div',null,'<div class="eyebrow" style="margin-bottom:10px">'+T('trained')+'</div>'); const qc=h('div','qcards');
    lesson.questions.forEach((n,i)=>{ const c=h('span','qc','<i>'+n+'</i>'+esc(QUESTIONS[n-1])); c.style.animationDelay=(300+i*140)+'ms'; qc.appendChild(c); });
    q.appendChild(qc); el.appendChild(q);
  }
  if(f.takeaway) el.appendChild(h('div','take','<small>'+T('takeaway')+'</small>'+f.takeaway));
  if(f.echo){ const ids=[].concat(f.echo); const parts=ids.map(id=>ctx.vals[id]&&ctx.vals[id].text?'<p class="echo">“'+esc(ctx.vals[id].text)+'”</p>':'').join(''); if(parts) el.appendChild(h('div',null,'<div class="eyebrow" style="margin-bottom:10px">'+T('wrote')+'</div>'+parts)); }
  if(f.sit) el.appendChild(RENDER.sit({label:T('lastSit'), html:f.sit}).el);
  if(f.elsewhere&&f.elsewhere.length){ const w=h('div',null,'<div class="eyebrow" style="margin-bottom:10px">'+T('elsewhere')+'</div>'); const g=h('div','else'); f.elsewhere.forEach(x=>g.appendChild(h('div','card','<span class="eyebrow">'+(x.when||'')+'</span>'+x.text))); w.appendChild(g); el.appendChild(w); }

  if(f.sources&&f.sources.length){ el.appendChild(h('div','src','<span class="eyebrow">'+T('sources')+'</span>'+f.sources.map(s=>'<span>'+(s.url?'<a href="'+s.url+'" target="_blank" rel="noopener">'+s.label+'</a>':s.label)+'</span>').join('')+(f.note?'<span>'+f.note+'</span>':''))); }
  return el;
}

C.RENDER=RENDER;
route();
})();

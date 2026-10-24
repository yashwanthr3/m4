// Stage 2 · Fact base. One src/<id>.md per lesson in the kit's SRC_FORMAT.
// Case-rich: one case per lesson, taken from the source. Concept-only: one real, publicly documented
// incident per concept (or a labelled imagined scene), verified against primary sources by research
// agents (one per 5 or 6 cases, all at once), pass 1 verify then pass 2 write, same agent.
// Gate: every quotation in the FROM THE SOURCE section is verbatim in the raw source (quote_check.py),
// and every NOTES URL resolves. Authoring cannot start until both pass.
import { runAgent, lastJSON } from '../agents/index.js';
import { runEval } from '../evals.js';
import { settings } from '../config.js';
import { chunk, pool, listSrc } from './common.js';

export function marker(run) {
  const c = run.readJSON('classify.json', {});
  return c.signals?.slides > 0 || /pptx/.test(c.format || '') ? 'FROM THE COURSE DECK' : 'FROM THE SOURCE';
}

export async function factbase(run) {
  const meta = run.meta(); const scope = meta.scope || {}; const cls = run.readJSON('classify.json', {});
  const mk = marker(run);

  // 1. the case list (kept across restarts)
  let cases = run.readJSON('cases.json');
  if (!cases?.length) {
    const want = scope.size === 'pilot' ? `a pilot of ${scope.pilotCount || 3} lessons plus, if the pilot spans a part, its checkpoint` : 'every unit of the source';
    const r = await runAgent(run, {
      stage: 'factbase', role: 'research', task: 'plan', label: 'planner', briefs: ['briefs/RESEARCH_BRIEF.md', 'briefs/SRC_FORMAT.md'],
      prompt: `Read studio/source.md (the author's source, ${cls.kind}, about ${cls.words} words) and studio/run.json.\n` +
        `Learner: ${scope.learner || meta.learner || 'not stated'}. Scope: ${want}. ` +
        (cls.kind === 'concept-only'
          ? `The source is concept-only. Pair each concept with ${scope.incidents === 'imagined' ? 'an imagined scene, clearly labelled imagined' : 'one real, publicly documented incident with primary sources'}.\n`
          : 'The source is case-rich: one case from the source per lesson.\n') +
        'Do not write files yet. Reply with the case list as one fenced json block: {"cases":[{"id":"ch01","kind":"chapter|checkpoint|intro|closing","concept":"...","incident":"...","citation":"primary source","framing":"the framing question that names the concept"}]}'
    });
    cases = lastJSON(r.text)?.cases || [];
    if (!cases.length) return { status: 'blocked', detail: 'The planner did not return a case list.', reply: r.text?.slice(0, 600) };
    run.writeJSON('cases.json', cases);
    run.log('factbase.cases', { stage: 'factbase', count: cases.length, ids: cases.map(c => c.id) });
  }

  // 2. research agents (skip ids whose src already exists: resume)
  const have = new Set(listSrc(run).map(f => f.replace(/\.md$/, '')));
  const todo = cases.filter(c => !have.has(c.id));
  await pool(settings.concurrency, chunk(todo, 6).map((part, k) => async () => {
    const ids = part.map(c => c.id);
    const list = part.map(c => `- ${c.id}: concept "${c.concept}"; ${c.incident}; framing question (verbatim): "${c.framing}"`).join('\n');
    const label = `research-${ids[0]}`;
    const p1 = await runAgent(run, {
      stage: 'factbase', role: 'research', label: label + '-verify', ids,
      briefs: ['briefs/RESEARCH_BRIEF.md'],
      prompt: `Pass 1 (verify) for these cases:\n${list}\nThe raw source is studio/source.md. Flag anywhere this brief is wrong.`
    });
    await runAgent(run, {
      stage: 'factbase', role: 'research', label: label + '-write', ids, resume: p1.session,
      briefs: ['briefs/RESEARCH_BRIEF.md', 'briefs/SRC_FORMAT.md'],
      prompt: `Pass 2 (write). Write src/<id>.md for ${ids.join(', ')} exactly as briefs/SRC_FORMAT.md specifies, with each framing question verbatim. ` +
        `Before "---\\nNOTES", add a section headed ${mk} that quotes studio/source.md EXACTLY in typographic quotes, one line per quote with its slide or clause number. ` +
        'Add CAUTIONS for dismissed allegations, contested blame and secondary-only figures. Keep figures as the source writes them.'
    });
    for (const id of ids) if (listSrc(run).includes(id + '.md')) run.log('src.written', { stage: 'factbase', id });
  }));

  const missing = cases.filter(c => !listSrc(run).includes(c.id + '.md')).map(c => c.id);
  if (missing.length) return { status: 'blocked', detail: `No fact base written for ${missing.join(', ')}.` };

  // 3. hard checks: quotes verbatim, NOTES URLs resolve
  let quotes = await runEval('quote', { course: run.dir, extra: ['--raw', run.p('studio/source.md'), '--marker', mk] });
  if (!quotes.ok && quotes.missing?.length) {
    await runAgent(run, {
      stage: 'factbase', role: 'research', task: 'quotes', label: 'quote-fix', ids: cases.map(c => c.id),
      prompt: `tools/quote_check.py found quotes in the ${mk} sections that are not verbatim in studio/source.md:\n${quotes.missing.join('\n')}\nCorrect each to the exact source wording, or remove it. Change nothing else.`
    });
    quotes = await runEval('quote', { course: run.dir, extra: ['--raw', run.p('studio/source.md'), '--marker', mk] });
  }
  const urls = await runEval('urls', { course: run.dir });
  const attested = run.readJSON('url-attest.json', {});
  for (const u of urls.urls || []) if (!u.ok && u.kind === 'unreachable' && attested[u.url]) Object.assign(u, { ok: true, attested: attested[u.url] });
  urls.ok = (urls.urls || []).every(u => u.ok);
  run.writeJSON('results/factbase.json', { by: 'automated', marker: mk, quotes, urls, cases: cases.length });
  run.log('factbase.checked', { stage: 'factbase', quotesOk: quotes.ok, missingQuotes: quotes.missing?.length || 0, urlsOk: urls.ok, badUrls: (urls.urls || []).filter(u => !u.ok).length, urls: (urls.urls || []).length });
  const blocks = [];
  if (!quotes.ok) blocks.push(`${quotes.missing?.length || 'some'} quotations are not verbatim in the source`);
  const broken = (urls.urls || []).filter(u => !u.ok && u.kind === 'broken').length;
  const unreachable = (urls.urls || []).filter(u => !u.ok && u.kind !== 'broken').length;
  if (broken) blocks.push(`${broken} NOTES URLs return an error`);
  if (unreachable && settings.urlCheck !== 'warn') blocks.push(`${unreachable} NOTES URLs could not be reached from this machine; open each and confirm it, or fix the network`);
  if (blocks.length) return { status: 'blocked', detail: blocks.join('; ') + '.' };
  return { status: 'done', detail: `${cases.length} src files; quotes verbatim; ${(urls.urls || []).length} URLs resolve` };
}

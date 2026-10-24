// Read lesson files through the kit's own loader (eval/dump.js) and write them back as one
// COURSE.lesson({...}) call. Only the studio's pattern decisions write lessons this way; agents edit
// the files directly.
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

export function readLessons(run, ids) {
  const files = ids.map(id => run.p('lessons', id + '.js')).filter(f => fs.existsSync(f));
  if (!files.length) return {};
  try {
    const out = JSON.parse(execFileSync('node', [run.p('eval/dump.js'), ...files], { encoding: 'utf8', maxBuffer: 64 << 20 }));
    const res = {};
    for (const [f, L] of Object.entries(out)) res[f.split('/').pop().replace(/\.js$/, '')] = L;
    return res;
  } catch { return {}; }
}

export function readLesson(run, id) { return readLessons(run, [id])[id] || null; }

export function writeLesson(run, id, L) {
  const body = JSON.stringify(L, null, 1).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  fs.writeFileSync(run.p('lessons', id + '.js'), `COURSE.lesson(${body});\n`);
}

export function plain(s) {
  return String(s || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

#!/usr/bin/env node
// Vendoring: the kit and the pattern catalogue are kept byte-for-byte as published.
//   node scripts/vendor.mjs lock                     record sha256 of every vendored file
//   node scripts/vendor.mjs check                    fail if any vendored file drifted from the lock
//   node scripts/vendor.mjs diff kit <fresh-dir>     compare a fresh download with vendor/kit
//   node scripts/vendor.mjs diff patterns <dir> --apply   replace vendor/patterns with <dir>
// A fresh kit download comes from the Trust Course Kit artifact (Artifact read with every path,
// out_dir <fresh-dir>), see CLAUDE.md "Re-vendoring".
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCK = path.join(ROOT, 'vendor/vendor.lock.json');
const TREES = { kit: 'vendor/kit', patterns: 'vendor/patterns', patches: 'vendor/patches' };

function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = path.join(dir, d.name);
    if (d.name === '__pycache__' || d.name === '.DS_Store') return [];
    return d.isDirectory() ? walk(p, base) : [path.relative(base, p)];
  }).sort();
}
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const hashes = dir => Object.fromEntries(walk(dir).map(f => [f, sha(path.join(dir, f))]));

const [cmd, which, fresh, ...rest] = process.argv.slice(2);

if (cmd === 'lock') {
  const lock = { written: new Date().toISOString(), trees: {} };
  for (const [k, d] of Object.entries(TREES)) lock.trees[k] = hashes(path.join(ROOT, d));
  fs.writeFileSync(LOCK, JSON.stringify(lock, null, 1) + '\n');
  console.log('lock written:', Object.entries(lock.trees).map(([k, v]) => `${k} ${Object.keys(v).length} files`).join(', '));
} else if (cmd === 'check') {
  const lock = JSON.parse(fs.readFileSync(LOCK, 'utf8'));
  let bad = 0;
  for (const [k, d] of Object.entries(TREES)) {
    const now = hashes(path.join(ROOT, d)); const was = lock.trees[k] || {};
    for (const f of new Set([...Object.keys(now), ...Object.keys(was)])) {
      if (now[f] !== was[f]) { bad++; console.log(`${k}: ${!was[f] ? 'added' : !now[f] ? 'removed' : 'changed'} ${f}`); }
    }
  }
  // the patch must still apply cleanly to the pristine kit
  const tmp = fs.mkdtempSync(path.join(ROOT, 'runs', '.vendor-check-'));
  try {
    fs.cpSync(path.join(ROOT, TREES.kit), tmp, { recursive: true });
    execFileSync('patch', ['-p1', '--dry-run', '-s', '-i', path.join(ROOT, 'vendor/patches/pattern-block.diff')], { cwd: tmp });
    console.log('pattern-block.diff applies cleanly');
  } catch (e) { bad++; console.log('pattern-block.diff does NOT apply:', String(e.stdout || e.message)); }
  finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  console.log(bad ? `${bad} vendoring problems` : 'vendor OK (byte-for-byte)');
  process.exit(bad ? 1 : 0);
} else if (cmd === 'diff' && TREES[which] && fresh) {
  const mine = hashes(path.join(ROOT, TREES[which])); const theirs = hashes(path.resolve(fresh));
  const rows = [];
  for (const f of new Set([...Object.keys(mine), ...Object.keys(theirs)])) {
    if (mine[f] !== theirs[f]) rows.push(`${!mine[f] ? '+ added  ' : !theirs[f] ? '- removed' : '~ changed'} ${f}`);
  }
  console.log(rows.length ? rows.sort().join('\n') : 'identical');
  if (rest.includes('--apply') && rows.length) {
    fs.rmSync(path.join(ROOT, TREES[which]), { recursive: true, force: true });
    fs.cpSync(path.resolve(fresh), path.join(ROOT, TREES[which]), { recursive: true });
    console.log(`applied: vendor/${which} replaced. Run "npm run vendor:lock" and the parity tests.`);
  }
} else {
  console.log('usage: vendor.mjs lock | check | diff <kit|patterns> <dir> [--apply]');
  process.exit(2);
}

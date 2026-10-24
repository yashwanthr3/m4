#!/usr/bin/env node
// One-time setup: npm packages, a Python virtual environment in .venv, its packages, and Chromium.
//   npm run setup
// STUDIO_SKIP_BROWSER=1 skips the Chromium download (when a matching browser is already installed).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, VENV, PYTHON, hasVenv } from './venv.mjs';

const run = (cmd, args, opts = {}) => { console.log(`\n$ ${cmd} ${args.join(' ')}`); execFileSync(cmd, args, { stdio: 'inherit', cwd: ROOT, ...opts }); };

function systemPython() {
  for (const c of process.platform === 'win32' ? ['py', 'python'] : ['python3', 'python']) {
    try {
      const v = execFileSync(c, [...(c === 'py' ? ['-3'] : []), '-c', 'import sys;print(sys.version_info[:2]>=(3,9))'], { encoding: 'utf8' }).trim();
      if (v === 'True') return c;
    } catch { /* try the next one */ }
  }
  throw new Error('Python 3.9 or later is needed. Install it and run `npm run setup` again.');
}

if (!hasVenv()) {
  const py = systemPython();
  run(py, [...(py === 'py' ? ['-3'] : []), '-m', 'venv', VENV]);
} else console.log(`Using the existing virtual environment at ${path.relative(ROOT, VENV) || VENV}`);

run(PYTHON, ['-m', 'pip', 'install', '--upgrade', 'pip']);
run(PYTHON, ['-m', 'pip', 'install', '-r', 'requirements.txt']);
if (process.env.STUDIO_SKIP_BROWSER !== '1') run(PYTHON, ['-m', 'playwright', 'install', 'chromium']);
if (!fs.existsSync(path.join(ROOT, 'node_modules'))) run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install']);

for (const tool of ['pandoc', 'pdftotext']) {
  try { execFileSync(tool, ['-v'], { stdio: 'ignore' }); }
  catch { console.log(`\nNote: ${tool} is not installed. It is only needed to read ${tool === 'pandoc' ? 'Word' : 'PDF'} sources (macOS: brew install pandoc poppler; Ubuntu: sudo apt install pandoc poppler-utils).`); }
}
console.log('\nSetup done. Start the studio with: npm start');

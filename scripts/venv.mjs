// The studio's Python lives in .venv at the repo root (created by `npm run setup`).
// activate() puts .venv's bin folder first on PATH, so every `python3` the studio, the kit's own
// scripts (tools/suite.sh, diff_added.py, ...) and agents' Bash commands run resolves to the venv.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const VENV = process.env.STUDIO_VENV ? path.resolve(process.env.STUDIO_VENV) : path.join(ROOT, '.venv');
const WIN = process.platform === 'win32';
export const VENV_BIN = path.join(VENV, WIN ? 'Scripts' : 'bin');
export const PYTHON = path.join(VENV_BIN, WIN ? 'python.exe' : 'python3');

export function hasVenv() { return fs.existsSync(PYTHON); }

/** Returns the python command to use: the venv's if it exists, otherwise python3 on PATH. */
export function activate() {
  if (!hasVenv()) return WIN ? 'python' : 'python3';
  const parts = (process.env.PATH || '').split(path.delimiter).filter(p => p && p !== VENV_BIN);
  process.env.PATH = [VENV_BIN, ...parts].join(path.delimiter);
  process.env.VIRTUAL_ENV = VENV;
  delete process.env.PYTHONHOME;
  return PYTHON;
}

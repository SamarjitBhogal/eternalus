/**
 * Pure helpers for the Stop hook: which files changed, and which checks they need.
 * Kept apart from `stop-check.mjs` so `changedFiles.test.mjs` can import them without running
 * the hook.
 */
import path from 'node:path';

const LINTABLE = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.jsx']);

/**
 * Parses `git status --porcelain -z` output into the paths that still exist (deleted paths are
 * skipped: ESLint cannot lint a missing file). A rename lists the new path, then the old one.
 */
export function parsePorcelainZ(output) {
  const fields = output.split('\0');
  const paths = [];
  for (let i = 0; i < fields.length; i += 1) {
    const entry = fields[i];
    if (entry.length < 4) {
      continue;
    }
    const status = entry.slice(0, 2);
    if (status.includes('R') || status.includes('C')) {
      i += 1; // the next field is the source path
    }
    if (!status.includes('D')) {
      paths.push(entry.slice(3));
    }
  }
  return paths;
}

/** True for files that change how lint or typecheck behave, so the whole repo must be re-checked. */
export function isCheckConfig(file) {
  const base = path.posix.basename(file);
  return base === 'package.json' || base === 'eslint.config.js' || /^tsconfig.*\.json$/.test(base);
}

/** True for source files ESLint can lint. */
export function isLintable(file) {
  return LINTABLE.has(path.posix.extname(file));
}

/**
 * Decides what the Stop hook runs: `skip` (nothing relevant changed), `full` (a lint or type
 * config changed) or `changed` (typecheck plus ESLint on `files` only).
 */
export function planChecks(changed) {
  if (changed.some(isCheckConfig)) {
    return { kind: 'full', files: [] };
  }
  const files = changed.filter(isLintable);
  return files.length === 0 ? { kind: 'skip', files } : { kind: 'changed', files };
}

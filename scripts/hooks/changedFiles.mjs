/**
 * Pure helpers for the Stop hook: which files changed, and which checks they need.
 * Kept apart from `stop-check.mjs` so `changedFiles.test.mjs` can import them without running
 * the hook.
 */
import path from 'node:path';

const LINTABLE = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.jsx']);

/**
 * Parses `git status --porcelain -z` output into every path it names, deleted paths and the
 * source of a rename included: removing a source file can break its importers, so it still needs
 * the typecheck. A rename or copy lists the new path, then the source path.
 */
export function parsePorcelainZ(output) {
  const fields = output.split('\0');
  const paths = [];
  for (let i = 0; i < fields.length; i += 1) {
    const entry = fields[i];
    if (entry.length < 4) {
      continue;
    }
    paths.push(entry.slice(3));
    if (/[RC]/.test(entry.slice(0, 2))) {
      i += 1;
      paths.push(fields[i]);
    }
  }
  return paths;
}

/** True for files that change how lint or typecheck behave, so the whole repo must be re-checked. */
function isCheckConfig(file) {
  const base = path.posix.basename(file);
  return (
    base === 'package.json' ||
    base === 'package-lock.json' ||
    base === 'eslint.config.js' ||
    /^tsconfig.*\.json$/.test(base)
  );
}

/** True for source files ESLint can lint. */
export function isLintable(file) {
  return LINTABLE.has(path.posix.extname(file).toLowerCase());
}

/**
 * Decides what the Stop hook runs: `skip` (nothing relevant changed), `full` (a lint or type
 * config changed) or `changed` (typecheck plus ESLint on `files` only; `files` can name deleted
 * paths, which the caller drops before ESLint).
 */
export function planChecks(changed) {
  if (changed.some(isCheckConfig)) {
    return { kind: 'full', files: [] };
  }
  const files = changed.filter(isLintable);
  return files.length === 0 ? { kind: 'skip', files } : { kind: 'changed', files };
}

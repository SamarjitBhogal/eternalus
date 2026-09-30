#!/usr/bin/env node
/**
 * PostToolUse hook (Edit|Write): formats the touched file with Prettier and, for TypeScript,
 * lints it with ESLint (zero warnings). This is the fast, per-file feedback loop; the full
 * gate stays `npm run check` (hooks + CI).
 *
 * Exit 0 when clean, exit 2 when ESLint fails so the agent sees the findings and fixes them
 * (a PostToolUse hook cannot undo the edit; exit 2 only surfaces stderr to the agent).
 */
import path from 'node:path';

import { editedFile, isInside, readHookInput, repoRoot, run, tail } from './hookInput.mjs';

const FORMATTABLE = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.css',
  '.yml',
  '.yaml',
]);
const LINTABLE = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);

const input = await readHookInput();
const root = repoRoot(input);
const file = editedFile(input);

if (file === null || !isInside(root, file)) {
  process.exit(0);
}

const extension = path.extname(file).toLowerCase();
const relativePath = path.relative(root, path.resolve(root, file));

if (FORMATTABLE.has(extension)) {
  const prettier = run(
    'npx',
    ['--no-install', 'prettier', '--write', '--log-level', 'warn', relativePath],
    {
      cwd: root,
      timeoutMs: 60_000,
    },
  );
  if (prettier.status !== 0) {
    // Formatting problems are not worth blocking on; report and continue.
    process.stderr.write(
      `[post-edit] prettier could not format ${relativePath}:\n${tail(prettier.output, 20)}\n`,
    );
  }
}

if (LINTABLE.has(extension)) {
  const eslint = run('npx', ['--no-install', 'eslint', '--max-warnings', '0', relativePath], {
    cwd: root,
    timeoutMs: 90_000,
  });
  if (eslint.status !== 0) {
    process.stderr.write(
      `[post-edit] ESLint failed for ${relativePath}. Fix every finding (no eslint-disable without a named rule and a reason):\n${tail(eslint.output, 60)}\n`,
    );
    process.exit(2);
  }
}

process.stdout.write(
  `[post-edit] ${relativePath}: formatted${LINTABLE.has(extension) ? ' and lint-clean' : ''}.\n`,
);
process.exit(0);

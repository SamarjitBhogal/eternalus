#!/usr/bin/env node
/**
 * Stop hook: a deterministic gate before the agent ends its turn. When it fails, it exits 2 so
 * the agent keeps working and fixes the failure instead of declaring the task done.
 *
 * Scope (DEC-276): the hook checks only what this working tree changed, because a whole-repo
 * ESLint run takes about 290 s when many sessions run at once. Nothing lintable changed: skip.
 * A lint or type config changed: run the full `npm run check:quick`. Otherwise: the no-JS
 * check, `tsc -b`, and ESLint on the changed files. CI and the git hooks still run everything.
 *
 * A timeout is not a check failure. It still exits 2 (the gate is not weakened), but the
 * message says that the machine was too slow.
 *
 * Loop guard: Claude Code sets `stop_hook_active: true` when the stop was already blocked by
 * this hook; then we exit 0 so a genuinely unfixable failure cannot trap the agent forever
 * (the human sees the failure in the transcript and in CI).
 */
import { existsSync } from 'node:fs';
import path from 'node:path';

import { planChecks, parsePorcelainZ } from './changedFiles.mjs';
import { readHookInput, repoRoot, run, tail } from './hookInput.mjs';

const TIMEOUT_MS = 290_000;

const input = await readHookInput();

if (input.stop_hook_active === true) {
  process.exit(0);
}

const startedAt = Date.now();
// Porcelain paths are relative to the top level, and the session cwd can be a subfolder.
const topLevel = await run('git', ['rev-parse', '--show-toplevel'], {
  cwd: repoRoot(input),
  timeoutMs: 30_000,
});
const root = topLevel.status === 0 ? topLevel.output.trim() : repoRoot(input);
const status = await run('git', ['--no-optional-locks', 'status', '--porcelain', '-z', '-uall'], {
  cwd: root,
  timeoutMs: 30_000,
});
const plan =
  status.status === 0 ? planChecks(parsePorcelainZ(status.output)) : { kind: 'full', files: [] };

if (plan.kind === 'skip') {
  process.stdout.write('[stop-check] no source changes; skipped.\n');
  process.exit(0);
}

// Deleted files still trigger the typecheck (their importers may break), but ESLint skips them.
const lintFiles = plan.files.filter((file) => existsSync(path.join(root, file)));
const steps =
  plan.kind === 'full'
    ? [['npm', ['run', 'check:quick']]]
    : // The steps of the `check:quick` script in package.json, with ESLint narrowed to the changed
      // files: a new step there belongs here too.
      [
        ['npm', ['run', 'check:no-js']],
        ['npm', ['run', 'typecheck']],
        // ESLint with no file arguments would lint the whole repo.
        ...(lintFiles.length === 0
          ? []
          : [
              [
                'npx',
                [
                  '--no-install',
                  'eslint',
                  '--max-warnings',
                  '0',
                  '--no-warn-ignored',
                  '--',
                  ...lintFiles,
                ],
              ],
            ]),
      ];

for (const [command, args] of steps) {
  const remaining = TIMEOUT_MS - (Date.now() - startedAt);
  const result = await run(command, args, { cwd: root, timeoutMs: Math.max(remaining, 1_000) });
  if (result.timedOut) {
    process.stderr.write(
      `[stop-check] Timed out after ${Math.round(TIMEOUT_MS / 1000)} s (machine under load). This is not a check failure. Run \`npm run check:quick\` directly.\n${tail(result.output, 20)}\n`,
    );
    process.exit(2);
  }
  if (result.status !== 0) {
    process.stderr.write(
      `[stop-check] Checks failing: fix before stopping (AGENTS.md "Definition of done").\n${tail(result.output, 60)}\n`,
    );
    process.exit(2);
  }
}

process.stdout.write(
  `[stop-check] ${plan.kind === 'full' ? 'npm run check:quick' : `checks on ${plan.files.length} changed file(s)`} passed.\n`,
);
process.exit(0);

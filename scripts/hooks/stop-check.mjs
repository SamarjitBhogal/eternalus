#!/usr/bin/env node
/**
 * Stop hook: a deterministic gate before the agent ends its turn. Runs `npm run check:quick`
 * (typecheck + lint, the same command as the git hooks) and, when it fails, exits 2 so the
 * agent keeps working and fixes the failure instead of declaring the task done.
 *
 * Loop guard: Claude Code sets `stop_hook_active: true` when the stop was already blocked by
 * this hook; then we exit 0 so a genuinely unfixable failure cannot trap the agent forever
 * (the human sees the failure in the transcript and in CI).
 */
import { readHookInput, repoRoot, run, tail } from './hookInput.mjs';

const input = await readHookInput();

if (input.stop_hook_active === true) {
  process.exit(0);
}

const root = repoRoot(input);
const check = run('npm', ['run', 'check:quick'], { cwd: root, timeoutMs: 290_000 });

if (check.status !== 0) {
  process.stderr.write(
    `[stop-check] Checks failing: fix before stopping (AGENTS.md "Definition of done").\n${tail(check.output, 60)}\n`,
  );
  process.exit(2);
}

process.stdout.write('[stop-check] npm run check:quick passed.\n');
process.exit(0);

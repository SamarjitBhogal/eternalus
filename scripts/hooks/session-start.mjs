#!/usr/bin/env node
/**
 * SessionStart hook: orients the agent. Prints the current branch, warns when the branch is
 * `main` (never work there), and points at the three files every session must read first.
 * Always exits 0; its output is informational.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { readHookInput, repoRoot, run } from './hookInput.mjs';

const input = await readHookInput();
const root = repoRoot(input);

const branchResult = run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
  cwd: root,
  timeoutMs: 10_000,
});
const branch = branchResult.status === 0 ? branchResult.output.trim() : '(unknown)';

const lines = [`[session-start] branch: ${branch}`];

if (branch === 'main') {
  lines.push(
    '[session-start] WARNING: you are on `main`. Create a task branch off the current phase branch first:',
    '  git switch -c feat/<task> phase/<n>-<name>   (see docs/process/git-workflow.md)',
  );
}

lines.push(
  '[session-start] Read first: AGENTS.md -> the nearest package AGENTS.md -> the architecture doc whose `paths` frontmatter matches your files -> the current phase doc in docs/plan/.',
);

const inboxPath = path.join(root, 'INBOX.md');
if (existsSync(inboxPath)) {
  const inbox = readFileSync(inboxPath, 'utf8');
  const openItems = (inbox.match(/^- \[ \]/gm) ?? []).length;
  if (openItems > 0) {
    lines.push(`[session-start] INBOX.md has ${openItems} open item(s) from the product owner.`);
  }
}

const progressPath = path.join(root, 'docs', 'plan', 'PROGRESS.md');
if (existsSync(progressPath)) {
  const progress = readFileSync(progressPath, 'utf8').trimEnd().split(/\r?\n/);
  const lastHeading = [...progress].reverse().find((line) => line.startsWith('### '));
  if (lastHeading !== undefined) {
    lines.push(`[session-start] Last progress entry: ${lastHeading.replace(/^### /, '')}`);
  }
}

lines.push(
  '[session-start] Before stopping: `npm run check` must pass and docs/plan/PROGRESS.md gets an entry.',
);

process.stdout.write(`${lines.join('\n')}\n`);
process.exit(0);

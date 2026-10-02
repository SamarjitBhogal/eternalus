#!/usr/bin/env node
/**
 * Shared helpers for the agent hook scripts in this folder.
 *
 * Every hook (Claude Code, Codex, Gemini/Antigravity) sends a JSON object on stdin describing
 * the event. The scripts here only need a few fields, and they must never crash on missing or
 * malformed input: a broken hook would block the agent for the wrong reason.
 *
 * Exit-code contract (Claude Code and Codex): 0 = ok, 2 = block/show to the agent, anything
 * else = non-blocking error. See docs/agents/tool-setup.md.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

/** Reads all of stdin and parses it as JSON. Returns `{}` on empty or invalid input. */
export async function readHookInput() {
  if (process.stdin.isTTY) {
    return {};
  }
  const chunks = [];
  try {
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
  } catch {
    return {};
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (raw.length === 0) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/** The repository root: the hook's cwd (Claude Code runs hooks from the project directory). */
export function repoRoot(input) {
  const cwd = typeof input.cwd === 'string' && input.cwd.length > 0 ? input.cwd : process.cwd();
  return path.resolve(cwd);
}

/** The file a tool call touched, or `null` when the event carries no file path. */
export function editedFile(input) {
  const toolInput = input.tool_input;
  if (typeof toolInput !== 'object' || toolInput === null) {
    return null;
  }
  const filePath = toolInput.file_path ?? toolInput.path ?? toolInput.notebook_path;
  return typeof filePath === 'string' && filePath.length > 0 ? filePath : null;
}

/** True when `filePath` is inside `root` (prevents running tools on files outside the repo). */
export function isInside(root, filePath) {
  const relative = path.relative(root, path.resolve(root, filePath));
  return relative.length > 0 && !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * Runs an npm/npx command synchronously with a timeout and returns `{ status, output }`.
 * `shell: true` is required on Windows so that `npm.cmd`/`npx.cmd` shims resolve.
 */
export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? process.cwd(),
    encoding: 'utf8',
    shell: process.platform === 'win32',
    timeout: options.timeoutMs ?? 120_000,
    env: { ...process.env, CI: process.env.CI ?? '1', FORCE_COLOR: '0' },
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  return { status: result.status ?? 1, output };
}

/** Returns the last `lines` lines of `text` (keeps hook output short and readable). */
export function tail(text, lines = 40) {
  const all = text.split(/\r?\n/);
  return all.slice(Math.max(0, all.length - lines)).join('\n');
}

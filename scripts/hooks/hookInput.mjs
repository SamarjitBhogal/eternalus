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
import { spawn, spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { clearTimeout, setTimeout } from 'node:timers';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

/** The checkout that holds these scripts. */
const SCRIPTS_ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

/**
 * `[topLevel, commonDir]` of the git repository that holds `folder`, or `null` outside one.
 * Reads stdout only, so git messages on stderr (`GIT_TRACE`, warnings) cannot change the answer.
 */
function gitRepository(folder) {
  const result = spawnSync(
    'git',
    ['rev-parse', '--path-format=absolute', '--show-toplevel', '--git-common-dir'],
    { cwd: folder, encoding: 'utf8', timeout: 30_000, windowsHide: true },
  );
  const lines = (result.stdout ?? '').trim().split(/\r?\n/);
  return result.status === 0 && lines.length === 2 ? lines.map((line) => path.resolve(line)) : null;
}

/** The session's current folder: Claude Code runs a hook there. */
export function sessionFolder(input) {
  return typeof input.cwd === 'string' && input.cwd.length > 0 ? input.cwd : process.cwd();
}

/**
 * The checkout a hook acts on (DEC-331), found from `folder`: the session's folder or, for
 * `post-edit.mjs`, the edited file's folder. A folder in the same repository as `scriptsRoot`
 * (any worktree) gives its own top level, so a session in a worktree checks that worktree. Any
 * other folder gives `scriptsRoot`.
 */
export function projectRoot(folder, scriptsRoot = SCRIPTS_ROOT) {
  const start = gitRepository(path.resolve(folder));
  const scripts = gitRepository(scriptsRoot);
  // `path.relative` ignores case on Windows, where git can print a drive letter in either case.
  if (start !== null && scripts !== null && path.relative(start[1], scripts[1]) === '') {
    return start[0];
  }
  return scripts?.[0] ?? scriptsRoot;
}

/**
 * The real absolute path of the file a tool call touched, or `null` when the event carries no
 * file path or the file does not exist. A relative path is taken from the session's folder. The
 * native real path resolves symlinks and letter case like the top level that git prints.
 */
export function editedFile(input) {
  const toolInput = input.tool_input;
  if (typeof toolInput !== 'object' || toolInput === null) {
    return null;
  }
  const filePath = toolInput.file_path ?? toolInput.path ?? toolInput.notebook_path;
  if (typeof filePath !== 'string' || filePath.length === 0) {
    return null;
  }
  try {
    return realpathSync.native(path.resolve(sessionFolder(input), filePath));
  } catch {
    return null;
  }
}

/** True when `filePath` is inside `root` (prevents running tools on files outside the repo). */
export function isInside(root, filePath) {
  const relative = path.relative(root, path.resolve(root, filePath));
  return relative.length > 0 && !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * Runs a command with a timeout and resolves `{ status, output, timedOut }`. `timedOut` is true
 * when the timeout killed the command, so callers can tell "too slow" from "failed".
 *
 * A timeout kills the command's whole process tree, not only the direct child (DEC-276):
 * `npm run lint` runs ESLint as a grandchild, and a grandchild left running keeps the machine
 * loaded with nobody reading its output, which makes the next hook time out too.
 * `shell: true` is required on Windows so that `npm.cmd`/`npx.cmd` shims resolve.
 */
export function run(command, args, options = {}) {
  const isWindows = process.platform === 'win32';
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? process.cwd(),
      shell: isWindows,
      // Own process group (POSIX), so a timeout can kill the whole tree with one signal.
      detached: !isWindows,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      env: { ...process.env, CI: process.env.CI ?? '1', FORCE_COLOR: '0' },
    });
    let output = '';
    const collect = (chunk) => {
      output += chunk;
    };
    child.stdout.setEncoding('utf8').on('data', collect);
    child.stderr.setEncoding('utf8').on('data', collect);
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      killTree(child.pid);
    }, options.timeoutMs ?? 120_000);
    liveChildren.add(child.pid);
    const finish = (status) => {
      clearTimeout(timer);
      liveChildren.delete(child.pid);
      resolve({ status, output, timedOut });
    };
    child.once('error', (error) => {
      output += String(error);
      finish(1);
    });
    child.once('close', (code) => finish(code ?? 1));
  });
}

/**
 * Process trees that `run()` started and that still run. The child has its own process group, so
 * a signal that ends the hook does not reach it: kill the trees before the hook exits.
 */
const liveChildren = new Set();
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.once(signal, () => {
    for (const pid of liveChildren) {
      killTree(pid);
    }
    process.exit(1);
  });
}

/** Kills a process and every process it started. No-op when the tree already exited. */
function killTree(pid) {
  try {
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { windowsHide: true });
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch {
    // The tree already exited.
  }
}

/** Returns the last `lines` lines of `text` (keeps hook output short and readable). */
export function tail(text, lines = 40) {
  const all = text.split(/\r?\n/);
  return all.slice(Math.max(0, all.length - lines)).join('\n');
}

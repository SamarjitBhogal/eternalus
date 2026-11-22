/**
 * Checks the hooks' command runner and project-root lookup (zero dependencies).
 *
 *   node --test scripts/hooks/hookInput.test.mjs
 */
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { editedFile, projectRoot, run } from './hookInput.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const checkout = path.resolve(here, '../..');

/** Runs git in `cwd` and fails the test when it fails. */
const git = (cwd, ...args) => {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
};

const isAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

test('run returns the exit status and the output of a command that finishes', async () => {
  const result = await run('node', ['-e', 'process.stdout.write("ok");process.exit(3)'], {
    cwd: here,
  });
  assert.deepEqual(result, { status: 3, output: 'ok', timedOut: false });
});

test('a timeout kills the grandchildren too, so no orphan keeps running', async () => {
  const result = await run('node', ['fixtures/spawnsGrandchild.mjs'], {
    cwd: here,
    timeoutMs: 5_000,
  });
  const grandchild = Number(result.output.trim());
  assert.equal(result.timedOut, true);
  assert.ok(grandchild > 0, `fixture printed no pid: ${result.output}`);
  await delay(500);
  assert.equal(isAlive(grandchild), false, `grandchild ${grandchild} still runs`);
});

test(
  'a signal to the hook kills the trees that run() started',
  { skip: process.platform === 'win32' && 'Windows cannot catch SIGTERM' },
  async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'hook-signal-'));
    const pidFile = path.join(dir, 'grandchild.pid');
    const script = `import { run } from './hookInput.mjs';
      await run(process.execPath, ['fixtures/spawnsGrandchild.mjs', ${JSON.stringify(pidFile)}]);`;
    const hook = spawn(process.execPath, ['--input-type=module', '-e', script], {
      cwd: here,
      stdio: 'ignore',
    });
    // The fixture's pid is its process group (`run()` starts it detached); the grandchild is in it.
    let group = 0;
    let grandchild = 0;
    try {
      for (let i = 0; i < 50 && grandchild === 0; i += 1) {
        await delay(100);
        if (existsSync(pidFile)) {
          [group = 0, grandchild = 0] = readFileSync(pidFile, 'utf8').split(' ').map(Number);
        }
      }
      assert.ok(grandchild > 0, 'the fixture wrote no pid');
      const exited = once(hook, 'exit');
      hook.kill('SIGTERM');
      await exited;
      await delay(500);
      assert.equal(isAlive(grandchild), false, `grandchild ${grandchild} still runs`);
    } finally {
      // A red run must not leave the tree running for 60 s.
      if (hook.exitCode === null && hook.signalCode === null) {
        hook.kill('SIGKILL');
      }
      if (group > 0) {
        try {
          process.kill(-group, 'SIGKILL');
        } catch {
          // The group is already gone: the test passed.
        }
      }
      rmSync(dir, { recursive: true, force: true });
    }
  },
);

test('a session in a subfolder of this checkout acts on its top level', () => {
  assert.equal(projectRoot(path.join(checkout, 'docs')), checkout);
});

test('a session outside any git repository acts on the checkout that holds the scripts', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'hook-root-'));
  try {
    assert.equal(projectRoot(dir), checkout);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a session in another git repository acts on the checkout that holds the scripts', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'hook-root-'));
  try {
    git(dir, 'init', '-q');
    assert.equal(projectRoot(dir), checkout);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a session in another worktree of the same repository acts on that worktree', () => {
  // realpath: on macOS the temp folder is reached through the /var -> /private/var link.
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), 'hook-root-')));
  const main = path.join(dir, 'main');
  const worktree = path.join(dir, 'worktree');
  try {
    mkdirSync(path.join(main, 'sub'), { recursive: true });
    git(main, 'init', '-q');
    git(
      main,
      ...'-c user.name=t -c user.email=t@t -c commit.gpgsign=false commit -q --allow-empty -m i'.split(
        ' ',
      ),
    );
    git(main, 'worktree', 'add', '-q', '--detach', worktree);
    // GIT_TRACE writes to stderr; it must not change the answer.
    process.env.GIT_TRACE = '1';
    assert.equal(projectRoot(worktree, main), worktree);
    assert.equal(projectRoot(path.join(main, 'sub'), worktree), main);
  } finally {
    delete process.env.GIT_TRACE;
    rmSync(dir, { recursive: true, force: true });
  }
});

test('editedFile gives the real path, also through a symlink, and null for a missing file', () => {
  const dir = realpathSync(mkdtempSync(path.join(tmpdir(), 'hook-file-')));
  try {
    mkdirSync(path.join(dir, 'real'));
    writeFileSync(path.join(dir, 'real', 'a.ts'), '');
    symlinkSync(path.join(dir, 'real'), path.join(dir, 'link'), 'junction');
    const edit = (file) => editedFile({ tool_input: { file_path: file }, cwd: dir });
    assert.equal(edit(path.join(dir, 'link', 'a.ts')), path.join(dir, 'real', 'a.ts'));
    assert.equal(edit('link/a.ts'), path.join(dir, 'real', 'a.ts'));
    assert.equal(edit(path.join(dir, 'missing.ts')), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

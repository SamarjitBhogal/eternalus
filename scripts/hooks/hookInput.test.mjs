/**
 * Checks the hooks' command runner and project-root lookup (zero dependencies).
 *
 *   node --test scripts/hooks/hookInput.test.mjs
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { projectRoot, run } from './hookInput.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const checkout = path.resolve(here, '../..');

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

test('a session in a subfolder of this checkout acts on its top level', async () => {
  assert.equal(await projectRoot({ cwd: path.join(checkout, 'docs') }), checkout);
});

test('a session outside any git repository acts on the checkout that holds the scripts', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'hook-root-'));
  try {
    assert.equal(await projectRoot({ cwd: dir }), checkout);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('a session in another git repository acts on the checkout that holds the scripts', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'hook-root-'));
  try {
    assert.equal((await run('git', ['init', '-q'], { cwd: dir })).status, 0);
    assert.equal(await projectRoot({ cwd: dir }), checkout);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

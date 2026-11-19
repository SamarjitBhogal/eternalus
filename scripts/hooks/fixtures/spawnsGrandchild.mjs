/**
 * Test fixture for `hookInput.test.mjs`. Starts a grandchild that outlives this process unless
 * the whole process tree is killed (as `npm run lint` does with ESLint), prints the grandchild's
 * pid, then waits.
 */
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { setTimeout } from 'node:timers';

const grandchild = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)'], {
  stdio: 'ignore',
});
process.stdout.write(`${grandchild.pid}\n`);
// The signal test reads the pids from a file: `run()` returns the output only when the run ends.
// This process's pid is also its process group (`run()` starts it detached), so the test can
// kill the whole tree when it fails.
if (process.argv[2]) {
  writeFileSync(process.argv[2], `${process.pid} ${grandchild.pid}`);
}
setTimeout(() => {}, 60_000);

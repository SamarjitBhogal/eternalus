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
// The signal test reads the pid from a file: `run()` returns the output only when the run ends.
if (process.argv[2]) {
  writeFileSync(process.argv[2], String(grandchild.pid));
}
setTimeout(() => {}, 60_000);

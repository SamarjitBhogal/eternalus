/**
 * Checks that every hook in `.claude/settings.json` names its script from the project root
 * (DEC-331). Claude Code runs a hook in the session's current folder, so a relative path breaks
 * as soon as a session changes to a subfolder.
 *
 *   node --test scripts/hooks/settings.test.mjs
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const PROJECT_DIR = '${CLAUDE_PROJECT_DIR}';
const root = fileURLToPath(new URL('../..', import.meta.url));
const settings = JSON.parse(readFileSync(path.join(root, '.claude/settings.json'), 'utf8'));
const hooks = Object.values(settings.hooks)
  .flat()
  .flatMap((entry) => entry.hooks);

test('every hook script path starts at the project root and names a file that exists', () => {
  assert.ok(hooks.length > 0, 'settings.json has no hooks');
  for (const hook of hooks) {
    assert.equal(hook.type, 'command', `${JSON.stringify(hook)} must be a command hook`);
    assert.ok(Array.isArray(hook.args), `${JSON.stringify(hook)} must use the exec form (args)`);
    const [script] = hook.args;
    assert.ok(script.startsWith(`${PROJECT_DIR}/`), `${script} must start with ${PROJECT_DIR}/`);
    assert.ok(
      existsSync(path.join(root, script.slice(PROJECT_DIR.length))),
      `${script} is missing`,
    );
  }
});

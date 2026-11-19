/**
 * Checks the Stop hook's change detection and check planning (zero dependencies).
 *
 *   node --test scripts/hooks/changedFiles.test.mjs
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parsePorcelainZ, planChecks } from './changedFiles.mjs';

const z = (...entries) => `${entries.join('\0')}\0`;

test('parsePorcelainZ keeps every path, deleted ones and rename sources included', () => {
  const out = z(
    ' M a/b.ts',
    '?? c d.tsx',
    ' D gone.ts',
    'D  staged-gone.ts',
    'R  new.ts',
    'old.ts',
  );
  assert.deepEqual(parsePorcelainZ(out), [
    'a/b.ts',
    'c d.tsx',
    'gone.ts',
    'staged-gone.ts',
    'new.ts',
    'old.ts',
  ]);
});

test('deleting a source file still runs the typecheck', () => {
  assert.equal(planChecks(parsePorcelainZ(z(' D packages/core/src/a.ts'))).kind, 'changed');
});

test('planChecks skips when only docs or assets changed', () => {
  assert.deepEqual(planChecks(['docs/a.md', 'x.png']), { kind: 'skip', files: [] });
  assert.deepEqual(planChecks([]), { kind: 'skip', files: [] });
});

test('planChecks lints only the changed source files', () => {
  assert.deepEqual(planChecks(['docs/a.md', 'a.ts', 'b/c.mjs']), {
    kind: 'changed',
    files: ['a.ts', 'b/c.mjs'],
  });
});

test('planChecks runs the full check when a lint or type config changed', () => {
  for (const file of [
    'package.json',
    'packages/core/package.json',
    'tsconfig.base.json',
    'apps/client/tsconfig.json',
    'eslint.config.js',
    'package-lock.json',
  ]) {
    assert.equal(planChecks(['a.ts', file]).kind, 'full', file);
  }
});

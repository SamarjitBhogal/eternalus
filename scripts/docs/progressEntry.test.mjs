/**
 * Checks the progress entry file-name rule (DEC-277) that the docs check and the session-start
 * hook share (zero dependencies).
 *
 *   node --test scripts/docs/progressEntry.test.mjs
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PROGRESS_ENTRY_NAME } from './progressEntry.mjs';

test('an entry name with the date, a 4-digit time and the branch slug matches', () => {
  for (const name of [
    '2026-11-19-0107-chore-progress-entry-files.md',
    '2026-11-19-1430-feat-core-seeded-random.md',
    '2026-01-02-0000-main.md',
  ]) {
    assert.ok(PROGRESS_ENTRY_NAME.test(name), name);
  }
});

test('the README, a template and malformed names do not match', () => {
  for (const name of [
    'README.md',
    'template.md',
    '2026-11-19-107-chore-progress-entry-files.md',
    '2026-11-19-0107.md',
    '2026-11-19-0107-chore-progress-entry-files.txt',
    'x2026-11-19-0107-chore-progress-entry-files.md',
  ]) {
    assert.ok(!PROGRESS_ENTRY_NAME.test(name), name);
  }
});

/**
 * Checks the learnings parser against CodeRabbit's reply format (zero dependencies).
 *
 *   node --test scripts/coderabbit/collect-learnings.test.mjs
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseLearnings, renderDoc } from './collect-learnings.mjs';

const URL = 'https://github.com/o/r/pull/48#discussion_r1';
const block = (timestamp, learning) => `\`\`\`
Learnt from: SamarjitBhogal
Repo: SamarjitBhogal/eternalus PR: 48
File: .coderabbit.yaml:9-9
Timestamp: ${timestamp}
Learning: ${learning}
\`\`\``;
const reply = (...blocks) => ({
  html_url: URL,
  body: `Thanks.\n<details>\n<summary>✏️ Learnings added</summary>\n<dl>\n<dd>\n\n${blocks.join('\n\n')}\n\n</dd>\n</dl>\n</details>\n\n<details>\n<summary>🧠 Learnings used</summary>\n\n${block('2026-01-01T00:00:00Z', 'an old learning, not new')}\n</details>`,
});

test('reads every learning in the "Learnings added" block and nothing from "Learnings used"', () => {
  const learnings = parseLearnings(
    reply(block('2026-10-28T05:10:26Z', 'Rule one.'), block('2026-10-28T05:11:00Z', 'Rule two.')),
  );
  assert.deepEqual(learnings, [
    {
      author: 'SamarjitBhogal',
      pr: '48',
      file: '.coderabbit.yaml:9-9',
      timestamp: '2026-10-28T05:10:26Z',
      text: 'Rule one.',
      url: URL,
    },
    {
      author: 'SamarjitBhogal',
      pr: '48',
      file: '.coderabbit.yaml:9-9',
      timestamp: '2026-10-28T05:11:00Z',
      text: 'Rule two.',
      url: URL,
    },
  ]);
});

test('ignores a reply without learnings', () => {
  assert.deepEqual(parseLearnings({ html_url: URL, body: 'LGTM' }), []);
});

test('fails loudly when the block is there but its format changed', () => {
  const changed = { html_url: URL, body: '<summary>Learnings added</summary>\nRule: no fence' };
  assert.throws(() => parseLearnings(changed), /cannot read/);
});

test('fails loudly when one block of several has no learning text', () => {
  const broken = '```\nLearnt from: SamarjitBhogal\nTimestamp: 2026-10-28T05:12:00Z\n```';
  assert.throws(
    () => parseLearnings(reply(block('2026-10-28T05:10:26Z', 'Rule one.'), broken)),
    /cannot read/,
  );
});

test('reads a reply with Windows line endings', () => {
  const { html_url, body } = reply(block('2026-10-28T05:10:26Z', 'Rule one.'));
  const learnings = parseLearnings({ html_url, body: body.replace(/\n/g, '\r\n') });
  assert.deepEqual(
    learnings.map((learning) => learning.text),
    ['Rule one.'],
  );
});

test('says so when there are no learnings', () => {
  assert.match(renderDoc([]), /No learnings yet\.\n$/);
});

test('lists learnings oldest first', () => {
  const doc = renderDoc([
    ...parseLearnings(reply(block('2026-10-30T00:00:00Z', 'Newer.'))),
    ...parseLearnings(reply(block('2026-10-28T00:00:00Z', 'Older.'))),
  ]);
  assert.ok(doc.indexOf('Older.') < doc.indexOf('Newer.'));
  assert.match(doc, /^last-reviewed: 2026-10-30$/m);
});

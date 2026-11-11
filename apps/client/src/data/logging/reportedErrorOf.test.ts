import { describe, expect, it } from 'vitest';

import { reportedErrorOf } from './reportedErrorOf';

describe('reportedErrorOf', () => {
  it('takes the message and the stack of an Error, under the source', () => {
    const error = new Error('boom');

    expect(reportedErrorOf(error, 'game-loop')).toEqual({
      message: 'boom',
      stack: error.stack,
      source: 'game-loop',
    });
  });

  it('gives a null stack for an Error that has none', () => {
    const error = new Error('no stack');
    delete error.stack;

    expect(reportedErrorOf(error, 'client.window')).toEqual({
      message: 'no stack',
      stack: null,
      source: 'client.window',
    });
  });

  it('turns a thrown non-Error into its text with no stack', () => {
    expect(reportedErrorOf('plain text', 'a')).toEqual({
      message: 'plain text',
      stack: null,
      source: 'a',
    });
    expect(reportedErrorOf(42, 'a').message).toBe('42');
  });
});

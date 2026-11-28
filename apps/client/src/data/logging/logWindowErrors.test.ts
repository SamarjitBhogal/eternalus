import { MemoryLogger } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import { logWindowErrors } from './logWindowErrors';

/** An event of `type` with the fields an `ErrorEvent` or a `PromiseRejectionEvent` carries. */
const pageEvent = (type: string, fields: Readonly<Record<string, unknown>>): Event =>
  Object.assign(new Event(type), fields);

function setUp() {
  const window = new EventTarget();
  const logger = new MemoryLogger();
  const stop = logWindowErrors(window, logger);
  const logged = (): unknown[] =>
    logger.records.map(({ severityText, scope, body, attributes }) => [
      severityText,
      scope,
      body,
      attributes,
    ]);
  return { window, logger, stop, logged };
}

describe('logWindowErrors', () => {
  it('logs ERROR client.window for an uncaught error, with its message and stack', () => {
    const { window, logged } = setUp();
    const error = new Error('boom');

    window.dispatchEvent(pageEvent('error', { error, message: 'Uncaught Error: boom' }));

    expect(logged()).toEqual([
      ['ERROR', 'client.window', 'Uncaught error: boom', { stack: error.stack ?? null }],
    ]);
  });

  it("uses the event's message when the error is not an Error (another origin's script)", () => {
    const { window, logged } = setUp();

    window.dispatchEvent(pageEvent('error', { error: null, message: 'Script error.' }));

    expect(logged()).toEqual([
      ['ERROR', 'client.window', 'Uncaught error: Script error.', { stack: null }],
    ]);
  });

  it('logs ERROR client.window for an unhandled rejection, an Error or any other reason', () => {
    const { window, logged } = setUp();
    const error = new TypeError('Failed to fetch');

    window.dispatchEvent(pageEvent('unhandledrejection', { reason: error }));
    window.dispatchEvent(pageEvent('unhandledrejection', { reason: 'timeout' }));

    expect(logged()).toEqual([
      [
        'ERROR',
        'client.window',
        'Unhandled rejection: Failed to fetch',
        { stack: error.stack ?? null },
      ],
      ['ERROR', 'client.window', 'Unhandled rejection: timeout', { stack: null }],
    ]);
  });

  it('removes both listeners when stopped', () => {
    const { window, logger, stop } = setUp();

    stop();
    window.dispatchEvent(pageEvent('error', { error: new Error('late') }));
    window.dispatchEvent(pageEvent('unhandledrejection', { reason: new Error('late') }));

    expect(logger.records).toEqual([]);
  });
});

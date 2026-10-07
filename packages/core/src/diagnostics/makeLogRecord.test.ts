import { describe, expect, it } from 'vitest';

import { makeLogRecord } from './makeLogRecord';

describe('makeLogRecord', () => {
  it('maps the level to its OpenTelemetry severity number', () => {
    expect(makeLogRecord('TRACE', 'core.test', 'x').severityNumber).toBe(1);
    expect(makeLogRecord('INFO', 'core.test', 'x').severityNumber).toBe(9);
    expect(makeLogRecord('FATAL', 'core.test', 'x').severityNumber).toBe(21);
  });

  it('builds a record from a diagnostic event: its name and its attributes', () => {
    expect(
      makeLogRecord('WARN', 'core.commands', 'Rejected move', {
        tick: 12,
        event: {
          name: 'command-rejected',
          attributes: { commandType: 'move', reason: 'not-supported' },
        },
      }),
    ).toEqual({
      severityNumber: 13,
      severityText: 'WARN',
      body: 'Rejected move',
      scope: 'core.commands',
      eventName: 'command-rejected',
      tick: 12,
      attributes: { commandType: 'move', reason: 'not-supported' },
    });
  });

  it('defaults to no tick, no event name and no attributes', () => {
    const record = makeLogRecord('DEBUG', 'core.test', 'hello');
    expect(record).toEqual({
      severityNumber: 5,
      severityText: 'DEBUG',
      body: 'hello',
      scope: 'core.test',
      tick: null,
      attributes: {},
    });
    expect('eventName' in record).toBe(false);
  });

  it('keeps free attributes for records that report no diagnostic event', () => {
    const record = makeLogRecord('INFO', 'core.test', 'started', { attributes: { seed: 7 } });
    expect(record.attributes).toEqual({ seed: 7 });
    expect(record.eventName).toBeUndefined();
  });

  it('refuses unknown diagnostic events and mixed attributes at compile time', () => {
    const event = {
      name: 'invariant-violated',
      attributes: { invariantId: 'finite-transforms', entityId: null, seed: 1, tick: 3 },
    } as const;
    // @ts-expect-error -- 'unit-exploded' is not in DiagnosticEventMap.
    makeLogRecord('ERROR', 'core.test', 'x', { event: { name: 'unit-exploded', attributes: {} } });
    // @ts-expect-error -- an event brings its own attributes; both at once is ambiguous.
    makeLogRecord('ERROR', 'core.test', 'x', { event, attributes: { extra: 1 } });
    expect(makeLogRecord('ERROR', 'core.test', 'x', { event }).eventName).toBe(
      'invariant-violated',
    );
  });
});

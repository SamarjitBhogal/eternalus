import { describe, expect, it } from 'vitest';

import { makeLogRecord } from './makeLogRecord';

describe('makeLogRecord', () => {
  it('maps the level to its OpenTelemetry severity number', () => {
    expect(makeLogRecord('TRACE', 'core.test', 'x').severityNumber).toBe(1);
    expect(makeLogRecord('INFO', 'core.test', 'x').severityNumber).toBe(9);
    expect(makeLogRecord('FATAL', 'core.test', 'x').severityNumber).toBe(21);
  });

  it('builds a full record with tick, event name and attributes', () => {
    expect(
      makeLogRecord('WARN', 'core.commands', 'Rejected move', {
        tick: 12,
        eventName: 'command-rejected',
        attributes: { commandType: 'move', reason: 'not-supported' },
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
});

import { type LogRecord, makeLogRecord } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { LogSink } from './LogSink.types';
import { SinkLogger } from './SinkLogger';

class CollectingSink implements LogSink {
  public readonly records: LogRecord[] = [];

  public write(record: LogRecord): void {
    this.records.push(record);
  }
}

describe('SinkLogger', () => {
  it('routes records by severity: each sink gets what passes its minimum', () => {
    const everything = new CollectingSink();
    const problems = new CollectingSink();
    const logger = new SinkLogger(
      () => 0,
      [
        { sink: everything, minSeverity: 1 },
        { sink: problems, minSeverity: 13 },
      ],
    );

    logger.log(makeLogRecord('INFO', 'core.commands', 'rejected stop'));
    logger.log(makeLogRecord('WARN', 'core.invariants', 'odd'));
    logger.log(makeLogRecord('ERROR', 'core.invariants', 'broken'));

    expect(everything.records.map((record) => record.body)).toEqual([
      'rejected stop',
      'odd',
      'broken',
    ]);
    expect(problems.records.map((record) => record.body)).toEqual(['odd', 'broken']);
  });

  it('sends a scoped sink only the scopes it asked for', () => {
    const invariants = new CollectingSink();
    const logger = new SinkLogger(
      () => 0,
      [{ sink: invariants, minSeverity: 1, scopes: ['core.invariants'] }],
    );

    logger.log(makeLogRecord('ERROR', 'core.commands', 'not this'));
    logger.log(makeLogRecord('ERROR', 'core.invariants', 'this'));

    expect(invariants.records.map((record) => record.body)).toEqual(['this']);
  });

  it('stamps each record with the clock time and leaves the original alone', () => {
    const sink = new CollectingSink();
    let now = 1000;
    const logger = new SinkLogger(() => now, [{ sink, minSeverity: 1 }]);
    const record = makeLogRecord('INFO', 'client.match', 'started');

    logger.log(record);
    now = 2500;
    logger.log(record);

    expect(sink.records.map((logged) => logged.timestampMs)).toEqual([1000, 2500]);
    expect(record).not.toHaveProperty('timestampMs');
  });
});

import { type LogRecord, makeLogRecord } from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import { fakeMatchEvidence } from './__fixtures__/errorReports';
import { ENVIRONMENT, NOW, records, setUp } from './__fixtures__/errorReporterSetUp';
import { LOG_TAIL_RECORDS, MAX_SILENT_REPORTS } from './ErrorReporter.constants';

describe('ErrorReporter: the silent path (ADR 0025 §6)', () => {
  it.each<[string, LogRecord]>([
    ['ERROR in any scope', makeLogRecord('ERROR', 'client.persistence', 'storage did not open')],
    ['FATAL in a scope other than client.session', makeLogRecord('FATAL', 'client.match', 'x')],
    ['core.invariants at ERROR', makeLogRecord('ERROR', 'core.invariants', 'Invariant broken')],
    ['core.invariants at FATAL', makeLogRecord('FATAL', 'core.invariants', 'Invariant broken')],
    ['ERROR client.window', makeLogRecord('ERROR', 'client.window', 'Uncaught error: boom')],
    [
      'WARN client.resources asset failed',
      makeLogRecord('WARN', 'client.resources', 'asset failed'),
    ],
    [
      'WARN client.resources asset rendition failed',
      makeLogRecord('WARN', 'client.resources', 'asset rendition failed'),
    ],
    [
      'WARN client.persistence record quarantined',
      makeLogRecord('WARN', 'client.persistence', 'record quarantined'),
    ],
    [
      'WARN client.settings settings could not be loaded',
      makeLogRecord('WARN', 'client.settings', 'settings could not be loaded; using defaults'),
    ],
  ])('reports %s', async (_name, record) => {
    const { reporter, writer } = setUp();

    const outcome = await reporter.reportRecord(record);

    expect(outcome).toEqual({ status: 'saved', id: 'memory-1', file: 'memory/memory-1.json' });
    expect(writer.saved).toHaveLength(1);
    expect(writer.saved[0]).toMatchObject({
      kind: 'error',
      record,
      error: { message: record.body, stack: null, source: record.scope },
    });
  });

  it.each<[string, LogRecord]>([
    [
      'FATAL client.session (the crash path reports it)',
      makeLogRecord('FATAL', 'client.session', 'The match stopped because of an error.'),
    ],
    ['INFO core.commands', makeLogRecord('INFO', 'core.commands', 'Rejected stop: no-entity')],
    ['WARN client.views', makeLogRecord('WARN', 'client.views', 'No view for kind "x".')],
    ['WARN client.resources, another body', makeLogRecord('WARN', 'client.resources', 'slow')],
    ['WARN client.persistence, another body', makeLogRecord('WARN', 'client.persistence', 'odd')],
    ['WARN client.settings, another body', makeLogRecord('WARN', 'client.settings', 'odd')],
    [
      'INFO client.resources asset failed',
      makeLogRecord('INFO', 'client.resources', 'asset failed'),
    ],
    ['ERROR client.reports (its own scope)', makeLogRecord('ERROR', 'client.reports', 'loop?')],
    ['FATAL client.reports (its own scope)', makeLogRecord('FATAL', 'client.reports', 'loop?')],
  ])('does not report %s', async (_name, record) => {
    const { reporter, writer } = setUp();

    expect(await reporter.reportRecord(record)).toBeNull();
    expect(writer.saved).toEqual([]);
  });

  it('reports one record per scope, event name and body', async () => {
    const { reporter, writer } = setUp();
    const failed = (tick: number, entityId: string): LogRecord =>
      makeLogRecord('ERROR', 'core.invariants', 'Invariant broken', {
        tick,
        attributes: { entityId },
      });

    await reporter.reportRecord(failed(1, 'e1'));
    expect(await reporter.reportRecord(failed(2, 'e2'))).toBeNull();
    await reporter.reportRecord(makeLogRecord('ERROR', 'core.invariants', 'Other invariant'));
    await reporter.reportRecord(makeLogRecord('ERROR', 'core.physics', 'Invariant broken'));
    await reporter.reportRecord(
      makeLogRecord('ERROR', 'core.invariants', 'Invariant broken', {
        event: {
          name: 'invariant-violated',
          attributes: { invariantId: 'hp-in-range', entityId: null, seed: 1, tick: 3 },
        },
      }),
    );

    expect(
      writer.saved.map(({ record }) => [record?.scope, record?.eventName, record?.body]),
    ).toEqual([
      ['core.invariants', undefined, 'Invariant broken'],
      ['core.invariants', undefined, 'Other invariant'],
      ['core.physics', undefined, 'Invariant broken'],
      ['core.invariants', 'invariant-violated', 'Invariant broken'],
    ]);
  });

  it('makes at most 20 silent reports per page load', async () => {
    const { reporter, writer } = setUp();

    for (let index = 0; index < MAX_SILENT_REPORTS + 5; index += 1) {
      await reporter.reportRecord(makeLogRecord('ERROR', 'client.test', `error ${String(index)}`));
    }

    expect(MAX_SILENT_REPORTS).toBe(20);
    expect(writer.saved).toHaveLength(MAX_SILENT_REPORTS);
    expect(writer.saved.at(-1)?.error.message).toBe('error 19');
  });

  it('reports a record it receives as a sink', async () => {
    const { reporter, writer } = setUp();

    reporter.write(makeLogRecord('ERROR', 'client.test', 'sink path'));
    for (let round = 0; round < 10; round += 1) await Promise.resolve();

    expect(writer.saved.map(({ error }) => error.message)).toEqual(['sink path']);
  });

  it('takes the stack from the record, the page log tail outside a match, the time and the environment', async () => {
    const { reporter, writer, pageLog } = setUp();
    const record = makeLogRecord('ERROR', 'client.window', 'Uncaught error: boom', {
      attributes: { stack: 'Error: boom\n  at click' },
    });

    await reporter.reportRecord(record);

    expect(writer.saved[0]).toEqual({
      schemaVersion: 1,
      kind: 'error',
      createdAtMs: NOW,
      error: {
        message: 'Uncaught error: boom',
        stack: 'Error: boom\n  at click',
        source: 'client.window',
      },
      record,
      match: null,
      logTail: pageLog.slice(-LOG_TAIL_RECORDS),
      environment: ENVIRONMENT,
      note: null,
    });
    expect(LOG_TAIL_RECORDS).toBe(64);
  });

  it("takes the match and the match's last 64 records while a match runs", async () => {
    const { reporter, writer, setEvidence } = setUp();
    const evidence = { ...fakeMatchEvidence(), logTail: records(70, 'client.match') };
    setEvidence(() => evidence);

    await reporter.reportRecord(makeLogRecord('ERROR', 'client.test', 'during a match'));

    expect(writer.saved[0]?.match).toBe(evidence.match);
    expect(writer.saved[0]?.logTail).toEqual(evidence.logTail.slice(-LOG_TAIL_RECORDS));
  });

  it('reports without the match when the match cannot give its evidence', async () => {
    const { reporter, writer, setEvidence } = setUp();
    setEvidence(() => {
      throw new Error('half a tick');
    });

    const outcome = await reporter.reportRecord(makeLogRecord('ERROR', 'client.test', 'x'));

    expect(outcome?.status).toBe('saved');
    expect(writer.saved[0]?.match).toBeNull();
  });

  it('sends a report it cannot save to the fallback as WARN client.reports, with its full text', async () => {
    const { reporter, writer, warnings } = setUp();
    vi.spyOn(writer, 'save').mockRejectedValue(new Error('offline'));
    const record = makeLogRecord('ERROR', 'client.test', 'not saved');

    const outcome = await reporter.reportRecord(record);

    expect(outcome?.status).toBe('copy');
    const text = outcome?.status === 'copy' ? outcome.text : '';
    expect(JSON.parse(text)).toMatchObject({ kind: 'error', record });
    expect(
      warnings.map(({ severityText, scope, attributes }) => [severityText, scope, attributes]),
    ).toEqual([['WARN', 'client.reports', { text }]]);
    expect(await reporter.reportRecord(warnings[0] ?? record)).toBeNull();
  });

  it('never rejects, even when the writer throws instead of rejecting', async () => {
    const { reporter, writer } = setUp();
    vi.spyOn(writer, 'save').mockImplementation(() => {
      throw new Error('broken adapter');
    });

    const outcome = await reporter.reportRecord(makeLogRecord('ERROR', 'client.test', 'x'));

    expect(outcome?.status).toBe('copy');
  });
});

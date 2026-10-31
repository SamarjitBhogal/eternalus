import { type LogRecord, makeLogRecord } from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import { fakeMatchEvidence } from './__fixtures__/errorReports';
import type { MatchEvidence, ReportEnvironment } from './ErrorReport.types';
import { ErrorReporter } from './ErrorReporter';
import { LOG_TAIL_RECORDS, MAX_SILENT_REPORTS } from './ErrorReporter.constants';
import { MemoryReportWriter } from './MemoryReportWriter';

const ENVIRONMENT: ReportEnvironment = {
  gameVersion: '0.0.0',
  commit: 'abc1234',
  contentVersion: null,
  userAgent: 'test-agent',
};
const NOW = 1_234;
const CRASH = {
  message: 'step failed',
  stack: 'Error: step failed\n  at step',
  source: 'game-loop',
};

const records = (count: number, scope = 'client.page'): LogRecord[] =>
  Array.from({ length: count }, (_, index) =>
    makeLogRecord('INFO', scope, `line ${String(index)}`),
  );

/** A reporter over a `MemoryReportWriter`, a page log of 70 records and no match. */
function setUp() {
  const writer = new MemoryReportWriter();
  const warnings: LogRecord[] = [];
  const pageLog = records(70);
  let evidence: () => MatchEvidence | null = () => null;
  const reporter = new ErrorReporter({
    writer,
    now: () => NOW,
    environment: ENVIRONMENT,
    pageLogTail: (count) => pageLog.slice(-count),
    matchEvidence: () => evidence(),
    fallback: { write: (record) => warnings.push(record) },
  });
  const setEvidence = (source: () => MatchEvidence | null): void => {
    evidence = source;
  };
  return { writer, warnings, pageLog, reporter, setEvidence };
}

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

describe('ErrorReporter: the crash path (ADR 0025 §3)', () => {
  it("reports a crash once, with the match's evidence, and not again through its FATAL record", async () => {
    const { reporter, writer, setEvidence } = setUp();
    const evidence = fakeMatchEvidence(42);
    setEvidence(() => evidence);

    const outcome = await reporter.reportCrash(CRASH);
    await reporter.reportRecord(
      makeLogRecord('FATAL', 'client.session', 'The match stopped because of an error.'),
    );

    expect(outcome).toEqual({ status: 'saved', id: 'memory-1', file: 'memory/memory-1.json' });
    expect(writer.saved).toEqual([
      {
        schemaVersion: 1,
        kind: 'crash',
        createdAtMs: NOW,
        error: CRASH,
        record: null,
        match: evidence.match,
        logTail: evidence.logTail,
        environment: ENVIRONMENT,
        note: null,
      },
    ]);
  });

  it('gives the report as copy text when the writer rejects, and warns no one (the popup copies it)', async () => {
    const { reporter, writer, warnings } = setUp();
    vi.spyOn(writer, 'save').mockRejectedValue(new Error('offline'));

    const outcome = await reporter.reportCrash(CRASH);

    expect(outcome.status).toBe('copy');
    expect(JSON.parse(outcome.status === 'copy' ? outcome.text : '')).toMatchObject({
      kind: 'crash',
      error: CRASH,
      note: null,
    });
    expect(warnings).toEqual([]);
  });

  it('adds the note to a saved crash report through the writer', async () => {
    const { reporter, writer } = setUp();
    const saved = await reporter.reportCrash(CRASH);

    const noted = await reporter.addNote(saved, 'I pressed LOCK IN');

    expect(noted).toEqual(saved);
    expect(writer.saved[0]?.note).toBe('I pressed LOCK IN');
  });

  it('puts the note into the copy text of a report in copy mode', async () => {
    const { reporter, writer } = setUp();
    vi.spyOn(writer, 'save').mockRejectedValue(new Error('offline'));
    const copy = await reporter.reportCrash(CRASH);

    const noted = await reporter.addNote(copy, 'I pressed LOCK IN');

    const before: unknown = JSON.parse(copy.status === 'copy' ? copy.text : '');
    expect(noted.status).toBe('copy');
    expect(JSON.parse(noted.status === 'copy' ? noted.text : '')).toEqual({
      ...(before as object),
      note: 'I pressed LOCK IN',
    });
  });

  it('appends the note to a copy text that is not a JSON object', async () => {
    const { reporter } = setUp();

    expect(await reporter.addNote({ status: 'copy', text: 'plain' }, 'n')).toEqual({
      status: 'copy',
      text: 'plain\n\nNote: n',
    });
  });

  it('turns to copy with the id, the file and the note when the note cannot be saved', async () => {
    const { reporter, writer } = setUp();
    const saved = await reporter.reportCrash(CRASH);
    vi.spyOn(writer, 'addNote').mockRejectedValue(new Error('offline'));

    const noted = await reporter.addNote(saved, 'n');

    expect(noted).toEqual({
      status: 'copy',
      text: JSON.stringify({ id: 'memory-1', file: 'memory/memory-1.json', note: 'n' }, null, 2),
    });
  });

  it('is not capped or deduplicated like silent reports', async () => {
    const { reporter, writer } = setUp();

    for (let index = 0; index < MAX_SILENT_REPORTS + 1; index += 1) {
      await reporter.reportCrash(CRASH);
    }

    expect(writer.saved).toHaveLength(MAX_SILENT_REPORTS + 1);
  });
});

import { makeLogRecord } from '@eternalus/core';
import { describe, expect, it, vi } from 'vitest';

import { fakeMatchEvidence } from './__fixtures__/errorReports';
import { CRASH, ENVIRONMENT, NOW, setUp } from './__fixtures__/errorReporterSetUp';
import { MAX_SILENT_REPORTS } from './ErrorReporter.constants';

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

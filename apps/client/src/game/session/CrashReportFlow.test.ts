import { MemoryLogger } from '@eternalus/core';
import { describe, expect, it } from 'vitest';

import type { CrashReportState } from '../../bridge/CrashReport.types';
import type { BridgeEventMap } from '../../bridge/events';
import { TypedEventBus } from '../../bridge/TypedEventBus';
import { MAX_NOTE_CHARS } from '../../data/logging/ErrorReport.constants';
import type { ReportedError } from '../../data/logging/ErrorReport.types';
import { MemoryReportWriter } from '../../data/logging/MemoryReportWriter';
import type { ReportWriter } from '../../data/logging/ReportWriter.types';
import { flushMicrotasks, testReporter } from '../testSessionDeps';
import { CrashReportFlow } from './CrashReportFlow';

const ERROR: ReportedError = { message: 'boom', stack: 'at x', source: 'game-loop' };
const CONTEXT = {
  body: 'The match stopped.',
  errorText: 'Error: boom',
  tick: 42,
  seed: 7,
  cause: 'match',
  componentStack: '',
} as const;

/** A writer that cannot save (`'first'`: only its first report), or cannot save a note. */
class FailingWriter extends MemoryReportWriter implements ReportWriter {
  private saves = 0;

  public constructor(
    private readonly failures: { readonly save?: true | 'first'; readonly note?: true },
  ) {
    super();
  }

  public override save(...args: Parameters<MemoryReportWriter['save']>) {
    this.saves += 1;
    const { save } = this.failures;
    const isDown = save === true || (save === 'first' && this.saves === 1);
    return isDown ? Promise.reject(new Error('down')) : super.save(...args);
  }

  public override addNote(...args: Parameters<MemoryReportWriter['addNote']>) {
    return this.failures.note === true ? Promise.reject(new Error('down')) : super.addNote(...args);
  }
}

function setUp(writer: MemoryReportWriter = new MemoryReportWriter()) {
  const bus = new TypedEventBus<BridgeEventMap>();
  const logger = new MemoryLogger();
  const states: (CrashReportState | null)[] = [];
  bus.on('crash-report', (state) => states.push(state));
  const flow = new CrashReportFlow({ bus, reporter: testReporter(writer), logger });
  return { flow, writer, logger, states };
}

describe('CrashReportFlow', () => {
  it('logs FATAL, opens the popup asking for a note and saves the report without one', async () => {
    const { flow, writer, logger, states } = setUp();

    flow.crashed(ERROR, CONTEXT);

    expect(states).toEqual([
      { stage: 'asking', noteLimit: MAX_NOTE_CHARS, cause: 'match', crashNumber: 1 },
    ]);
    expect(logger.records).toEqual([
      expect.objectContaining({
        severityText: 'FATAL',
        scope: 'client.session',
        body: 'The match stopped.',
        tick: 42,
        attributes: { error: 'Error: boom', stack: 'at x', seed: 7 },
      }),
    ]);
    await flushMicrotasks();
    expect(writer.saved.map(({ error, note }) => [error, note])).toEqual([[ERROR, null]]);
    expect(states).toHaveLength(1);
  });

  it('logs no tick for a crash with no match', () => {
    const { flow, logger } = setUp();

    flow.crashed(ERROR, { ...CONTEXT, tick: null });

    expect(logger.records[0]?.tick).toBeNull();
  });

  it('saves the note into the report and shows where it is', async () => {
    const { flow, writer, states } = setUp();
    flow.crashed(ERROR, CONTEXT);

    flow.handleIntent({ kind: 'save-crash-note', note: 'I pressed R' });
    await flushMicrotasks();

    expect(states.map((state) => state?.stage)).toEqual(['asking', 'saving', 'saved']);
    expect(states.at(-1)).toEqual({
      stage: 'saved',
      file: 'memory/memory-1.json',
      noteLimit: MAX_NOTE_CHARS,
      cause: 'match',
      crashNumber: 1,
    });
    expect(writer.saved[0]?.note).toBe('I pressed R');
  });

  it('puts the component stack of a screen crash into the FATAL record, and leaves it out when empty', () => {
    const { flow, logger } = setUp();

    flow.crashed(ERROR, { ...CONTEXT, componentStack: '\n    at Screen' });
    flow.crashed(ERROR, CONTEXT);

    expect(logger.records[0]?.attributes).toEqual({
      error: 'Error: boom',
      stack: 'at x',
      seed: 7,
      componentStack: '\n    at Screen',
    });
    expect(logger.records[1]?.attributes).not.toHaveProperty('componentStack');
  });

  it('carries the cause and a new crash number in every state of a crash', async () => {
    const { flow, states } = setUp();

    flow.crashed(ERROR, { ...CONTEXT, cause: 'screen' });
    flow.handleIntent({ kind: 'save-crash-note', note: 'n' });
    await flushMicrotasks();
    flow.crashed(ERROR, CONTEXT);

    const labels = states.map((state) =>
      state === null ? null : [state.cause, state.crashNumber],
    );
    expect(labels).toEqual([
      ['screen', 1],
      ['screen', 1],
      ['screen', 1],
      ['match', 2],
    ]);
  });

  it('cuts a note to the writer’s limit', async () => {
    const { flow, writer } = setUp();
    flow.crashed(ERROR, CONTEXT);

    flow.handleIntent({ kind: 'save-crash-note', note: 'x'.repeat(MAX_NOTE_CHARS + 5) });
    await flushMicrotasks();

    expect(writer.saved[0]?.note).toHaveLength(MAX_NOTE_CHARS);
  });

  it('opens in copy mode at once when the report could not be saved', async () => {
    const { flow, states } = setUp(new FailingWriter({ save: true }));

    flow.crashed(ERROR, CONTEXT);
    await flushMicrotasks();

    const last = states.at(-1);
    expect(last?.stage).toBe('copy');
    expect(last?.stage === 'copy' && last.isReportSaved).toBe(false);
    expect(JSON.parse(last?.stage === 'copy' ? last.copyText : '{}')).toMatchObject({
      error: ERROR,
      note: null,
    });
  });

  it('puts the note into the copy text in copy mode, and again for a second note', async () => {
    const { flow, states } = setUp(new FailingWriter({ save: true }));
    flow.crashed(ERROR, CONTEXT);
    await flushMicrotasks();

    flow.handleIntent({ kind: 'save-crash-note', note: 'first' });
    await flushMicrotasks();
    flow.handleIntent({ kind: 'save-crash-note', note: 'second' });
    await flushMicrotasks();

    const copyText = (state: CrashReportState | null | undefined): string =>
      state?.stage === 'copy' ? state.copyText : '';
    expect(JSON.parse(copyText(states.at(-1)))).toMatchObject({ note: 'second' });
  });

  it('turns to copy mode with the id and the note when only the note write fails', async () => {
    const { flow, states } = setUp(new FailingWriter({ note: true }));
    flow.crashed(ERROR, CONTEXT);

    flow.handleIntent({ kind: 'save-crash-note', note: 'help' });
    await flushMicrotasks();

    const last = states.at(-1);
    expect(last?.stage).toBe('copy');
    expect(last?.stage === 'copy' && last.isReportSaved).toBe(true);
    expect(JSON.parse(last?.stage === 'copy' ? last.copyText : '{}')).toEqual({
      id: 'memory-1',
      file: 'memory/memory-1.json',
      note: 'help',
    });
  });

  it('still says the report is saved after a second note when only the note write fails', async () => {
    const { flow, states } = setUp(new FailingWriter({ note: true }));
    flow.crashed(ERROR, CONTEXT);
    flow.handleIntent({ kind: 'save-crash-note', note: 'one' });
    await flushMicrotasks();

    flow.handleIntent({ kind: 'save-crash-note', note: 'two' });
    await flushMicrotasks();

    const last = states.at(-1);
    expect(last?.stage === 'copy' && last.isReportSaved).toBe(true);
  });

  it('ignores a second note while the first is saving', async () => {
    const { flow, writer } = setUp();
    flow.crashed(ERROR, CONTEXT);

    flow.handleIntent({ kind: 'save-crash-note', note: 'one' });
    flow.handleIntent({ kind: 'save-crash-note', note: 'two' });
    await flushMicrotasks();

    expect(writer.saved[0]?.note).toBe('one');
  });

  it('closes on dismiss, and a note saved after that does not reopen it', async () => {
    const { flow, states } = setUp();
    flow.crashed(ERROR, CONTEXT);
    flow.handleIntent({ kind: 'save-crash-note', note: 'late' });

    flow.handleIntent({ kind: 'dismiss-crash-report' });
    await flushMicrotasks();

    expect(states.at(-1)).toBeNull();
  });

  it('keeps a late answer of an older crash out of the newer crash’s popup', async () => {
    const { flow, states } = setUp(new FailingWriter({ save: 'first' }));
    flow.crashed(ERROR, CONTEXT);
    flow.handleIntent({ kind: 'dismiss-crash-report' });
    flow.crashed({ ...ERROR, message: 'second' }, CONTEXT);
    await flushMicrotasks();

    // The first crash could not be saved, but its copy mode never reaches the second popup.
    expect(states.map((state) => state?.stage ?? 'closed')).toEqual(['asking', 'closed', 'asking']);
  });

  it('does nothing for a note with no crash, and for other intents', () => {
    const { flow, states } = setUp();

    flow.handleIntent({ kind: 'save-crash-note', note: 'orphan' });
    flow.handleIntent({ kind: 'start-match' });

    expect(states).toEqual([]);
  });
});

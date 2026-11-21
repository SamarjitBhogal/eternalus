import { makeLogRecord } from '@eternalus/core';

import type { CrashReportStage, CrashReportState } from '../../bridge/CrashReport.types';
import type { UiIntent } from '../../bridge/events';
import { MAX_NOTE_CHARS } from '../../data/logging/ErrorReport.constants';
import type { ReportedError } from '../../data/logging/ErrorReport.types';
import type { ReportOutcome } from '../../data/logging/ErrorReporter.types';
import type { CrashContext, CrashReportFlowDeps } from './CrashReportFlow.types';

/**
 * The crash report from the crash to the popup's close (ADR 0025 §3, §5; DEC-106, DEC-124). A
 * crash is logged as FATAL `client.session` and reported at once, without a note; the popup opens
 * (`crash-report`) and asks for one. `save-crash-note` adds the note through the reporter, and
 * `dismiss-crash-report` closes the popup. A report that could not be saved opens the popup in
 * copy mode, with the report as text. A newer crash replaces an older one: a late answer for the
 * older one is dropped.
 */
export class CrashReportFlow {
  private current = 0;
  private cause: CrashReportState['cause'] = 'match';
  private isReportSaved = false;
  private published: CrashReportState | null = null;
  private outcome: Promise<ReportOutcome> | null = null;

  /** Creates the flow; nothing is published until `crashed`. */
  public constructor(private readonly deps: CrashReportFlowDeps) {}

  /**
   * Logs the crash, reports it and opens the popup. Call it BEFORE the session leaves the `match`
   * phase: the report reads the running match's evidence in this call, and leaving drops the match.
   */
  public crashed(
    error: ReportedError,
    { body, errorText, tick, seed, cause, componentStack }: CrashContext,
  ): void {
    this.deps.logger.log(
      makeLogRecord('FATAL', 'client.session', body, {
        ...(tick === null ? {} : { tick }),
        attributes: {
          error: errorText,
          stack: error.stack,
          seed,
          ...(componentStack === '' ? {} : { componentStack }),
        },
      }),
    );
    const crash = ++this.current;
    this.cause = cause;
    this.isReportSaved = false;
    const outcome = this.deps.reporter.reportCrash(error);
    this.outcome = outcome;
    this.publish({ stage: 'asking' });
    void outcome.then((result) => {
      if (
        crash === this.current &&
        this.published?.stage === 'asking' &&
        result.status === 'copy'
      ) {
        this.publish(this.stateOf(result));
      }
    });
  }

  /** `save-crash-note` and `dismiss-crash-report`; any other intent is not for this flow. */
  public handleIntent(intent: UiIntent): void {
    if (intent.kind === 'dismiss-crash-report') {
      this.current += 1;
      this.outcome = null;
      this.publish(null);
    } else if (intent.kind === 'save-crash-note') {
      void this.saveNote(intent.note);
    }
  }

  private async saveNote(note: string): Promise<void> {
    const { outcome } = this;
    if (outcome === null || this.published === null || this.published.stage === 'saving') return;
    const crash = this.current;
    this.publish({ stage: 'saving' });
    const prior = await outcome;
    const result = await this.deps.reporter.addNote(prior, note.slice(0, MAX_NOTE_CHARS));
    if (crash !== this.current) return;
    // A copy after a saved report means only the note write failed (V4).
    if (prior.status === 'saved') this.isReportSaved = true;
    this.outcome = Promise.resolve(result);
    this.publish(this.stateOf(result));
  }

  /** Publishes the stage with the fields every state of the current crash carries. */
  private publish(stage: CrashReportStage | null): void {
    this.published =
      stage === null
        ? null
        : { ...stage, noteLimit: MAX_NOTE_CHARS, cause: this.cause, crashNumber: this.current };
    this.deps.bus.emit('crash-report', this.published);
  }

  private stateOf(outcome: ReportOutcome): CrashReportStage {
    return outcome.status === 'saved'
      ? { stage: 'saved', file: outcome.file }
      : { stage: 'copy', copyText: outcome.text, isReportSaved: this.isReportSaved };
  }
}

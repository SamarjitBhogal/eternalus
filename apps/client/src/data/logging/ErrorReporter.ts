import { type LogRecord, makeLogRecord } from '@eternalus/core';

import type { ErrorReport, MatchEvidence, ReportedError } from './ErrorReport.types';
import {
  DEDUPE_KEY_FIELDS,
  LOG_TAIL_RECORDS,
  MAX_SILENT_REPORTS,
  REPORTS_SCOPE,
  SILENT_REPORT_EXCEPTIONS,
  SILENT_REPORT_RULES,
} from './ErrorReporter.constants';
import type { ErrorReporterDeps, ReportOutcome, SilentReportRule } from './ErrorReporter.types';
import type { LogSink } from './LogSink.types';

/**
 * Turns crashes and errors into reports through one `ReportWriter` (ADR 0025 §3, §6). As a
 * `LogSink` it is the silent path: the page logger and each match logger send it WARN and worse,
 * and `SILENT_REPORT_RULES` pick the records to report. `reportCrash` is the crash path; `addNote`
 * adds the player's note. A report holds the running match's evidence (or `null`), the last log
 * records, the environment and the time. Every call resolves to `saved` or `copy` (the report as
 * text); it never throws, and it never reports its own `client.reports` records, so it cannot loop.
 */
export class ErrorReporter implements LogSink {
  private readonly reportedKeys = new Set<string>();

  /** Creates the reporter; nothing is reported until a record or a crash arrives. */
  public constructor(private readonly deps: ErrorReporterDeps) {}

  /** `LogSink`: the silent path (`reportRecord`), without waiting for the outcome. */
  public write(record: LogRecord): void {
    void this.reportRecord(record);
  }

  /**
   * The silent path (ADR 0025 §6): reports `record`, without a note, when a rule takes it; one
   * report per scope, event name and body, and at most `MAX_SILENT_REPORTS`, per page load. A
   * report that cannot be saved goes to the fallback sink as WARN `client.reports` with its text.
   * @returns The outcome, or `null` when the record makes no report. Never rejects.
   */
  public async reportRecord(record: LogRecord): Promise<ReportOutcome | null> {
    try {
      if (!this.takes(record)) return null;
      const outcome = await this.save(this.build('error', ErrorReporter.errorOf(record), record));
      if (outcome.status === 'copy') {
        this.warn('An error report could not be saved; attributes.text holds it.', outcome.text);
      }
      return outcome;
    } catch (failure) {
      this.warn('An error report could not be built.', String(failure));
      return null;
    }
  }

  /**
   * The crash path (ADR 0025 §3): reports `error` as a crash, at once and without a note; the
   * note follows through `addNote`. Not deduplicated or capped.
   * @returns Never rejects.
   */
  public async reportCrash(error: ReportedError): Promise<ReportOutcome> {
    try {
      return await this.save(this.build('crash', error, null));
    } catch (failure) {
      return { status: 'copy', text: JSON.stringify({ error, failure: String(failure) }, null, 2) };
    }
  }

  /**
   * Adds the player's note to the crash report `outcome` names. A saved report gets it through the
   * writer; when that fails, the outcome turns to `copy` with the report's id, file and the note
   * (the report itself is saved). A report in copy mode gets the note in its copy text.
   * @returns Never rejects.
   */
  public async addNote(outcome: ReportOutcome, note: string): Promise<ReportOutcome> {
    if (outcome.status === 'copy') {
      return { status: 'copy', text: ErrorReporter.withNote(outcome.text, note) };
    }
    try {
      const { id, file } = await this.deps.writer.addNote(outcome.id, note);
      return { status: 'saved', id, file };
    } catch {
      return {
        status: 'copy',
        text: JSON.stringify({ id: outcome.id, file: outcome.file, note }, null, 2),
      };
    }
  }

  /** Whether `record` makes a silent report now; counts it if so. */
  private takes(record: LogRecord): boolean {
    if (record.scope === REPORTS_SCOPE) return false;
    const matches = (rule: SilentReportRule): boolean => ErrorReporter.matches(rule, record);
    if (!SILENT_REPORT_RULES.some(matches) || SILENT_REPORT_EXCEPTIONS.some(matches)) return false;
    const key = JSON.stringify(DEDUPE_KEY_FIELDS.map((field) => record[field] ?? null));
    if (this.reportedKeys.has(key) || this.reportedKeys.size >= MAX_SILENT_REPORTS) return false;
    this.reportedKeys.add(key);
    return true;
  }

  /** The report, from the match's evidence while one runs, else from the page's log. */
  private build(
    kind: ErrorReport['kind'],
    error: ReportedError,
    record: LogRecord | null,
  ): ErrorReport {
    const evidence = this.evidence();
    const logTail = evidence?.logTail ?? this.deps.pageLogTail(LOG_TAIL_RECORDS);
    return {
      schemaVersion: 1,
      kind,
      createdAtMs: this.deps.now(),
      error,
      record,
      match: evidence?.match ?? null,
      logTail: logTail.slice(-LOG_TAIL_RECORDS),
      environment: this.deps.environment,
      note: null,
    };
  }

  /** The match's evidence; a match that cannot give it makes a report without one. */
  private evidence(): MatchEvidence | null {
    try {
      return this.deps.matchEvidence();
    } catch {
      return null;
    }
  }

  private async save(report: ErrorReport): Promise<ReportOutcome> {
    try {
      const { id, file } = await this.deps.writer.save(report);
      return { status: 'saved', id, file };
    } catch {
      return { status: 'copy', text: JSON.stringify(report, null, 2) };
    }
  }

  private warn(body: string, text: string): void {
    this.deps.fallback.write(makeLogRecord('WARN', REPORTS_SCOPE, body, { attributes: { text } }));
  }

  private static matches(rule: SilentReportRule, record: LogRecord): boolean {
    return (
      record.severityNumber >= rule.minSeverity &&
      (rule.scope ?? record.scope) === record.scope &&
      (rule.bodies?.includes(record.body) ?? true)
    );
  }

  private static errorOf({ body, scope, attributes }: LogRecord): ReportedError {
    const { stack } = attributes;
    return { message: body, stack: typeof stack === 'string' ? stack : null, source: scope };
  }

  /** The copy text with `note` set; a text that is not a JSON object gets the note appended. */
  private static withNote(text: string, note: string): string {
    try {
      const report: unknown = JSON.parse(text);
      if (typeof report === 'object' && report !== null && !Array.isArray(report)) {
        return JSON.stringify({ ...report, note }, null, 2);
      }
    } catch {
      // Not JSON: the note goes below the text.
    }
    return `${text}\n\nNote: ${note}`;
  }
}

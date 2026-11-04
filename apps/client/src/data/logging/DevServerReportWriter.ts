import { ERROR_REPORTS_PATH } from './ErrorReport.constants';
import type { ErrorReport } from './ErrorReport.types';
import { REPORT_TIMEOUT_MS } from './DevServerReportWriter.constants';
import type { DevServerReportWriterDeps } from './DevServerReportWriter.types';
import type { ReportWriter, SavedReport } from './ReportWriter.types';

/**
 * `ReportWriter` over the dev and preview servers' endpoint (ADR 0025 §1–§3): posts each report
 * and each note as JSON. A network error, an answer that is not 2xx or carries no id and file, or
 * no answer within `REPORT_TIMEOUT_MS` rejects; the caller then falls back to copy. Served by any
 * other server, every save rejects.
 */
export class DevServerReportWriter implements ReportWriter {
  /** Creates the writer; nothing is sent until `save` or `addNote`. */
  public constructor(private readonly deps: DevServerReportWriterDeps) {}

  /** Posts `report` to the endpoint; resolves to the id and file the server gave it. */
  public save(report: ErrorReport): Promise<SavedReport> {
    return this.post(ERROR_REPORTS_PATH, report);
  }

  /** Posts `note` for the saved report `id`; rejects for an id the server does not have (404). */
  public addNote(id: string, note: string): Promise<SavedReport> {
    return this.post(`${ERROR_REPORTS_PATH}/${encodeURIComponent(id)}/note`, { note });
  }

  /** The request, raced against the timeout; the timeout aborts it. */
  private async post(url: string, body: unknown): Promise<SavedReport> {
    const controller = new AbortController();
    let cancelTimeout = (): void => undefined;
    const timeout = new Promise<never>((_resolve, reject) => {
      cancelTimeout = this.deps.schedule(() => {
        controller.abort();
        reject(new Error(`No answer within ${String(REPORT_TIMEOUT_MS)} ms`));
      }, REPORT_TIMEOUT_MS);
    });
    try {
      return await Promise.race([this.request(url, body, controller.signal), timeout]);
    } finally {
      cancelTimeout();
    }
  }

  private async request(url: string, body: unknown, signal: AbortSignal): Promise<SavedReport> {
    const response = await this.deps.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
    if (!response.ok) {
      throw new Error(`The error-reports endpoint answered ${String(response.status)}`);
    }
    const answer: unknown = await response.json();
    if (!DevServerReportWriter.isSavedReport(answer)) {
      throw new Error('The error-reports endpoint answered without an id and a file');
    }
    return { id: answer.id, file: answer.file };
  }

  private static isSavedReport(value: unknown): value is SavedReport {
    return (
      typeof value === 'object' &&
      value !== null &&
      'id' in value &&
      typeof value.id === 'string' &&
      'file' in value &&
      typeof value.file === 'string'
    );
  }
}

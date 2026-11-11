import type { ErrorReport } from './ErrorReport.types';
import type { ReportWriter, SavedReport } from './ReportWriter.types';

/** Test double of `ReportWriter` (02 §8): keeps each report in memory under `memory-<n>`. */
export class MemoryReportWriter implements ReportWriter {
  private readonly reports = new Map<string, ErrorReport>();

  /** Every report it holds, in save order (with its note once one is added). */
  public get saved(): readonly ErrorReport[] {
    return [...this.reports.values()];
  }

  /** The report saved under `id`, or `undefined`. */
  public report(id: string): ErrorReport | undefined {
    return this.reports.get(id);
  }

  /** Keeps `report` under the next id. */
  public save(report: ErrorReport): Promise<SavedReport> {
    const id = `memory-${String(this.reports.size + 1)}`;
    this.reports.set(id, report);
    return Promise.resolve(MemoryReportWriter.savedAs(id));
  }

  /** Sets the note of report `id`; rejects for an id it never saved. */
  public addNote(id: string, note: string): Promise<SavedReport> {
    const report = this.reports.get(id);
    if (report === undefined) {
      return Promise.reject(new Error(`No report ${id}`));
    }
    this.reports.set(id, { ...report, note });
    return Promise.resolve(MemoryReportWriter.savedAs(id));
  }

  private static savedAs(id: string): SavedReport {
    return { id, file: `memory/${id}.json` };
  }
}

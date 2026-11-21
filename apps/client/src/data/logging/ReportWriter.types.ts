import type { ErrorReport } from './ErrorReport.types';

/** Where a saved report lives: its id (the file name without `.json`) and its file. */
export type SavedReport = { readonly id: string; readonly file: string };

/**
 * Port: where error reports are saved (ADR 0025 §3). `DevServerReportWriter` posts them to the dev
 * server's endpoint; `MemoryReportWriter` keeps them for tests. A database later is one more
 * adapter (DEC-106). Every adapter passes `describeReportWriter` (`ReportWriter.contract.ts`).
 */
export interface ReportWriter {
  /**
   * Saves `report` as a new report.
   * @returns Where it was saved. Rejects when it could not be saved.
   */
  save(report: ErrorReport): Promise<SavedReport>;
  /**
   * Sets the note of the saved report `id`, keeping the rest of it.
   * @returns Where it lives. Rejects for an id it never saved or when the write fails.
   */
  addNote(id: string, note: string): Promise<SavedReport>;
}

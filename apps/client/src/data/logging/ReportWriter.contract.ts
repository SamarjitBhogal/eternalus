import { describe, expect, it } from 'vitest';

import { fakeErrorReport } from './__fixtures__/errorReports';
import type { ReportWriter } from './ReportWriter.types';

/** What the contract suite needs from each adapter: the writer and a look into its store. */
export type ReportWriterHarness = {
  readonly writer: ReportWriter;
  /** The report the store holds under `id`, as plain data, or `undefined`. */
  readonly stored: (id: string) => unknown;
};

/**
 * The behaviour every `ReportWriter` must share (architecture 09 §9, ADR 0025 §3). Each adapter's
 * test calls it with a factory for a fresh writer over an empty store.
 */
export function describeReportWriter(name: string, createHarness: () => ReportWriterHarness): void {
  describe(`ReportWriter contract: ${name}`, () => {
    it('saves a report and resolves to its id and file', async () => {
      const { writer, stored } = createHarness();
      const report = fakeErrorReport();

      const saved = await writer.save(report);

      expect(saved.id).not.toBe('');
      expect(saved.file).not.toBe('');
      expect(stored(saved.id)).toEqual(report);
    });

    it('gives each saved report its own id', async () => {
      const { writer } = createHarness();

      const first = await writer.save(fakeErrorReport());
      const second = await writer.save(fakeErrorReport({ kind: 'error' }));

      expect(second.id).not.toBe(first.id);
    });

    it('sets the note of a saved report, keeps the rest and resolves to the same id and file', async () => {
      const { writer, stored } = createHarness();
      const report = fakeErrorReport();
      const saved = await writer.save(report);

      const noted = await writer.addNote(saved.id, 'I pressed LOCK IN');

      expect(noted).toEqual(saved);
      expect(stored(saved.id)).toEqual({ ...report, note: 'I pressed LOCK IN' });
    });

    it('rejects a note for an id it never saved', async () => {
      const { writer } = createHarness();

      await expect(writer.addNote('never-saved', 'note')).rejects.toThrow();
    });
  });
}

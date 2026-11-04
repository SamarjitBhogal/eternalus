import { describe, expect, it } from 'vitest';

import { fakeErrorReport } from './__fixtures__/errorReports';
import { MemoryReportWriter } from './MemoryReportWriter';
import { describeReportWriter } from './ReportWriter.contract';

describeReportWriter('MemoryReportWriter', () => {
  const writer = new MemoryReportWriter();
  return { writer, stored: (id) => writer.report(id) };
});

describe('MemoryReportWriter', () => {
  it('lists every report in save order, each with its note', async () => {
    const writer = new MemoryReportWriter();
    const { id } = await writer.save(fakeErrorReport());
    await writer.save(fakeErrorReport({ kind: 'error' }));

    await writer.addNote(id, 'first');

    expect(writer.saved.map(({ kind, note }) => [kind, note])).toEqual([
      ['crash', 'first'],
      ['error', null],
    ]);
  });
});

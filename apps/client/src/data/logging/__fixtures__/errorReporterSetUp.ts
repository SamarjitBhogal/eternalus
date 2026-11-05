import { type LogRecord, makeLogRecord } from '@eternalus/core';

import type { MatchEvidence, ReportEnvironment } from '../ErrorReport.types';
import { ErrorReporter } from '../ErrorReporter';
import { MemoryReportWriter } from '../MemoryReportWriter';

export const ENVIRONMENT: ReportEnvironment = {
  gameVersion: '0.0.0',
  commit: 'abc1234',
  contentVersion: null,
  userAgent: 'test-agent',
};
export const NOW = 1_234;
export const CRASH = {
  message: 'step failed',
  stack: 'Error: step failed\n  at step',
  source: 'game-loop',
};

export const records = (count: number, scope = 'client.page'): LogRecord[] =>
  Array.from({ length: count }, (_, index) =>
    makeLogRecord('INFO', scope, `line ${String(index)}`),
  );

/** A reporter over a `MemoryReportWriter`, a page log of 70 records and no match. */
export function setUp() {
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

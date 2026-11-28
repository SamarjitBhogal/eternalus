import type { ReportedError } from './ErrorReport.types';

/** What a thrown value says, for a report: its message and stack, or the value as text. */
export function reportedErrorOf(error: unknown, source: string): ReportedError {
  if (error instanceof Error) return { message: error.message, stack: error.stack ?? null, source };
  return { message: String(error), stack: null, source };
}

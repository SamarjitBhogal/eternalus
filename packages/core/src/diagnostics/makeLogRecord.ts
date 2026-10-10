import type { DiagnosticEvent } from './DiagnosticEvent.types';
import { SEVERITY } from './Logger.constants';
import type { LogAttributes, LogContext, LogRecord, SeverityText } from './Logger.types';

/**
 * Optional parts of a record: a tick, a context, and either free attributes or a typed `DiagnosticEvent`
 * (whose name becomes `eventName` and whose fields become the attributes).
 */
type LogDetails = { readonly tick?: number; readonly context?: LogContext } & (
  | { readonly attributes?: LogAttributes; readonly event?: never }
  | { readonly event: DiagnosticEvent; readonly attributes?: never }
);

/** Builds a `LogRecord`; the one place records are made, so every record has the same shape. */
export const makeLogRecord = (
  level: SeverityText,
  scope: string,
  body: string,
  { tick, context, attributes, event }: LogDetails = {},
): LogRecord => ({
  severityNumber: SEVERITY[level],
  severityText: level,
  body,
  scope,
  ...(event === undefined ? {} : { eventName: event.name }),
  tick: tick ?? null,
  attributes: event?.attributes ?? attributes ?? {},
  ...(context === undefined ? {} : { context }),
});

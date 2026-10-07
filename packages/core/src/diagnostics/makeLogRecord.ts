import { SEVERITY } from './Logger.constants';
import type { LogAttributes, LogRecord, SeverityText } from './Logger.types';

/** Optional parts of a record. */
type LogDetails = {
  readonly attributes?: LogAttributes;
  readonly tick?: number;
  readonly eventName?: string;
};

/** Builds a `LogRecord`; the one place records are made, so every record has the same shape. */
export const makeLogRecord = (
  level: SeverityText,
  scope: string,
  body: string,
  { attributes = {}, tick, eventName }: LogDetails = {},
): LogRecord => ({
  severityNumber: SEVERITY[level],
  severityText: level,
  body,
  scope,
  ...(eventName === undefined ? {} : { eventName }),
  tick: tick ?? null,
  attributes,
});

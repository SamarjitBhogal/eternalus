import type { DiagnosticEventName } from './DiagnosticEvent.types';
import type { SEVERITY } from './Logger.constants';

/** A severity name; its number is `SEVERITY[name]`. */
export type SeverityText = keyof typeof SEVERITY;

/** A structured attribute value: plain data only, so records can be stored and posted. */
export type LogAttributes = Readonly<Record<string, string | number | boolean | null>>;

/** One log record, shaped after the OpenTelemetry log data model (architecture 15 §4). */
export type LogRecord = {
  readonly severityNumber: number;
  readonly severityText: SeverityText;
  readonly body: string;
  /** Instrumentation scope, e.g. `core.commands`, `core.invariants`. */
  readonly scope: string;
  /** Set when the record reports a `DiagnosticEvent`, e.g. `command-rejected`. */
  readonly eventName?: DiagnosticEventName;
  /** The tick: core's only notion of time. `null` for records made outside a tick. */
  readonly tick: number | null;
  /** Wall-clock time, stamped by the client's logger from the engine clock; never by core. */
  readonly timestampMs?: number;
  readonly attributes: LogAttributes;
};

/** The logging port core writes to. The client supplies the sinks; core never sees them. */
export interface Logger {
  /** Takes one record. Must not throw. */
  log(record: LogRecord): void;
}

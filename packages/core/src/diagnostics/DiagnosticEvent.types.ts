import type { EntityId } from '../state/EntityStore.types';

/**
 * The structured diagnostics core reports through the `Logger` (FR-102, architecture 15 §5): each
 * name becomes a `LogRecord.eventName` and its fields that record's `attributes`. The single place
 * of change for diagnostics: a reporter adds its line here.
 */
export type DiagnosticEventMap = {
  readonly 'command-rejected': { readonly commandType: string; readonly reason: string };
  readonly 'invariant-violated': {
    readonly invariantId: string;
    readonly entityId: EntityId | null;
    readonly seed: number;
    readonly tick: number;
  };
};

/** The name of a diagnostic event. */
export type DiagnosticEventName = keyof DiagnosticEventMap;

/** One diagnostic event: its name and its attributes. */
export type DiagnosticEvent = {
  readonly [K in DiagnosticEventName]: {
    readonly name: K;
    readonly attributes: DiagnosticEventMap[K];
  };
}[DiagnosticEventName];

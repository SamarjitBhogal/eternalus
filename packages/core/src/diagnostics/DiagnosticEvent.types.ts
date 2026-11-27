import type { EntityId } from '../state/EntityStore.types';

/**
 * The structured diagnostics core reports through the `Logger` (FR-102, architecture 15 §5): each
 * name becomes a `LogRecord.eventName` and its fields that record's `attributes`. The single place
 * of change for diagnostics: a reporter adds its line here.
 */
export type DiagnosticEventMap = {
  readonly 'command-rejected': { readonly commandType: string; readonly reason: string };
  /**
   * A spawn loadout that failed validation, and the loadout used instead: its Legend's auto-build,
   * else the class default (05 §12, DEC-354 (3)).
   */
  readonly 'loadout-rejected': {
    readonly definitionId: string;
    /** The given loadout's Legend; `null` when it names none. */
    readonly givenSpecId: string | null;
    /** The used loadout's Legend; `null` when it falls back to the class default. */
    readonly usedSpecId: string | null;
    readonly givenWeaponId: string;
    readonly usedWeaponId: string;
    /** Every problem's message, joined with `; `. */
    readonly problems: string;
  };
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

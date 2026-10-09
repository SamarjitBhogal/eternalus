import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';

/** A kebab-case invariant id, e.g. `health-within-bounds`. */
type InvariantId = string;

/** How bad a violation is; `fatal` means the state can no longer be trusted. */
export type InvariantSeverity = 'warn' | 'error' | 'fatal';

/** `tick` invariants are light and run every tick; `periodic` ones run every `heavyEvery` ticks. */
export type InvariantCadence = 'tick' | 'periodic';

/** One broken rule, with plain data only so it can be logged, hashed and cloned. */
export type Violation = {
  readonly invariantId: InvariantId;
  readonly severity: InvariantSeverity;
  readonly message: string;
  readonly entityId: EntityId | null;
  readonly details: Readonly<Record<string, number | string | boolean>>;
};

/**
 * A rule the simulation state must always satisfy (architecture 15 §2). `check` is pure: it reads
 * the state, never changes it and never throws.
 */
export interface Invariant {
  readonly id: InvariantId;
  readonly severity: InvariantSeverity;
  readonly cadence: InvariantCadence;
  /** Every violation of this rule in `state` right now; empty when it holds. */
  check(state: GameState): readonly Violation[];
}

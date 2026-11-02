import type { Team } from '../teams/teams.types';
import type { EntityId } from './EntityStore.types';
import type { MatchPhase } from './GameState.types';

/**
 * One entity as the client sees it. A field is `null` when the entity has no component behind it
 * (no `Transform`, `Health`, `TeamMembership` or `Capturable`), never a made-up default.
 */
export type EntitySnapshot = {
  readonly id: EntityId;
  readonly kind: string;
  readonly family: string;
  readonly definitionId: string;
  readonly team: Team | null;
  readonly transform: { readonly x: number; readonly y: number; readonly radius: number } | null;
  readonly health: { readonly current: number; readonly max: number } | null;
  /** A capture point's state (`Capturable`, architecture 07 §7); `null` for every other entity. */
  readonly capture: CaptureSnapshot | null;
};

/** One zone's capture state as the client sees it. */
export type CaptureSnapshot = {
  readonly owner: Team;
  /** -1 (fully Dark) to +1 (fully Light); 0 is neutral. */
  readonly progress: number;
  /** Checkpoints the current capture has passed, from 0 to `checkpoints`. */
  readonly checkpoint: number;
  /** How many checkpoints a full capture passes (`GameConfig.match.capturePoints`). */
  readonly checkpoints: number;
  /** The mini-boss that blocks capture, or `null`. */
  readonly lockedBy: EntityId | null;
};

/**
 * The state of a match after one tick, as plain data: objects, arrays, numbers, strings and
 * `null` only, so it survives `structuredClone` and `postMessage` unchanged (D8). The client keeps
 * the previous and the current snapshot and interpolates between them (architecture 03 §5).
 */
export type Snapshot = {
  readonly tick: number;
  readonly phase: MatchPhase;
  /** In the store's insertion order. */
  readonly entities: readonly EntitySnapshot[];
};

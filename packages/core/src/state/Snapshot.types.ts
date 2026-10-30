import type { MatchPhase } from '../config/matchPhases';
import type { Team } from '../teams/teams.types';
import type { EntityId } from './EntityStore.types';
import type { ScheduledMark } from './MatchState.types';

/**
 * One entity as the client sees it. A field is `null` when the entity has no component behind it
 * (no `Transform`, `Health` or `TeamMembership`), never a made-up default.
 */
export type EntitySnapshot = {
  readonly id: EntityId;
  readonly kind: string;
  readonly family: string;
  readonly definitionId: string;
  readonly team: Team | null;
  readonly transform: { readonly x: number; readonly y: number; readonly radius: number } | null;
  readonly health: { readonly current: number; readonly max: number } | null;
};

/** Where the match is in its timeline, for the HUD's phase and countdowns (plan §4.2). */
export type MatchSnapshot = {
  readonly phase: MatchPhase;
  readonly phaseEnteredTick: number;
  /** The unfired timeline entries in tick order; empty after the last one. */
  readonly upcoming: readonly ScheduledMark[];
  /** The human's Legend; `null` in sim mode, or when the seat's spawn failed. */
  readonly humanLegendId: EntityId | null;
};

/**
 * The state of a match after one tick, as plain data: objects, arrays, numbers, strings and
 * `null` only, so it survives `structuredClone` and `postMessage` unchanged (D8). The client keeps
 * the previous and the current snapshot and interpolates between them (architecture 03 §5).
 */
export type Snapshot = {
  readonly tick: number;
  readonly match: MatchSnapshot;
  /** In the store's insertion order. */
  readonly entities: readonly EntitySnapshot[];
};

import type { PlayableTeam, Team } from '../teams/teams.types';
import type { EntityId } from './EntityStore.types';
import type { MatchPhase, TeamState } from './GameState.types';
import type { Horde } from './Horde.types';

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

/** A lane horde as the client sees it (architecture 18 §4): the store's plain fields, copied. */
export type HordeSnapshot = Horde;

/** One playable team's match counters as the client sees them (architecture 18 §3.4). */
type TeamSnapshot = TeamState;

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
  /** In creation order. */
  readonly hordes: readonly HordeSnapshot[];
  readonly teams: Readonly<Record<PlayableTeam, TeamSnapshot>>;
};

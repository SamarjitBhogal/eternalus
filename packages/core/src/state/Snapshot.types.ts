import type { MatchPhase } from '../config/matchPhases';
import type { PlayableTeam, Team } from '../teams/teams.types';
import type { EntityId } from './EntityStore.types';
import type { TeamState } from './GameState.types';
import type { Horde } from './Horde.types';
import type { ScheduledMark } from './MatchState.types';
import type { MapObjectSnapshot } from '../content/maps/mapObjects.types';
import type { Polygon } from '../utils/geometry.types';

/**
 * One entity as the client sees it. A field is `null` when the entity has no component behind it
 * (no `Transform`, `Health`, `TeamMembership`, `ZoneArea` or `Capturable`), never a made-up
 * default.
 */
export type EntitySnapshot = {
  readonly mapObjectId?: string;
  /**
   * A structure built from a map feature: the feature's id (`MapFeature.id`), so a HUD tile binds
   * to its structure by identity, never by position.
   */
  readonly mapFeatureId?: string;
  readonly id: EntityId;
  readonly kind: string;
  readonly family: string;
  readonly definitionId: string;
  readonly team: Team | null;
  readonly transform: { readonly x: number; readonly y: number; readonly radius: number } | null;
  readonly health: { readonly current: number; readonly max: number } | null;
  /** The ground a zone covers (`ZoneArea`), as polygons in world units; `null` for non-zones. */
  readonly area: readonly Polygon[] | null;
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
  /**
   * Each side's summed unit weight inside the zone this tick (DEC-145 (c)); a side's share of the
   * total is its density.
   */
  readonly presence: Readonly<Record<Team, number>>;
};

/** Where the match is in its timeline, for the HUD's phase and countdowns (plan §4.2). */
export type MatchSnapshot = {
  readonly phase: MatchPhase;
  readonly phaseEnteredTick: number;
  /** The unfired timeline entries in tick order; empty after the last one. */
  readonly upcoming: readonly ScheduledMark[];
  /** The human's Legend; `null` in sim mode, or when the human slot names no Legend definition. */
  readonly humanLegendId: EntityId | null;
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
  readonly mapObjects?: readonly MapObjectSnapshot[];
  readonly tick: number;
  readonly match: MatchSnapshot;
  /** In the store's insertion order. */
  readonly entities: readonly EntitySnapshot[];
  /** In creation order. */
  readonly hordes: readonly HordeSnapshot[];
  readonly teams: Readonly<Record<PlayableTeam, TeamSnapshot>>;
};

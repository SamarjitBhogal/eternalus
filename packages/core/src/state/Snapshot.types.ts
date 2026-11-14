import type {
  AbilityRejectReason,
  AbilitySlot,
} from '../content/abilities/AbilityDefinition.types';
import type { LevelProgress } from '../components/Progression.types';
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
 * (no `Transform`, `Health`, `Progression`, `Aether`, `TeamMembership`, `ZoneArea` or
 * `Capturable`), never a made-up default.
 */
export type EntitySnapshot = {
  readonly mapObjectId?: string;
  readonly id: EntityId;
  readonly kind: string;
  readonly family: string;
  readonly definitionId: string;
  readonly team: Team | null;
  readonly transform: { readonly x: number; readonly y: number; readonly radius: number } | null;
  readonly health: { readonly current: number; readonly max: number } | null;
  /** A Legend's level and XP (`Progression`, DEC-224); `null` for every entity that does not level. */
  readonly progression: ProgressionSnapshot | null;
  /** A Legend's aether pool (`Aether`, DEC-230); `null` for every entity without one. */
  readonly aether: { readonly current: number; readonly max: number } | null;
  /** The ground a zone covers (`ZoneArea`), as polygons in world units; `null` for non-zones. */
  readonly area: readonly Polygon[] | null;
  /** A capture point's state (`Capturable`, architecture 07 §7); `null` for every other entity. */
  readonly capture: CaptureSnapshot | null;
};

/** A Legend's level and XP as the client sees it (architecture 03 §5, the HUD's XP ring). */
type ProgressionSnapshot = LevelProgress & {
  /** From 1 to the curve's cap. */
  readonly level: number;
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

/**
 * One ability bar slot as the HUD shows it (architecture 05 §15 `AbilitySlotSnapshot`). An empty
 * slot has `abilityId: null`, both cooldown fields and the cost at 0 and `blockedBy: 'empty-slot'`.
 */
export type AbilitySlotSnapshot = {
  readonly slot: AbilitySlot;
  readonly abilityId: string | null;
  /** Ticks until the cooldown ends; 0 when it is over. */
  readonly cooldownRemainingTicks: number;
  /** The ability's full cooldown in ticks. */
  readonly cooldownTicks: number;
  /** The aether the cast costs now, after status modifiers. */
  readonly aetherCost: number;
  /** The ultimate's meter 0..1; `null` on every slot until the meter is built (a later PR). */
  readonly charge: number | null;
  /** Whether a cast would be accepted now. */
  readonly isReady: boolean;
  /** Why it would be refused; `null` exactly when `isReady`. */
  readonly blockedBy: AbilityRejectReason | null;
};

/** What only the human player's Legend needs (architecture 05 §15, DEC-232). */
export type PlayerSnapshot = {
  readonly entityId: EntityId;
  /** In bar order: every slot, empty ones included. */
  readonly slots: readonly AbilitySlotSnapshot[];
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
  /** The human Legend's player-only data; `null` in sim mode or when it has no ability bar. */
  readonly player: PlayerSnapshot | null;
  /** In the store's insertion order. */
  readonly entities: readonly EntitySnapshot[];
  /** In creation order. */
  readonly hordes: readonly HordeSnapshot[];
  readonly teams: Readonly<Record<PlayableTeam, TeamSnapshot>>;
};

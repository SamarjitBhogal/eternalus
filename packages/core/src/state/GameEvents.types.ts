import type { ShieldBar } from '../components/Health.types';
import type { MatchPhase } from '../config/matchPhases';
import type { Team } from '../teams/teams.types';
import type { Vec2 } from '../utils/geometry.types';
import type { EntityId, RemovalCause } from './EntityStore.types';
import type { MatchResult } from './MatchResult.types';
import type { OwedXp } from './RespawnQueue.types';

/**
 * Who or what dealt damage (architecture 05 §9). Every hit names one, so every death has a killer.
 * Lives in `state/` because events carry it and `state/` may not import `combat/` (02).
 */
export type DamageSource = {
  readonly attackerId: EntityId | null;
  readonly kind: 'weapon' | 'ability' | 'status' | 'structure' | 'environment';
  /** The weapon, ability, status or structure definition id. */
  readonly definitionId: string;
};

/**
 * Where a hit came from, in world units (DEC-381). The body-part bonuses read it
 * (`combat/BodyPartBonusStep`). Lives in `state/` beside `DamageSource` because the `entities/`
 * damage port carries it too and `entities/` may not import `combat/` (02).
 */
export type HitPath = {
  /** Where the hit came from: the melee attacker's position, or where a shot started. */
  readonly origin: Vec2;
  /** Where a shot struck; a melee hit leaves it out. */
  readonly impactPoint?: Vec2;
};

/** A horde's announcement payload. */
type HordePayload = {
  readonly hordeId: string;
  readonly lane: string;
  readonly team: Team;
  readonly memberIds: readonly EntityId[];
};

/** A status effect's announcement payload. */
type StatusPayload = {
  readonly entityId: EntityId;
  readonly statusId: string;
  readonly sourceId: EntityId | null;
};

/**
 * Every event the simulation can emit, by name (architecture 03 §4). The single place of change
 * for events: an emitter adds its line here. Emitting a name that is not listed does not compile.
 * Ids of things that have no type yet (lanes, hordes, statuses, abilities) are plain strings.
 */
export type GameEventMap = {
  readonly 'entity-spawned': {
    readonly entityId: EntityId;
    readonly kind: string;
    readonly team: Team;
  };
  /** `killer` is set for a `died` removal whose lethal hit went through the damage pipeline. */
  readonly 'entity-removed': {
    readonly entityId: EntityId;
    readonly cause: RemovalCause;
    readonly killer?: DamageSource;
  };
  /**
   * Sim mode moved the `playerTeam` human seat (`dev-set-controller`, FR-099): `from` is the
   * Legend that was the human's, `to` the one that is now; either is `null` for no human.
   */
  readonly 'human-reseated': { readonly from: EntityId | null; readonly to: EntityId | null };
  readonly 'damage-applied': {
    readonly targetId: EntityId;
    readonly amount: number;
    readonly absorbed: number;
    readonly source: DamageSource;
  };
  /**
   * A hit that a damage step took to 0 (an unbreakable structure, friendly fire): nothing reached
   * `Health`. The Cathedral gem answers it (DEC-292).
   */
  readonly 'damage-blocked': { readonly targetId: EntityId; readonly source: DamageSource };
  readonly 'entity-died': { readonly entityId: EntityId; readonly killer: DamageSource };
  readonly 'structure-destroyed': {
    readonly entityId: EntityId;
    readonly kind: string;
    readonly team: Team;
    readonly lane: string | null;
  };
  /** A wall or gate turned breakable (or back); `lane` is its `MapLane.id`, `null` off the lanes. */
  readonly 'structure-breakability-changed': {
    readonly entityId: EntityId;
    readonly isBreakable: boolean;
    readonly lane: string | null;
  };
  /**
   * A camp's whole group is dead (18 §7.1); the group comes back after its respawn time.
   * `killerId` dealt the last mob's lethal hit and `team` is its team; both `null` when no killer
   * is known (a death outside the damage pipeline, or a killer that left the store and is not a
   * Legend waiting to respawn).
   */
  readonly 'camp-cleared': {
    readonly entityId: EntityId;
    readonly team: Team | null;
    readonly killerId: EntityId | null;
  };
  /**
   * The last defender of one reached checkpoint's set (`defenceId`, one per `checkpoint-reached`)
   * at capture point `pointId` is lost (07 §7). `defendersTeam` is the set's team; `killerId` and
   * `team` are as in `camp-cleared`; `position` is where that last defender fell (`null` when it
   * had no `Transform`).
   */
  readonly 'checkpoint-cleared': {
    readonly pointId: EntityId;
    readonly checkpoint: number;
    readonly defenceId: string;
    readonly defendersTeam: Team;
    readonly team: Team | null;
    readonly killerId: EntityId | null;
    readonly position: Vec2 | null;
  };
  readonly 'shield-bars-changed': {
    readonly entityId: EntityId;
    readonly bars: readonly ShieldBar[];
  };
  readonly 'capture-progress': {
    readonly pointId: string;
    readonly team: Team;
    readonly progress: number;
    readonly checkpoint: number;
  };
  /**
   * A side's capture passed checkpoint 1, 2 or 3 (FR-031, DEC-145 (b)); never on a drain, a revert
   * or an owner refilling its own zone, and once per side until the zone changes owner (DEC-145 (g)).
   */
  readonly 'checkpoint-reached': {
    readonly pointId: string;
    readonly team: Team;
    readonly checkpoint: number;
    /**
     * The reaching team's living Legends whose centre is on the zone's area when the checkpoint is
     * reached (DEC-145 (a), DEC-223 (4a)), in store order: the Legends that win it.
     */
    readonly presentLegendIds: readonly EntityId[];
  };
  readonly 'capture-point-owner-changed': {
    readonly pointId: string;
    readonly from: Team;
    readonly to: Team;
  };
  /** A minion's kills earned it one level (`VeterancySystem`); `MinionLevelSystem` applies it. */
  readonly 'minion-level-earned': { readonly entityId: EntityId };
  /**
   * A level source other than kills (`sourceId`, a held capture zone, 07 §7, DEC-258) grants a
   * minion `levels` minion levels, or takes them back when negative; `MinionLevelSystem` applies
   * them on its pass.
   */
  readonly 'minion-levels-granted': {
    readonly entityId: EntityId;
    readonly levels: number;
    readonly sourceId: EntityId;
  };
  readonly 'phase-changed': { readonly from: MatchPhase; readonly to: MatchPhase };
  /** Once per match, when a verdict ends it; `result` is the one stored in `state.match.result`. */
  readonly 'match-ended': { readonly result: MatchResult };
  /** `slot` is an `AbilitySlot` (typed loosely: `state/` sits below `commands/`). */
  readonly 'ability-cast': {
    readonly casterId: EntityId;
    readonly abilityId: string;
    readonly slot: string;
  };
  readonly 'status-applied': StatusPayload;
  readonly 'status-expired': StatusPayload;
  /** Some stacks of a status taken off while some stay on (a lost minion level); `stacks` are left. */
  readonly 'status-stacks-lost': StatusPayload & { readonly stacks: number };
  readonly 'horde-spawned': HordePayload;
  readonly 'horde-dissolved': HordePayload;
  /**
   * A dead Legend came back at its Stronghold (FR-051, DEC-295): the same entity, with `owedXp`,
   * the XP it earned while it waited, which `ProgressionSystem` pays now (DEC-186).
   */
  readonly 'legend-respawned': {
    readonly entityId: EntityId;
    readonly team: Team;
    readonly position: Vec2;
    readonly owedXp: readonly OwedXp[];
  };
  readonly 'level-up': { readonly entityId: EntityId; readonly level: number };
  /**
   * XP reaching a Legend; one per award, so the invariant can audit every award. A kill pays its
   * killer; `cause: 'structure-destroyed'` pays a Legend of the team that destroyed `victimId`, and
   * `cause: 'team-kill'` a Legend of the team whose unit killed boss `victimId` (DEC-237), and
   * `cause: 'camp-cleared'` the Legend that killed the last mob of camp `victimId`, and
   * `cause: 'checkpoint-cleared'` a Legend near the last defender of a checkpoint of capture point
   * `victimId` (its share, 07 §7).
   */
  readonly 'xp-gained': {
    readonly entityId: EntityId;
    readonly amount: number;
    readonly victimId: EntityId;
    readonly victimTeam: Team;
    /** `respawn`: XP owed while the Legend waited, paid as it returns (DEC-186). */
    readonly cause:
      | 'kill'
      | 'structure-destroyed'
      | 'team-kill'
      | 'camp-cleared'
      | 'checkpoint-cleared'
      | 'respawn';
  };
  readonly 'team-changed': {
    readonly entityId: EntityId;
    readonly from: Team;
    readonly to: Team;
    readonly cause: string;
  };
  readonly 'boss-summoned': { readonly entityId: EntityId; readonly kind: string };
  /**
   * The Cathedral gem erupted (`summon-greater-boss`, 12 §3); `boss-summoned` comes with the
   * spawn.
   */
  readonly 'greater-boss-summoned': { readonly bossId: string };
  /** The Greater Boss's entrance roar (reference 04), on its spawn tick; no gameplay effect yet. */
  readonly 'boss-entrance': { readonly bossId: EntityId };
  /** A boss began a move (11 §4.6); it lands `telegraphSeconds` later with `boss-move-executed`. */
  readonly 'boss-telegraph': { readonly bossId: EntityId; readonly move: string };
  /** A boss's move landed: its hits went through the damage pipeline this tick. */
  readonly 'boss-move-executed': { readonly bossId: EntityId; readonly move: string };
  /** `command` is the rejected `Command` (typed loosely: `state/` sits below `commands/`). */
  readonly 'command-rejected': {
    readonly command: { readonly type: string };
    readonly reason: string;
  };
  readonly 'collision-anomaly': {
    readonly entityId: EntityId;
    readonly from: Vec2;
    readonly to: Vec2;
    readonly colliderId: string;
  };
  readonly 'invariant-violated': {
    readonly invariantId: string;
    readonly tick: number;
    readonly details: Readonly<Record<string, number | string | boolean>>;
  };
  readonly 'tick-completed': { readonly tick: number };
};

/** The name of a game event. */
export type GameEventType = keyof GameEventMap;

/** A listener for one event type. */
export type GameEventHandler<K extends GameEventType> = (payload: GameEventMap[K]) => void;

/** Stops the subscription it was returned from. */
export type Unsubscribe = () => void;

/** An event as recorded for diagnostics: what happened, with what payload, in which tick. */
export type TimedEvent = {
  readonly [K in GameEventType]: {
    readonly tick: number;
    readonly type: K;
    readonly payload: GameEventMap[K];
  };
}[GameEventType];

import type { ControllerId } from '../ai/ai.types';
import type { EntityDefinitionBase } from '../EntityDefinition.types';
import type { BreakabilityRule } from './breakability.types';

/** The structure kinds (`04-entity-architecture.md`, family table). Their classes arrive in Phase 2. */
export type StructureKind =
  | 'stronghold'
  | 'spawner-tower'
  | 'buff-tower'
  | 'wall-segment'
  | 'gate'
  | 'turret'
  | 'camp'
  | 'cathedral'
  | 'cathedral-gem';

/**
 * A static thing with health: a building, wall, gate, turret, camp or the Cathedral gem.
 * Shield fractions, breakability, spawn tables and auras are added with the structures in Phase 2.
 */
export type StructureDefinition = EntityDefinitionBase & {
  /** Which entity class builds it. */
  readonly kind: StructureKind;
  /** Full base health, before shield bars. */
  readonly baseHealth: number;
  /** Collider circle radius in world units (convex polygon footprints arrive in Phase 2). */
  readonly footprintRadius: number;
  /** When it may take damage (07 §3). */
  readonly breakability: BreakabilityRule;
  /**
   * Whether its map object of the same id (a lane tower's fort, a gate's passage, a wall turret's
   * pylon) is its outline: attack reach and chases measure to that object's footprints, not the
   * collider circle (`Footprint`, DEC-185). A blocking such object is also its body, with no health
   * of its own, unless the structure `isMounted`. The map objects that are `partOf` a structure
   * (the Stronghold's outer walls and throne, DEC-386 (1)) add to its outline with or without it.
   * The Stronghold has none: the palace floor is not part of it (DEC-344 (4)).
   */
  readonly hasMapFootprint?: true;
  /**
   * Whether the structure stands on its map object of the same id (`hasMapFootprint`), as a wall
   * turret stands on its pylon. The structure is mounted on that object. The object keeps its own
   * entity and health. The object breaks under this structure's rule. When the object falls, the
   * structure falls with it on the same tick (DEC-388). When the structure falls, the object stays
   * standing as a ruin, with its own health.
   */
  readonly isMounted?: true;
  /**
   * Whether the box round its `Footprint` is a fort box (`PathingWorld.forts`): a chase of a unit
   * standing inside it closes in over the blocked ground there (DEC-185; the Stronghold's, the box
   * round its outer walls and throne, DEC-217 (16), DEC-386 (1)). A gate's outline is for reach
   * only (DEC-217 (17)).
   */
  readonly hasFortBox?: true;
  /**
   * Whether a shot not aimed at it flies over its body, its collider circle
   * (`Collider.canShotsFlyOver`, `AreaHitQuery.stopsShot`): a forest camp, whose home sits unseen
   * inside its camp fire, so a shot flies over both (HC-Q105, DEC-386 correction 2026-11-26,
   * HC-Q115). It has no effect on a structure with a `Footprint`: the outline rule comes first.
   * Absent: every shot stops on it.
   */
  readonly canShotsFlyOver?: true;
  /**
   * The controller that drives it (architecture 11 §2, a turret's `TurretController`); none for a
   * structure that decides nothing.
   */
  readonly controller?: ControllerId;
  /** The AI profile its controller reads; the controller id by default. */
  readonly aiProfile?: string;
  /**
   * The turret ammo ids it carries, best first (architecture 07 §5 `TurretState`): against a
   * target it loads the first whose `preferredAgainst` fits, so the last one fits any target
   * (`loadTurrets` checks it). A turret has at least one; other structures none.
   */
  readonly ammo?: readonly string[];
};

/** Which lane a spawner's horde takes: the spawner's own lane, or the team's worst lane. */
type SpawnLaneRule = 'own-lane' | 'worst-lane';

/** The fields of a horde wave that are the same as authored and as loaded. */
type SpawnWaveBase = {
  /** The mob definition the horde is made of. */
  readonly mobId: string;
  readonly weightClass: 'light' | 'medium' | 'heavy';
  readonly lane: SpawnLaneRule;
};

/**
 * One repeating horde wave of a spawning structure (DISC-10, architecture 18 §3.1), as authored.
 * Its clock starts when the countdown ends: the first wave goes out `firstAtSeconds` later, then
 * one every `everySeconds` (DEC-87); the horde size comes from `GameConfig.match.hordeSizes`.
 */
export type AuthoredSpawnWave = SpawnWaveBase & {
  /** Seconds from the countdown's end to the first wave. */
  readonly firstAtSeconds: number;
  readonly everySeconds: number;
};

/** A horde wave as loaded (`loadSpawnWaves`): its times in ticks, converted once. */
export type SpawnWaveDefinition = SpawnWaveBase & {
  /** Ticks from the countdown's end to the first wave. */
  readonly firstAtTicks: number;
  readonly everyTicks: number;
};

/**
 * The opening hordes (architecture 18 §3.1, DEC-84): at load-in (tick 0, before the countdown) the
 * `source` structure of each team sends one horde of this mob down every lane, from the lane's
 * base at the team's gate.
 */
export type OpeningWaveDefinition = Pick<SpawnWaveDefinition, 'mobId' | 'weightClass'> & {
  /** The structure kind that sends them: a team without one sends no opening hordes. */
  readonly source: StructureKind;
};

/** One row of a guard plan: which guard, how many, and how a lost SpawnerTower shrinks it. */
export type GuardTableEntry = {
  readonly mobId: string;
  readonly count: number;
  /**
   * `count` guards of this row lost for good per destroyed team structure of kind `perLost`
   * (DISC-21, 07 §8).
   */
  readonly shrink?: { readonly perLost: string; readonly count: number };
};

/** The fields of a guard plan that are the same as authored and as loaded. */
type GuardPlanBase = {
  readonly table: readonly GuardTableEntry[];
  /** How far past the home's edge a guard may chase ("don't leave the tower's perimeter"). */
  readonly leashRadius: number;
  /** Posts stand on a ring this far outside the home's edge. */
  readonly postGap: number;
  /**
   * How far past its leash a guard may stand (`GuardWithinLeashInvariant`): the distance it covers
   * between two decisions plus the farthest it stands from a target in reach.
   */
  readonly leashTolerance: number;
  /**
   * Whether the plan's guards level from their kills and are rallied by the veterancy aura
   * (`VeterancySystem`, 18 MS-16): tower guards (DEC-165), forest-camp mobs (DEC-260) and the
   * capture point boss group (DEC-350).
   */
  readonly canLevel: boolean;
};

/**
 * The defenders one capture-point checkpoint spawns (architecture 07 §7, 18 §7.1): held by
 * `GuardController` with the capture point as home, for the team that owns the point when the
 * checkpoint is reached (`neutral` while no team does). Their leash is the zone's reach (owner,
 * 18 §10 item 4), so it is not content; they never respawn.
 */
export type CheckpointDefenderPlanDefinition = {
  readonly table: readonly Omit<GuardTableEntry, 'shrink'>[];
  /** Posts stand on a ring this far from the zone's centre. */
  readonly postGap: number;
  /** As `GuardPlanDefinition.leashTolerance`. */
  readonly leashTolerance: number;
  /** As `GuardPlanDefinition.canLevel` (DEC-260: owned and neutral defenders level). */
  readonly canLevel: boolean;
};

/**
 * The guards a structure or zone keeps (architecture 07 §6, 18 §7.1): tower guards, a camp's
 * group, or a zone's guards, as authored. Posts are filled while the home stands (a zone always
 * stands). Distances are measured from the home's edge; a zone's edge is its anchor (radius 0).
 */
export type AuthoredGuardPlan = GuardPlanBase & {
  readonly activation: AuthoredGuardActivation;
  readonly respawn: AuthoredGuardRespawn;
};

/** A guard plan as loaded (`loadGuardPlans`): its activation delay and respawn time in ticks. */
export type GuardPlanDefinition = GuardPlanBase & {
  readonly activation: GuardActivation;
  readonly respawn: GuardRespawn;
};

/**
 * When a guard plan's posts are first filled (architecture 18 §7.1), as authored: the match's
 * first tick, or `delaySeconds` after the countdown ends (0 for camps).
 */
type AuthoredGuardActivation =
  { readonly at: 'match-start' } | { readonly at: 'countdown-end'; readonly delaySeconds: number };

/** `AuthoredGuardActivation` as loaded: the delay in ticks. */
type GuardActivation =
  { readonly at: 'match-start' } | { readonly at: 'countdown-end'; readonly delayTicks: number };

/**
 * How a guard plan's posts refill (architecture 18 §7.1), as authored. `each`: a guard comes back
 * `seconds` after it dies (tower guards). `group`: the posts wait until every guard is dead, then
 * all come back `seconds` later and the home is announced cleared (`camp-cleared`, camps).
 * `never`: a dead guard's post stays empty for the rest of the match.
 */
type AuthoredGuardRespawn =
  { readonly kind: 'each' | 'group'; readonly seconds: number } | { readonly kind: 'never' };

/** `AuthoredGuardRespawn` as loaded: the respawn time in ticks. */
type GuardRespawn =
  { readonly kind: 'each' | 'group'; readonly ticks: number } | { readonly kind: 'never' };

/**
 * What the Cathedral gem does to whoever hits it (DEC-292, DEC-346), by status id: the statuses
 * it lands on them (from the environment: the gem is no team's), and how long it glows after.
 */
export type CathedralGemDefinition = {
  /** Landed on a hitter, in order (a stun and its tick damage). */
  readonly statusIds: readonly string[];
  /** The gem glows for this status's duration plus `extraTicks` after each hit. */
  readonly glow: { readonly statusId: string; readonly extraTicks: number };
};

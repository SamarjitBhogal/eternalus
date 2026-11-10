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
  | 'cathedral';

/**
 * A static thing with health: a building, wall, gate, turret, camp or the Cathedral.
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
};

/** Which lane a spawner's horde takes: the spawner's own lane, or the team's worst lane. */
type SpawnLaneRule = 'own-lane' | 'worst-lane';

/**
 * One repeating horde wave of a spawning structure (DISC-10, architecture 18 §3.1). Its clock
 * starts when the countdown ends: the first wave goes out `firstAtSeconds` later, then one every
 * `everySeconds` (DEC-87); the horde size comes from `GameConfig.match.hordeSizes`.
 */
export type SpawnWaveDefinition = {
  /** The mob definition the horde is made of. */
  readonly mobId: string;
  readonly weightClass: 'light' | 'medium' | 'heavy';
  /** Seconds from the countdown's end to the first wave. */
  readonly firstAtSeconds: number;
  readonly everySeconds: number;
  readonly lane: SpawnLaneRule;
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
type GuardTableEntry = {
  readonly mobId: string;
  readonly count: number;
  /**
   * `count` guards of this row lost for good per destroyed team structure of kind `perLost`
   * (DISC-21, 07 §8).
   */
  readonly shrink?: { readonly perLost: string; readonly count: number };
};

/**
 * The guards a structure or zone keeps (architecture 07 §6, 18 §7.1): tower guards, a camp's
 * group, or a zone's guards. Posts are filled while the home stands (a zone always stands).
 * Distances are measured from the home's edge; a zone's edge is its anchor (radius 0).
 */
export type GuardPlanDefinition = {
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
  readonly activation: GuardActivation;
  readonly respawn: GuardRespawn;
};

/**
 * When a guard plan's posts are first filled (architecture 18 §7.1): the match's first tick, or
 * `delaySeconds` after the countdown ends (0 for camps).
 */
type GuardActivation =
  { readonly at: 'match-start' } | { readonly at: 'countdown-end'; readonly delaySeconds: number };

/**
 * How a guard plan's posts refill (architecture 18 §7.1). `each`: a guard comes back `seconds`
 * after it dies (tower guards). `group`: the posts wait until every guard is dead, then all come
 * back `seconds` later and the home is announced cleared (`camp-cleared`, camps). `never`: a dead
 * guard's post stays empty for the rest of the match.
 */
type GuardRespawn =
  { readonly kind: 'each' | 'group'; readonly seconds: number } | { readonly kind: 'never' };

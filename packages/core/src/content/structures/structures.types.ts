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
 * One repeating horde wave of a spawning structure (DISC-10, architecture 18 §3.1). The first
 * wave goes out when the countdown (`GameConfig.match.countdownSeconds`) ends, then one every
 * `everySeconds`; the horde size comes from `GameConfig.match.hordeSizes`.
 */
export type SpawnWaveDefinition = {
  /** The mob definition the horde is made of. */
  readonly mobId: string;
  readonly weightClass: 'light' | 'medium' | 'heavy';
  readonly everySeconds: number;
  readonly lane: SpawnLaneRule;
};

/** The Stronghold's opening hordes (architecture 18 §3.1): what they are made of. */
export type OpeningWaveDefinition = Pick<SpawnWaveDefinition, 'mobId' | 'weightClass'>;

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
 * The guards a structure keeps (architecture 07 §6, 18 §7.1): tower guards, or a camp's group.
 * Posts are filled while the structure stands.
 */
export type GuardPlanDefinition = {
  readonly table: readonly GuardTableEntry[];
  /** How far past the structure's edge a guard may chase ("don't leave the tower's perimeter"). */
  readonly leashRadius: number;
  readonly respawnSeconds: number;
  /** Posts stand on a ring this far outside the structure's edge. */
  readonly postGap: number;
  /** How far past its leash a guard may be between two decisions (`GuardWithinLeashInvariant`). */
  readonly leashTolerance: number;
  /** When the posts are first filled: the match's first tick, or when the countdown ends (camps). */
  readonly activation: 'match-start' | 'countdown-end';
  /**
   * `each`: a guard comes back `respawnSeconds` after it dies (tower guards). `group`: the posts
   * wait until every guard is dead, then all come back `respawnSeconds` later and the home is
   * announced cleared (`camp-cleared`, camps).
   */
  readonly respawn: 'each' | 'group';
};

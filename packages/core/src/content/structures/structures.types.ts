import type { EntityDefinitionBase } from '../EntityDefinition.types';

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

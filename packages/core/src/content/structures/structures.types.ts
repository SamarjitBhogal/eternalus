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

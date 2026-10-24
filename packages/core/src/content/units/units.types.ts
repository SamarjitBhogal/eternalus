import type { EntityDefinitionBase } from '../EntityDefinition.types';

/**
 * How a unit moves. All values must be positive. Content files author speeds per second (the game
 * doc's "N m/s"); `loadDefaultContent` converts them to per tick once, so systems only see ticks
 * (architecture 03 §10, 10 §2).
 */
export type MovementProfile = {
  /** Top speed: metres per second in content files, metres per tick once loaded. */
  readonly maxSpeed: number;
  /** Speed gained while accelerating: m/s² in content files, metres per tick² once loaded. */
  readonly acceleration: number;
  /** How hard the unit is to push (knockback, Sentinel sprint-through). */
  readonly mass: number;
};

/** How an attack is carried out; one `AttackStrategy` per id in `combat/defaultAttackStrategies.ts`. */
export type AttackStrategyId = 'melee';

/**
 * A unit's basic attack (architecture 05 §10, `WeaponAttack`). All values must be positive.
 * ponytail: lives on the unit until weapons land; then `Combat` reads the equipped weapon's attacks.
 */
export type UnitAttack = {
  readonly strategy: AttackStrategyId;
  /** Damage per hit, before damage steps. */
  readonly damage: number;
  /** Reach in metres, measured edge to edge between the two footprints. */
  readonly reach: number;
  /** Time between hits: seconds in content files, ticks once loaded. */
  readonly interval: number;
};

/** What every unit definition (Legend or mob) has. Shared, immutable and keyed by `id`. */
export type UnitDefinition = EntityDefinitionBase & {
  /** Full base health. */
  readonly baseHealth: number;
  /** Collider circle radius in world units. */
  readonly footprintRadius: number;
  /** Sight radius in world units. */
  readonly visionRadius: number;
  readonly movement: MovementProfile;
  /** The basic attack; a unit without one cannot attack (a training dummy). */
  readonly attack?: UnitAttack;
  /** The id of the controller that drives this unit (architecture 11 §2); none for the player. */
  readonly controller?: string;
};

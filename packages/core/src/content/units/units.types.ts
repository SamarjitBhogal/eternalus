import type { ControllerId } from '../ai/ai.types';
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

/**
 * How a unit steers: one `MovementStrategy` per id in `entities/strategies/defaultStrategyRegistry.ts`
 * (architecture 04 §4).
 */
export type MovementStrategyId = 'lane-follow' | 'leashed-chase';

/** How an attack is carried out; one `AttackStrategy` per id in `entities/strategies/defaultStrategyRegistry.ts`. */
export type AttackStrategyId = 'melee' | 'ranged-projectile';

/**
 * How a ranged shot loses damage with distance travelled (05 §10): full damage up to `fullTo`
 * metres, then a straight fall to `floor` (a fraction of the damage) at `floorAt` metres, and
 * `floor` beyond. `fullTo` must be positive and below `floorAt`; `floor` in (0, 1].
 */
export type ProjectileFalloff = {
  readonly fullTo: number;
  readonly floorAt: number;
  readonly floor: number;
};

/** What a ranged attack fires: a projectile definition id and its damage fall-off (`null`: none). */
export type ProjectileLaunch = {
  readonly projectileId: string;
  readonly falloff: ProjectileFalloff | null;
};

/** The fields every basic attack has. All values must be positive. */
type AttackBase = {
  /** Damage per hit, before damage steps. */
  readonly damage: number;
  /** Reach in metres, measured edge to edge between the two footprints. */
  readonly reach: number;
  /** Time between hits: seconds in content files, ticks once loaded. */
  readonly interval: number;
};

/** A hit that lands in the tick it is made. */
export type MeleeAttack = AttackBase & { readonly strategy: 'melee' };

/** A shot: spawns a projectile that lands later (05 §10). `reach` is the distance it is fired from. */
export type RangedAttack = AttackBase & {
  readonly strategy: 'ranged-projectile';
  readonly projectile: ProjectileLaunch;
};

/**
 * Which of a unit's attacks an `attack-target` command uses: `'basic'` (the default, the first
 * attack of its weapon) or `'melee'` (its melee attack, DEC-308). Architecture 05 §10 plans a
 * later `'heavy'`.
 */
export type AttackMode = 'basic' | 'melee';

/**
 * A unit's basic attack (architecture 05 §10, `WeaponAttack`). A mob's attack lives on its
 * definition; a Legend has none and attacks with its weapon (`Legend`).
 */
export type UnitAttack = MeleeAttack | RangedAttack;

/** What every unit definition (Legend or mob) has. Shared, immutable and keyed by `id`. */
export type UnitDefinition = EntityDefinitionBase & {
  /** Full base health. */
  readonly baseHealth: number;
  /** Collider circle radius in world units. */
  readonly footprintRadius: number;
  /** Sight radius in world units. */
  readonly visionRadius: number;
  /** Top speed, acceleration and mass; `movementStrategy` says how the unit steers. */
  readonly movementProfile: MovementProfile;
  /** The strategy that steers this unit each tick; none for a unit nothing steers. */
  readonly movementStrategy?: MovementStrategyId;
  /** The basic attack; a unit without one cannot attack (a training dummy). */
  readonly attack?: UnitAttack;
  /** The controller that drives this unit (architecture 11 §2); none for the player. */
  readonly controller?: ControllerId;
  /** The AI profile its controller reads (`content/ai/profiles/`); the controller id by default. */
  readonly aiProfile?: string;
};

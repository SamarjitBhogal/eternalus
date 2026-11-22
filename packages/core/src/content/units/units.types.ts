import type { ControllerId } from '../ai/ai.types';
import type { AbilityEffectSpec, AuthoredEffectSpec } from '../abilities/AbilityDefinition.types';
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
export type AttackStrategyId = 'melee' | 'melee-sweep' | 'ranged-projectile';

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

/**
 * What a ranged attack fires: a projectile definition id and its damage fall-off (`null`: none).
 */
export type ProjectileLaunch = {
  readonly projectileId: string;
  readonly falloff: ProjectileFalloff | null;
};

/**
 * The fields every basic attack has. All numbers must be positive. `Step` is the type of its
 * `onHit` steps: `AuthoredEffectSpec` as authored (`AuthoredUnitAttack`), `AbilityEffectSpec` once
 * loaded (the default), as a status's `onHit` steps are.
 */
type AttackBase<Step> = {
  /** Damage per hit, before damage steps. */
  readonly damage: number;
  /** Reach in metres, measured edge to edge between the two footprints. */
  readonly reach: number;
  /** Time between hits: seconds in content files, ticks once loaded. */
  readonly interval: number;
  /**
   * Effect steps run on each body the attack strikes, after its damage and before the attacker's
   * statuses' `onHit` steps (05 §10 `WeaponAttack.onHit`; a turret bolt's concussion): times in
   * seconds as authored, in ticks once loaded (`loadWeapons`, `loadTurrets`, DEC-241). Absent =
   * none.
   */
  readonly onHit?: readonly Step[];
};

/** A hit that lands in the tick it is made. */
export type MeleeAttack<Step = AbilityEffectSpec> = AttackBase<Step> & {
  readonly strategy: 'melee';
};

/**
 * A weapon swing (DEC-184): hits every body the area in front of the attacker reaches, not one
 * target. `reach` is the swing's radius from the body edge; `arcDegrees` is the angle of the
 * wedge, authored in degrees (the owner's unit) and in (0, 180] (DEC-304).
 */
export type SweepAttack<Step = AbilityEffectSpec> = AttackBase<Step> & {
  readonly strategy: 'melee-sweep';
  readonly arcDegrees: number;
};

/**
 * A shot: spawns a projectile that lands later (05 §10). `reach` is the distance it is fired from.
 */
export type RangedAttack<Step = AbilityEffectSpec> = AttackBase<Step> & {
  readonly strategy: 'ranged-projectile';
  readonly projectile: ProjectileLaunch;
};

/**
 * Which of a unit's attacks an `attack-target` or `attack-aim` command uses: `'basic'` (the
 * default, the first attack of its weapon) or `'melee'` (its melee attack, DEC-308). Architecture
 * 05 §10 plans a later `'heavy'`.
 */
export type AttackMode = 'basic' | 'melee';

/**
 * A unit's basic attack (architecture 05 §10, `WeaponAttack`). A mob's attack lives on its
 * definition; a Legend has none and attacks with its weapon (`Legend`).
 */
export type UnitAttack<Step = AbilityEffectSpec> =
  MeleeAttack<Step> | SweepAttack<Step> | RangedAttack<Step>;

/**
 * A basic attack as authored: its `onHit` steps' times in seconds. `loadWeapons` and `loadTurrets`
 * load it into a `UnitAttack`.
 */
export type AuthoredUnitAttack = UnitAttack<AuthoredEffectSpec>;

/**
 * A unit's attacks by mode, resolved once at spawn (`attacksByMode`). Every unit has a basic
 * attack.
 */
export type UnitAttacks = Readonly<Partial<Record<AttackMode, UnitAttack>>> & {
  readonly basic: UnitAttack;
};

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

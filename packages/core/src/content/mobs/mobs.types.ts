import type { UnitDefinition } from '../units/units.types';

/** A mob weight class, which is also the entity class that builds the mob. */
export type MobKind = 'light-mob' | 'medium-mob' | 'heavy-mob';

/** A mob (minion or camp unit). Targeting, aggro and rewards are added in Phase 3. */
export type MobDefinition = UnitDefinition & {
  /** The mob weight class, which is also the entity class that builds it. */
  readonly kind: MobKind;
  /** XP a Legend earns for killing this mob (04 §5). Required, so every mob states it. */
  readonly xpValue: number;
};

/**
 * The damage multipliers on a big boss's body parts (DEC-381), each a finite number of at least 1,
 * and how wide the zone behind it is. Only a unit with a body shape (`bodyShape`) gets them.
 */
export type BodyPartBonus = {
  /** A hit whose path starts in the zone behind the boss (`HitPath.origin`; no status tick). */
  readonly backHit: number;
  /**
   * A shot that struck the boss's head (`bodyShape.head`), or whose line of flight, carried on
   * through the body, crosses it (HC-B60 A).
   */
  readonly headShot: number;
  /**
   * The zone behind the boss, in degrees, centred on the side its art shows its back: 180 is the
   * whole rear half. Above 0 and at most 180.
   */
  readonly backZoneDegrees: number;
};

/** The veterancy fields that are the same as authored and as loaded. */
type MinionVeterancyBase = {
  readonly killsPerLevel: number;
  readonly maxLevel: number;
  readonly healthPerLevel: number;
  readonly statusId: string;
};

/** The aura fields that are the same as authored and as loaded. */
type VeterancyAuraBase = {
  readonly statusId: string;
  readonly radius: number;
};

/**
 * How lane minions and tower guards (DEC-165) grow (game doc "Minion XP", MVP-if-time;
 * balancing.md): a level per `killsPerLevel` (a whole number) kills of lane minions, tower guards
 * or camp mobs, or from another source (DEC-168), up to `maxLevel`, each raising max health by
 * `healthPerLevel` of base health and adding a stack of `statusId`; a unit with a level gives
 * `aura.statusId` to the friendly lane minions and tower guards within `aura.radius`, every
 * `aura.everySeconds`. As authored, in seconds.
 */
export type AuthoredMinionVeterancy = MinionVeterancyBase & {
  readonly aura: VeterancyAuraBase & { readonly everySeconds: number };
};

/**
 * The minion veterancy rules as loaded (`loadMinionVeterancy`): the aura's period in ticks,
 * converted once, at least one tick.
 */
export type MinionVeterancyDefinition = MinionVeterancyBase & {
  readonly aura: VeterancyAuraBase & { readonly everyTicks: number };
};

/**
 * Minion strength by distance (architecture 05 §9, DISC-24): `m(t) = clamp(1 + k · (1 − t / c),
 * min, max)` for lane progress `t` from home (0) to the enemy end (1), where `c` is the base-stat
 * point: `basePoint`, moved `shiftPerTowerLost` toward the enemy for each lane tower the enemy has
 * lost on that lane, at most to `maxBasePoint`. Outgoing damage × m, incoming ÷ m; Legends never.
 */
export type MinionStrengthCurve = {
  readonly k: number;
  readonly min: number;
  readonly max: number;
  readonly basePoint: number;
  readonly shiftPerTowerLost: number;
  readonly maxBasePoint: number;
};

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
 * How lane minions grow from kills (game doc "Minion XP", MVP-if-time; balancing.md): a level per
 * `killsPerLevel` mob kills up to `maxLevel`, each raising max health by `healthPerLevel` of base
 * health and adding a stack of `statusId`; a minion with a level gives `aura.statusId` to the
 * friendly minions within `aura.radius`, every `aura.everySeconds`.
 */
export type MinionVeterancyDefinition = {
  readonly killsPerLevel: number;
  readonly maxLevel: number;
  readonly healthPerLevel: number;
  readonly statusId: string;
  readonly aura: {
    readonly statusId: string;
    readonly radius: number;
    readonly everySeconds: number;
  };
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

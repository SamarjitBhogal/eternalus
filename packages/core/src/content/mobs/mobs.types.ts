import type { UnitDefinition } from '../units/units.types';

/** A mob (minion or camp unit). Targeting, aggro and rewards are added in Phase 3. */
export type MobDefinition = UnitDefinition & {
  /** The mob weight class, which is also the entity class that builds it. */
  readonly kind: 'light-mob' | 'medium-mob' | 'heavy-mob';
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

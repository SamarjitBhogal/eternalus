import type { UnitDefinition } from '../units/units.types';

/** A mob (minion or camp unit). Targeting, aggro and rewards are added in Phase 3. */
export type MobDefinition = UnitDefinition & {
  /** The mob weight class, which is also the entity class that builds it. */
  readonly kind: 'light-mob' | 'medium-mob' | 'heavy-mob';
  /** XP a Legend earns for killing this mob (04 §5). Required, so every mob states it. */
  readonly xpValue: number;
};

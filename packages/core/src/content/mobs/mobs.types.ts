import type { UnitDefinition } from '../units/units.types';

/** The mob weight classes. */
export type MobKind = 'light-mob' | 'medium-mob' | 'heavy-mob';

/** A mob (minion or camp unit). Targeting, aggro and rewards are added in Phase 3. */
export type MobDefinition = UnitDefinition & {
  readonly kind: MobKind;
};

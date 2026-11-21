import type { UnitAttacks } from '../content/units/units.types';

/** The attacks a unit's `Combat` uses, and the weapon they come from (`null` for a unit's own attack). */
export type BasicAttack = {
  readonly attacks: UnitAttacks;
  readonly weaponId: string | null;
};

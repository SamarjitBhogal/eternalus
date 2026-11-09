import type { UnitAttack } from '../content/units/units.types';

/** The attack a unit's `Combat` uses, and the weapon it comes from (`null` for a unit's own attack). */
export type BasicAttack = {
  readonly attack: UnitAttack;
  readonly weaponId: string | null;
};

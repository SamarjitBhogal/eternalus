import type { MeleeAttack, UnitAttack } from '../content/units/units.types';

/** The attack a unit's `Combat` uses, and the weapon it comes from (`null` for a unit's own attack). */
export type BasicAttack = {
  readonly attack: UnitAttack;
  readonly weaponId: string | null;
  /** The unit's melee attack when it is not the basic attack (`Combat` derives it otherwise). */
  readonly melee?: MeleeAttack | null;
};

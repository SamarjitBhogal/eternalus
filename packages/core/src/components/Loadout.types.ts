import type { UnitAttacks } from '../content/units/units.types';

/** One weapon a Legend holds: its id and its attacks by mode, loaded once at spawn (`attacksByMode`). */
export type HeldWeapon = {
  readonly weaponId: string;
  readonly attacks: UnitAttacks;
};

import type { LegendKind } from '../legends/legends.types';
import type { AuthoredUnitAttack, UnitAttack } from '../units/units.types';

/** The weapon classes of reference 07 (architecture 05 §10). */
type WeaponClass = 'glove' | 'bow' | 'sword' | 'spear' | 'battle-axe' | 'staff';

/** The fields of a weapon that are the same as authored and as loaded. */
type WeaponBase = {
  readonly id: string;
  readonly displayName: string;
  readonly weaponClass: WeaponClass;
  /** Non-unique weapons are usable by any class (reference 07). */
  readonly allowedClasses: 'any' | readonly LegendKind[];
  /** The class this weapon is unique to, or `null`. */
  readonly uniqueTo: LegendKind | null;
};

/**
 * A weapon as authored (architecture 05 §10). Its attacks have the shape of a unit's basic attack
 * (05 §10: `WeaponAttack` minus `projectile` for a melee attack): `interval` and every `onHit`
 * step's time in seconds. The sketch's other fields join as their systems land (05 §10
 * Implementation status).
 */
export type AuthoredWeaponDefinition = WeaponBase & {
  /** At least one; the first one is the basic attack. */
  readonly attacks: readonly AuthoredUnitAttack[];
};

/**
 * A weapon as loaded (`loadWeapons`): every time in ticks. Shared, immutable and keyed by `id`.
 */
export type WeaponDefinition = WeaponBase & {
  /** At least one; the first one is the basic attack. */
  readonly attacks: readonly UnitAttack[];
};

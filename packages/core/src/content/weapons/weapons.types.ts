import type { LegendKind } from '../legends/legends.types';
import type { UnitAttack } from '../units/units.types';

/** The weapon classes of reference 07 (architecture 05 §10). */
type WeaponClass = 'glove' | 'bow' | 'sword' | 'spear' | 'battle-axe' | 'staff';

/**
 * A weapon (architecture 05 §10). Shared, immutable and keyed by `id`. Its attacks have the shape of
 * a unit's basic attack (05 §10: `WeaponAttack` minus `onHit` and `projectile`); `interval` is
 * seconds in content files and ticks once loaded. The sketch's other fields join as their systems
 * land (05 §10 Implementation status).
 */
export type WeaponDefinition = {
  readonly id: string;
  readonly displayName: string;
  readonly weaponClass: WeaponClass;
  /** At least one; the first one is used until ranged attacks and flex land. */
  readonly attacks: readonly UnitAttack[];
  /** Non-unique weapons are usable by any class (reference 07). */
  readonly allowedClasses: 'any' | readonly LegendKind[];
  /** The class this weapon is unique to, or `null`. */
  readonly uniqueTo: LegendKind | null;
};

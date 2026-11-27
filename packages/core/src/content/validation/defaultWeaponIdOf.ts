import type { UnitDefinition } from '../units/units.types';

/**
 * Reads a unit's default weapon id (`defaultLoadout.primaryWeaponId`, 05 §12), the one place that
 * knows the field, so the default-weapon rules read it alike. Returns `null` when the unit names
 * none (a mob, or a Legend whose content leaves it out: `KnownWeaponRule` flags that).
 *
 * @param definition - A unit definition, as authored.
 */
export const defaultWeaponIdOf = (definition: UnitDefinition): string | null => {
  if (!('defaultLoadout' in definition)) {
    return null;
  }
  const loadout: unknown = definition.defaultLoadout;
  if (typeof loadout !== 'object' || loadout === null || !('primaryWeaponId' in loadout)) {
    return null;
  }
  return typeof loadout.primaryWeaponId === 'string' ? loadout.primaryWeaponId : null;
};

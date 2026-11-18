import type { LoadoutsSliceState } from '../../bridge/slices/loadoutsSlice';
import type { SavedLoadout } from './LoadoutController.types';

/** What loading the saved loadouts came to, before the controller reports it. */
type ResolvedLoadouts = Pick<LoadoutsSliceState, 'saved' | 'repaired'>;

/**
 * Checks each saved loadout against what its class offers (08 "Saved to the profile"). A saved
 * weapon the class does not offer is repaired to the class default and the class is listed in
 * `repaired`. The repository already drops records naming a weapon content no longer has; this
 * catches one that exists but is not this class's to carry. A class content does not have is
 * ignored. Never throws.
 */
export function resolveSavedLoadouts(
  options: LoadoutsSliceState['options'],
  records: ReadonlyMap<string, SavedLoadout>,
): ResolvedLoadouts {
  const saved: Record<string, string> = {};
  const repaired: string[] = [];
  for (const [classId, loadout] of records) {
    const classOptions = options[classId];
    if (classOptions === undefined) continue;
    if (classOptions.weapons.some((weapon) => weapon.id === loadout.primaryWeaponId)) {
      saved[classId] = loadout.primaryWeaponId;
    } else {
      saved[classId] = classOptions.defaultWeaponId;
      repaired.push(classId);
    }
  }
  return { saved, repaired };
}

import {
  autoBuildLoadout,
  type DisplayContent,
  loadoutContentOf,
  validateLoadout,
} from '@eternalus/core';

import type { LoadoutsSliceState } from '../../bridge/slices/loadoutsSlice';

/**
 * What each playable class may take on the Loadout screen (08 "Loadout slots"), from core display
 * content: every weapon `validateLoadout` accepts as the class's primary weapon (in catalogue
 * order), so the choices and the save check are one definition of valid (05 §12), and the weapon
 * core's `autoBuildLoadout` picks, which the screen's Auto-build button applies. The composition
 * root builds it once and injects it into `LoadoutController`.
 */
export function classLoadoutOptions(
  content: Pick<DisplayContent, 'legends' | 'weapons'>,
): LoadoutsSliceState['options'] {
  const rules = loadoutContentOf(content);
  return Object.fromEntries(
    content.legends.map((legend) => [
      legend.id,
      {
        defaultWeaponId: autoBuildLoadout(legend.id, rules).primaryWeaponId,
        weapons: content.weapons
          .filter(
            (weapon) =>
              validateLoadout({ classId: legend.id, primaryWeaponId: weapon.id }, rules).length ===
              0,
          )
          .map(({ id, displayName }) => ({ id, displayName })),
      },
    ]),
  );
}

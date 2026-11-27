import {
  autoBuildLoadout,
  type DisplayContent,
  loadoutContentOf,
  validateLoadout,
} from '@eternalus/core';

import type { LoadoutsSliceState } from '../../bridge/slices/loadoutsSlice';

/**
 * What each Legend may take on the Loadout screen (08 "Loadout slots"), keyed by the Legend's
 * `specId` (DEC-354 (1)), from core display content: every weapon `validateLoadout` accepts as the
 * Legend's primary weapon (in catalogue order), so the choices and the save check are one
 * definition of valid (05 §12), and the weapon core's `autoBuildLoadout` picks, which the screen's
 * Auto-build button applies. Core finds each Legend's class (DEC-418 (2)). The composition root
 * builds it once and injects it into `LoadoutController`.
 */
export function legendLoadoutOptions(
  content: Pick<DisplayContent, 'legends' | 'weapons' | 'specs'>,
): LoadoutsSliceState['options'] {
  const rules = loadoutContentOf(content);
  return Object.fromEntries(
    content.specs.map(({ id }) => {
      const built = autoBuildLoadout(id, rules);
      return [
        id,
        {
          defaultWeaponId: built.primaryWeaponId,
          weapons: content.weapons
            .filter(
              (weapon) =>
                validateLoadout({ ...built, primaryWeaponId: weapon.id }, rules).length === 0,
            )
            .map((weapon) => ({ id: weapon.id, displayName: weapon.displayName })),
        },
      ];
    }),
  );
}

import { type DisplayContent, isWeaponAllowedFor } from '@eternalus/core';

import type { LoadoutsSliceState } from '../../bridge/slices/loadoutsSlice';

/**
 * What each playable class may take on the Loadout screen (08 "Loadout slots"), from core display
 * content: every weapon the class may carry (`isWeaponAllowedFor`, in catalogue order) and its
 * default weapon, the one auto-build picks. The composition root builds it once and injects it
 * into `LoadoutController`.
 */
export function classLoadoutOptions(
  content: Pick<DisplayContent, 'legends' | 'weapons'>,
): LoadoutsSliceState['options'] {
  return Object.fromEntries(
    content.legends.map((legend) => [
      legend.id,
      {
        defaultWeaponId: legend.defaultLoadout.primaryWeaponId,
        weapons: content.weapons
          .filter((weapon) => isWeaponAllowedFor(weapon, legend.id))
          .map(({ id, displayName }) => ({ id, displayName })),
      },
    ]),
  );
}

import { loadoutsSlice } from '../slices/loadoutsSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import type { RootState } from '../store';

/**
 * The display name of the weapon the player will spawn with (SCRUM-31: the choice is shown before
 * the match): the one saved for the picked Legend on the Loadout screen (DEC-354 (1)), else the
 * auto-build weapon, as the match spawns it. `null` before a Legend is picked, or while the game
 * has not published that Legend's loadout options.
 */
export function selectPlayerWeaponName(
  state: Pick<RootState, 'matchSetup' | 'loadouts'>,
): string | null {
  const { specId } = matchSetupSlice.selectors.selectSelection(state);
  if (specId === null) return null;
  const options = loadoutsSlice.selectors.selectLegendOptions(state, specId);
  const weaponId = loadoutsSlice.selectors.selectChosenWeaponId(state, specId);
  return options?.weapons.find((weapon) => weapon.id === weaponId)?.displayName ?? null;
}

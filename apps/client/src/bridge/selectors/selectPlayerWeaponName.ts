import { loadoutsSlice } from '../slices/loadoutsSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import type { RootState } from '../store';

/**
 * The display name of the weapon the player will spawn with (SCRUM-31: the choice is shown before
 * the match): the one saved for the picked class on the Loadout screen, else the class's
 * auto-build weapon, as the match spawns it. `null` before a class is picked, or while the game has
 * not published that class's loadout options.
 */
export function selectPlayerWeaponName(
  state: Pick<RootState, 'matchSetup' | 'loadouts'>,
): string | null {
  const { classId } = matchSetupSlice.selectors.selectSelection(state);
  if (classId === null) return null;
  const options = loadoutsSlice.selectors.selectClassOptions(state, classId);
  const weaponId = loadoutsSlice.selectors.selectChosenWeaponId(state, classId);
  return options?.weapons.find((weapon) => weapon.id === weaponId)?.displayName ?? null;
}

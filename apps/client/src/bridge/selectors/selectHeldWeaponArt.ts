import type { AssetId } from '../catalogue.types';
import { contentSlice } from '../slices/contentSlice';
import { hudSlice } from '../slices/hudSlice';
import type { RootState } from '../store';

/**
 * The art of the weapon the player's Legend holds in the match (its `weaponId` from `hud-state`),
 * from the HUD catalogue's `weaponArt` (DEC-354 (2)). `null`, an empty slot, while no `hud-state`
 * has come, when the Legend holds no weapon, or when the held weapon has no art.
 */
export function selectHeldWeaponArt(state: Pick<RootState, 'content' | 'hud'>): AssetId | null {
  const weaponId = hudSlice.selectors.selectWeaponId(state);
  if (weaponId === null) return null;
  return contentSlice.selectors.selectHudCatalogue(state).weaponArt[weaponId] ?? null;
}

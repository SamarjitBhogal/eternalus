import { describe, expect, it } from 'vitest';

import { FIGMA_HUD_PLAYER, TEST_HUD_CATALOGUE } from '../__fixtures__/hudFixtures';
import { contentSlice } from '../slices/contentSlice';
import { hudSlice } from '../slices/hudSlice';
import { createAppStore } from '../store';
import { selectHeldWeaponArt } from './selectHeldWeaponArt';

/** A store with the HUD catalogue and a player holding `weaponId` (no player for `undefined`). */
function stateWith(weaponId: string | null | undefined) {
  const store = createAppStore();
  store.dispatch(
    contentSlice.actions.catalogueLoaded({
      ...contentSlice.getInitialState(),
      hud: TEST_HUD_CATALOGUE,
    }),
  );
  if (weaponId !== undefined) {
    store.dispatch(hudSlice.actions.hudStateChanged({ ...FIGMA_HUD_PLAYER, weaponId }));
  }
  return store.getState();
}

describe('selectHeldWeaponArt', () => {
  it("is the art of the weapon the player's Legend holds (DEC-354 (2))", () => {
    expect(selectHeldWeaponArt(stateWith('wuuthrad'))).toBe('warrior-weapon-battle-axe');
    expect(selectHeldWeaponArt(stateWith('magus-staff'))).toBe('magus-weapon-staff');
  });

  it('is an empty slot for a weapon without art, no weapon, or before the first hud-state', () => {
    expect(selectHeldWeaponArt(stateWith('raptor-talons'))).toBeNull();
    expect(selectHeldWeaponArt(stateWith(null))).toBeNull();
    expect(selectHeldWeaponArt(stateWith(undefined))).toBeNull();
  });
});

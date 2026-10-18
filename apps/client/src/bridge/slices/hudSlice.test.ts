import { describe, expect, it } from 'vitest';

import { FIGMA_HUD_PLAYER } from '../hudFixtures';
import type { PlayerHudSnapshot } from '../hud.types';
import { hudSlice } from './hudSlice';

const { hudStateChanged, announced, reset } = hudSlice.actions;
const {
  selectHealth,
  selectMaxHealth,
  selectAether,
  selectMaxAether,
  selectLevel,
  selectXpFraction,
  selectWeaponProgress,
  selectUltimatePips,
  selectSlotStatus,
  selectUltimateCharge,
} = hudSlice.selectors;

const withPlayer = (player: PlayerHudSnapshot | null) => ({
  hud: hudSlice.reducer(undefined, hudStateChanged(player)),
});

describe('hudSlice', () => {
  it('starts with no player and no announcements', () => {
    expect(hudSlice.getInitialState()).toEqual({ player: null, announcements: [] });
  });

  it('keeps the announcements when a new snapshot arrives, and resets to the initial state', () => {
    let hud = hudSlice.reducer(undefined, announced({ id: 'a', text: 'First blood' }));
    hud = hudSlice.reducer(hud, hudStateChanged(FIGMA_HUD_PLAYER));
    expect(hud.player).toBe(FIGMA_HUD_PLAYER);
    expect(hud.announcements).toEqual([{ id: 'a', text: 'First blood' }]);
    expect(hudSlice.reducer(hud, reset())).toEqual(hudSlice.getInitialState());
  });

  it('selects null for every value before the first snapshot', () => {
    const state = { hud: hudSlice.getInitialState() };
    for (const select of [
      selectHealth,
      selectMaxHealth,
      selectAether,
      selectMaxAether,
      selectLevel,
      selectXpFraction,
      selectWeaponProgress,
      selectUltimatePips,
      selectUltimateCharge,
    ]) {
      expect(select(state)).toBeNull();
    }
    expect(selectSlotStatus(state, 'ability-1')).toBeNull();
  });

  it('selects the Figma values from the Figma snapshot', () => {
    const state = withPlayer(FIGMA_HUD_PLAYER);
    expect([selectHealth(state), selectMaxHealth(state)]).toEqual([1850, 2220]);
    expect([selectAether(state), selectMaxAether(state)]).toEqual([4700, 5640]);
    expect(selectLevel(state)).toBe(42);
    expect(selectXpFraction(state)).toBe(0.699);
    expect(selectWeaponProgress(state)).toBe(5 / 6);
    expect(selectUltimatePips(state)).toEqual({ filled: 2, total: 3 });
    expect(selectUltimateCharge(state)).toBe(5 / 6);
    expect(selectSlotStatus(state, 'gadget-1')).toMatchObject({ slot: 'gadget-1', isReady: false });
  });

  it('reads the XP fraction as null without a usable value, and clamps it to 1', () => {
    const fraction = (xp: number | null, xpToNext: number | null) =>
      selectXpFraction(withPlayer({ ...FIGMA_HUD_PLAYER, xp, xpToNext }));
    expect(fraction(699, 1000)).toBe(0.699);
    expect(fraction(699, 0)).toBeNull();
    expect(fraction(null, 1000)).toBeNull();
    expect(fraction(699, null)).toBeNull();
    expect(fraction(1200, 1000)).toBe(1);
  });

  it('has no slot status or ultimate charge for a player without slot runtimes', () => {
    const state = withPlayer({ ...FIGMA_HUD_PLAYER, slots: [] });
    expect(selectSlotStatus(state, 'ability-4')).toBeNull();
    expect(selectUltimateCharge(state)).toBeNull();
  });
});

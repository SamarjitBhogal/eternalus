import { describe, expect, it } from 'vitest';

import type { AbilitySlotStatus } from '../hud.types';
import { FIGMA_HUD_PLAYER, TEST_HUD_CATALOGUE } from '../hudFixtures';
import { classCardFixture } from '../catalogueFixtures';
import { contentSlice } from '../slices/contentSlice';
import { hudSlice } from '../slices/hudSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import { matchSlice } from '../slices/matchSlice';
import { createAppStore } from '../store';
import { selectHudSlotView } from './selectHudSlotView';

const KIT = {
  emblemAssetId: null,
  weapon: null,
  slots: [
    { slot: 'ability-1', displayName: 'Cleave', iconAssetId: 'icon-placeholder-atom' },
    { slot: 'gadget-1', displayName: null, iconAssetId: null },
  ],
} as const;

/** A store with the warrior kit picked and `slots` as the player's runtime entries. */
function storeWith(slots: readonly AbilitySlotStatus[] | null) {
  const store = createAppStore();
  store.dispatch(
    contentSlice.actions.catalogueLoaded({
      ...contentSlice.getInitialState(),
      legendClasses: [classCardFixture({ classId: 'warrior', hud: KIT })],
      hud: TEST_HUD_CATALOGUE,
    }),
  );
  store.dispatch(matchSetupSlice.actions.select({ classId: 'warrior', specId: null }));
  if (slots !== null) {
    store.dispatch(hudSlice.actions.hudStateChanged({ ...FIGMA_HUD_PLAYER, slots }));
  }
  return store;
}

const status = (changes: Partial<AbilitySlotStatus>): AbilitySlotStatus => ({
  slot: 'ability-1',
  abilityId: null,
  cooldownRemainingTicks: 0,
  cooldownTicks: 0,
  charge: null,
  isReady: false,
  blockedBy: null,
  ...changes,
});

describe('selectHudSlotView', () => {
  it('joins the kit art with no runtime as the no-data look', () => {
    const view = selectHudSlotView(storeWith(null).getState(), 'ability-1');
    expect(view).toEqual({
      displayName: 'Cleave',
      iconAssetId: 'icon-placeholder-atom',
      look: 'no-data',
      cooldownFraction: null,
      blockedBy: null,
    });
  });

  it('is the gold-glow ready look when the slot is ready (OD-9)', () => {
    const state = storeWith([status({ isReady: true })]).getState();
    expect(selectHudSlotView(state, 'ability-1')).toMatchObject({
      look: 'ready',
      cooldownFraction: null,
    });
  });

  it('fills the red cooldown look by the share of the cooldown still to run', () => {
    const at = (remaining: number, total: number) =>
      selectHudSlotView(
        storeWith([
          status({
            cooldownRemainingTicks: remaining,
            cooldownTicks: total,
            blockedBy: 'on-cooldown',
          }),
        ]).getState(),
        'ability-1',
      );
    expect(at(300, 300)).toMatchObject({ look: 'cooldown', cooldownFraction: 1 });
    expect(at(75, 300)).toMatchObject({ look: 'cooldown', cooldownFraction: 0.25 });
    expect(at(400, 300).cooldownFraction).toBe(1);
    expect(at(5, 0).cooldownFraction).toBe(1);
    expect(at(75, 300).blockedBy).toBe('on-cooldown');
  });

  it('is idle when the slot is neither ready nor cooling down, keeping the reason', () => {
    const state = storeWith([status({ blockedBy: 'not-enough-aether' })]).getState();
    expect(selectHudSlotView(state, 'ability-1')).toMatchObject({
      look: 'idle',
      cooldownFraction: null,
      blockedBy: 'not-enough-aether',
    });
  });

  it('shows the Figma state: abilities 1–3 and gadget-1 cooling at fraction 1, the rest ready', () => {
    const state = storeWith(FIGMA_HUD_PLAYER.slots).getState();
    const looks = (
      ['ability-1', 'ability-2', 'ability-3', 'ability-4', 'gadget-1', 'gadget-2'] as const
    )
      .map((slot) => selectHudSlotView(state, slot))
      .map(({ look, cooldownFraction }) => [look, cooldownFraction]);
    expect(looks).toEqual([
      ['cooldown', 1],
      ['cooldown', 1],
      ['cooldown', 1],
      ['ready', null],
      ['cooldown', 1],
      ['ready', null],
    ]);
  });

  it('has no art for a slot the kit lacks, and returns the same view after an unrelated dispatch', () => {
    const store = storeWith(FIGMA_HUD_PLAYER.slots);
    const before = selectHudSlotView(store.getState(), 'ability-2');
    expect(before).toMatchObject({ displayName: null, iconAssetId: null });
    store.dispatch(matchSlice.actions.clockChanged({ tick: 30, seconds: 1 }));
    expect(selectHudSlotView(store.getState(), 'ability-2')).toBe(before);
  });
});

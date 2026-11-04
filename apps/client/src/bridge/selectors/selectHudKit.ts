import { createSelector } from '@reduxjs/toolkit';

import type { ClassHudDisplay } from '../catalogue.types';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import type { RootState } from '../store';
import { selectSelectedClassCard } from './selectSelectedClassCard';

/**
 * The HUD kit of the class the player picked (emblem, weapon art, slot icons): the selection,
 * fixed for the whole match, joined with the catalogue (05 §15). A picked Legend with its own
 * start-weapon art shows it in place of the class kit's (DEC-114). `null` before a pick and for a
 * class without a kit (a locked class is never played). Memoised: the same pick returns the same
 * object.
 */
export const selectHudKit = createSelector(
  [
    selectSelectedClassCard,
    (state: Pick<RootState, 'content' | 'matchSetup'>) =>
      matchSetupSlice.selectors.selectSelection(state).specId,
  ],
  (card, specId): ClassHudDisplay | null => {
    if (card?.hud === undefined || card.hud === null) return null;
    const weapon = card.specs.find((spec) => spec.specId === specId)?.hudWeapon ?? null;
    return weapon === null ? card.hud : { ...card.hud, weapon };
  },
);

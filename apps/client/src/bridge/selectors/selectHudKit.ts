import { createSelector } from '@reduxjs/toolkit';

import type { HudSlotId } from '../Binding.types';
import type { ClassHudDisplay } from '../catalogue.types';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import type { RootState } from '../store';
import { selectSelectedClassCard } from './selectSelectedClassCard';

/**
 * The HUD kit of the class the player picked (emblem, weapon art, slot icons): the selection,
 * fixed for the whole match, joined with the catalogue (05 §15). A picked Legend with its own
 * start-weapon art shows it in place of the class kit's (DEC-114). The slots' names are the
 * Legend's kit (DEC-199: ability-1 to 3 and the ultimate on ability-4); a slot the kit does not fill
 * keeps the class's. `null` before a pick and for a class without a kit (a locked class is never
 * played). Memoised: the same pick returns the same object.
 */
export const selectHudKit = createSelector(
  [
    selectSelectedClassCard,
    (state: Pick<RootState, 'content' | 'matchSetup'>) =>
      matchSetupSlice.selectors.selectSelection(state).specId,
  ],
  (card, specId): ClassHudDisplay | null => {
    if (card?.hud === undefined || card.hud === null) return null;
    const spec = card.specs.find((candidate) => candidate.specId === specId);
    const kitNames = new Map<HudSlotId, string>(
      (spec?.details ?? []).flatMap(({ kit }) =>
        kit === undefined ? [] : [[kit.slot, kit.displayName]],
      ),
    );
    const weapon = spec?.hudWeapon ?? null;
    if (kitNames.size === 0 && weapon === null) return card.hud;
    const slots = card.hud.slots.map((entry) => ({
      ...entry,
      displayName: kitNames.get(entry.slot) ?? entry.displayName,
    }));
    return { ...card.hud, slots, weapon: weapon ?? card.hud.weapon };
  },
);

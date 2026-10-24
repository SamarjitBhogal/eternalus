import { createSelector, weakMapMemoize } from '@reduxjs/toolkit';

import type { AssetId, DetailRow, LegendClassCard } from '../catalogue.types';
import type { LegendClassId } from '../domain.types';
import { legendNameFor } from '../legendNames';
import { contentSlice } from '../slices/contentSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';
import type { RootState } from '../store';

/** One mini card of the class panel's Legends strip (72:786), in content order. */
export type LegendStripItem = {
  readonly key: string;
  /** The Legend's name for the player's team, else its sub-class title (I-83). */
  readonly name: string;
  readonly miniAssetId: AssetId | null;
};

/** What the class step's left panel shows for one class, with the layout's overrides applied. */
export type ClassPanel = {
  readonly card: LegendClassCard;
  readonly description: string | null;
  /** Signature, proficiency, specialty (72:757, 62:94). */
  readonly details: readonly DetailRow[];
  readonly legendStrip: readonly LegendStripItem[];
};

/**
 * The panel of `classId` for the catalogue's class-step layout (O5): `layoutOverrides[layout]`
 * replaces the description and the detail rows it names (62:70 keeps its older copy and icons);
 * the Legends strip names each Legend for the player's team, or by its title when it has no name
 * (OA3). `undefined` for a class the catalogue lacks. Memoised per class id (weakMapMemoize), so
 * a countdown tick or a preview of another class keeps the same object.
 */
export const selectClassPanel = createSelector(
  [
    contentSlice.selectors.selectLegendClasses,
    contentSlice.selectors.selectClassSelectLayout,
    matchSetupSlice.selectors.selectPlayerTeam,
    (_state: Pick<RootState, 'content' | 'matchSetup'>, classId: LegendClassId | null) => classId,
  ],
  (classes, layout, team, classId): ClassPanel | undefined => {
    const card = classes.find((candidate) => candidate.classId === classId);
    if (card === undefined) return undefined;
    const override = card.layoutOverrides[layout];
    return {
      card,
      description: override?.description === undefined ? card.description : override.description,
      details: override?.details ?? card.details,
      legendStrip: card.specs.map((spec) => ({
        key: spec.specId,
        name: legendNameFor(spec.legendName, team) ?? spec.displayName,
        miniAssetId: spec.art.mini,
      })),
    };
  },
  { memoize: weakMapMemoize, argsMemoize: weakMapMemoize },
);

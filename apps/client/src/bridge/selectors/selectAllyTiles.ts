import { createSelector } from '@reduxjs/toolkit';

import type { AssetId, ColourToken, LegendClassCard } from '../catalogue.types';
import type { LegendClassId } from '../domain.types';
import type { RosterEntry } from '../events';
import { contentSlice } from '../slices/contentSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';

/** One roster tile of the selection screens (62:201, 58:342), in roster order. */
export type AllyTile = {
  readonly legendId: string;
  readonly displayName: string;
  readonly isPlayer: boolean;
  /** The player's own pick (`null` before one); a bot's roster class. */
  readonly classId: LegendClassId | null;
  /** The class's display name from the catalogue; `null` with no class or one it lacks. */
  readonly classDisplayName: string | null;
  readonly specId: string | null;
  /** `legend`: a Legend is picked (portrait); `class`: a class only (sigil); `undecided`: no pick. */
  readonly state: 'undecided' | 'class' | 'legend';
  /** The Legend's portrait, else the class sigil (a Legend without one shows its class's). */
  readonly imageAssetId: AssetId | null;
  /** The Legend's accent once one is picked, else the class accent; `null` while undecided. */
  readonly accentToken: ColourToken | null;
};

function toTile(
  entry: RosterEntry,
  pick: { readonly classId: LegendClassId | null; readonly specId: string | null },
  classes: readonly LegendClassCard[],
): AllyTile {
  const card = classes.find((candidate) => candidate.classId === pick.classId);
  const spec = card?.specs.find((candidate) => candidate.specId === pick.specId);
  const state = pick.classId === null ? 'undecided' : spec === undefined ? 'class' : 'legend';
  return {
    legendId: entry.legendId,
    displayName: entry.displayName,
    isPlayer: entry.isPlayer,
    classId: pick.classId,
    classDisplayName: card?.displayName ?? null,
    specId: spec?.specId ?? null,
    state,
    imageAssetId: spec?.art.portrait ?? card?.art.sigil ?? null,
    accentToken: spec?.accentToken ?? card?.accentToken ?? null,
  };
}

/**
 * The allied roster as tiles (HC-F3, CD-07): each bot's class and Legend from the roster, the
 * player's from the session's selection; memoised on the roster, the selection and the catalogue,
 * so a countdown tick keeps the same array.
 */
export const selectAllyTiles = createSelector(
  [
    matchSetupSlice.selectors.selectAllies,
    matchSetupSlice.selectors.selectSelection,
    contentSlice.selectors.selectLegendClasses,
  ],
  (allies, selection, classes): readonly AllyTile[] =>
    allies.map((entry) => toTile(entry, entry.isPlayer ? selection : entry, classes)),
);

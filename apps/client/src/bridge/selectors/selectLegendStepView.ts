import { createSelector } from '@reduxjs/toolkit';

import type {
  AssetId,
  ColourToken,
  DetailRow,
  LegendSpecCard,
  RoleRatingAxis,
} from '../catalogue.types';
import type { LegendClassId, PlayableTeam } from '../domain.types';
import { legendNameFor } from '../legendNames';
import { canConfirmSelection, isSelectableSpec } from '../selectionRules';
import { contentSlice } from '../slices/contentSlice';
import { matchSetupSlice } from '../slices/matchSetupSlice';

/** The rating bars top to bottom (58:323: Damage, Support, Control). */
const RATING_AXIS_ORDER: readonly RoleRatingAxis[] = ['damage', 'support', 'control'];

/** One rating bar of the Legend step: its axis and the Legend's value, `null` while unrated. */
type LegendRatingView = { readonly axis: RoleRatingAxis; readonly value: number | null };

/** One Legend card of the Legend step (55:267 …), in content order. */
export type LegendCardView = {
  readonly specId: string;
  /** The sub-class title ("Oracle"), the same on both teams (DEC-49). */
  readonly subClassName: string;
  /** The Legend's name as the player's team knows it (DEC-49); `null` shows the title alone. */
  readonly legendName: string | null;
  readonly roleLabel: string | null;
  readonly description: string | null;
  readonly accentToken: ColourToken;
  readonly isAvailable: boolean;
  readonly isPicked: boolean;
  readonly cardArtAssetId: AssetId | null;
  /** Its own refraction art, else the card art (61:8 vs 61:14 / 61:20). */
  readonly refractionArtAssetId: AssetId | null;
  /** Figma's render of the row with this Legend picked (CD-16); `null` = live halo and glows. */
  readonly rowPlateAssetId: AssetId | null;
  readonly details: readonly DetailRow[];
  /** One per axis, in `RATING_AXIS_ORDER`. */
  readonly ratings: readonly LegendRatingView[];
};

/** The Legend step: the picked class and its Legends (58:271). */
export type LegendStepView = {
  readonly classId: LegendClassId;
  readonly classDisplayName: string;
  readonly legends: readonly LegendCardView[];
  readonly pickedSpecId: string | null;
  /** LOCK IN is enabled (`canConfirmSelection`, 13 §10). */
  readonly canLockIn: boolean;
};

function toCardView(
  spec: LegendSpecCard,
  pickedSpecId: string | null,
  team: PlayableTeam | null,
): LegendCardView {
  return {
    specId: spec.specId,
    subClassName: spec.displayName,
    legendName: legendNameFor(spec.legendName, team),
    roleLabel: spec.roleLabel,
    description: spec.description,
    accentToken: spec.accentToken,
    isAvailable: isSelectableSpec(spec),
    isPicked: spec.specId === pickedSpecId,
    cardArtAssetId: spec.art.card,
    refractionArtAssetId: spec.art.refraction ?? spec.art.card,
    rowPlateAssetId: spec.art.rowPlate,
    details: spec.details,
    ratings: RATING_AXIS_ORDER.map((axis) => ({ axis, value: spec.ratings?.[axis] ?? null })),
  };
}

/**
 * The Legend step's view model, or `null` on the class step (no class picked) and for a class
 * the catalogue lacks. Names resolve for the player's team (DEC-49). Memoised on the catalogue, the
 * selection and the team, so a countdown tick keeps the same object.
 */
export const selectLegendStepView = createSelector(
  [
    contentSlice.selectors.selectLegendClasses,
    matchSetupSlice.selectors.selectSelection,
    matchSetupSlice.selectors.selectPlayerTeam,
  ],
  (classes, selection, team): LegendStepView | null => {
    const card = classes.find((candidate) => candidate.classId === selection.classId);
    if (card === undefined) return null;
    const pickedSpecId = card.specs.some((spec) => spec.specId === selection.specId)
      ? selection.specId
      : null;
    return {
      classId: card.classId,
      classDisplayName: card.displayName,
      legends: card.specs.map((spec) => toCardView(spec, pickedSpecId, team)),
      pickedSpecId,
      canLockIn: canConfirmSelection(card, { classId: card.classId, specId: selection.specId }),
    };
  },
);

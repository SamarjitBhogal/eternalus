import { createSelector } from '@reduxjs/toolkit';

import type { RenditionKey } from '../catalogue.types';
import type { HudAllegiance } from '../hud.types';
import { assetsSlice } from '../slices/assetsSlice';
import { contentSlice } from '../slices/contentSlice';
import type { RootState } from '../store';

/** The URL of the flag mask per holder, `null` until loaded or without a flag. */
export type AllegianceFlagUrls = Readonly<Record<HudAllegiance, string | null>>;

/**
 * The flag file per holder (CD-03, 13 §7: ownership never by colour alone): ours upright, theirs
 * the `mirrored` rendition (it sits to the shield's left), none when neutral.
 */
const FLAG_RENDITION: Readonly<
  Record<HudAllegiance, { readonly rendition?: RenditionKey } | null>
> = {
  ours: {},
  theirs: { rendition: 'mirrored' },
  neutral: null,
};

const selectFlagAssetId = (state: RootState) =>
  contentSlice.selectors.selectHudCatalogue(state).chrome?.allegianceFlagAssetId ?? null;

/** The URL of the flag `allegiance` shows: a string, so the object below is rebuilt only on a change. */
const flagUrlOf =
  (allegiance: HudAllegiance) =>
  (state: RootState): string | null => {
    const flag = FLAG_RENDITION[allegiance];
    return flag === null
      ? null
      : assetsSlice.selectors.selectAssetUrl(state, selectFlagAssetId(state), flag.rendition);
  };

/**
 * The allegiance flag's URL per holder, from the HUD chrome's flag asset. Memoised on the three
 * URLs, so a publish that leaves them unchanged returns the same object.
 */
export const selectAllegianceFlagUrls = createSelector(
  [flagUrlOf('ours'), flagUrlOf('theirs'), flagUrlOf('neutral')],
  (ours, theirs, neutral): AllegianceFlagUrls => ({ ours, theirs, neutral }),
);

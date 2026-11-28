import { createSelector } from '@reduxjs/toolkit';

import type { RenditionKey } from '../catalogue.types';
import type { HudAllegiance } from '../hud.types';
import { assetsSlice } from '../slices/assetsSlice';
import { contentSlice } from '../slices/contentSlice';
import type { RootState } from '../store';

/** The URL of the flag mask per holder, `null` until loaded or without a flag. */
export type AllegianceFlagUrls = Readonly<Record<HudAllegiance, string | null>>;

const selectFlagAssetId = (state: RootState) =>
  contentSlice.selectors.selectHudCatalogue(state).chrome?.allegianceFlagAssetId ?? null;

/** The flag's URL (with `rendition`): a string, so the object below is rebuilt only on a change. */
const flagUrl =
  (rendition?: RenditionKey) =>
  (state: RootState): string | null =>
    assetsSlice.selectors.selectAssetUrl(state, selectFlagAssetId(state), rendition);

/**
 * The allegiance flag's URL per holder, from the HUD chrome's flag asset (CD-03, 13 §7: ownership
 * never by colour alone): ours upright, theirs the `mirrored` rendition (it sits to the shield's
 * left), none when neutral. Memoised on the two URLs, so a publish that leaves them unchanged
 * returns the same object.
 */
export const selectAllegianceFlagUrls = createSelector(
  [flagUrl(), flagUrl('mirrored')],
  (ours, theirs): AllegianceFlagUrls => ({ ours, theirs, neutral: null }),
);

import { contentSlice } from '../slices/contentSlice';
import { hudSlice } from '../slices/hudSlice';
import type { RootState } from '../store';

/**
 * The HUD prompt for the ability a status grants the Legend (Fury's dash): its display name from
 * the catalogue, or `null` while nothing is granted (the prompt is then hidden). A granted id the
 * catalogue does not know shows no prompt, since it has no name to show.
 */
export const selectGrantedPrompt = (state: RootState): string | null => {
  const id = hudSlice.selectors.selectGrantedAbilityId(state);
  return id === null
    ? null
    : (contentSlice.selectors.selectAbility(state, id)?.displayName ?? null);
};

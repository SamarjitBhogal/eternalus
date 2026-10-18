import { createSelector } from '@reduxjs/toolkit';

import { isSelectableClass } from '../selectionRules';
import { contentSlice } from '../slices/contentSlice';

/** The classes a player or bot may take, in catalogue order (locked classes left out); memoised. */
export const selectSelectableClasses = createSelector(
  [contentSlice.selectors.selectLegendClasses],
  (legendClasses) => legendClasses.filter(isSelectableClass),
);

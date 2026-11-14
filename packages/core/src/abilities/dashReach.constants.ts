/**
 * Halvings of the dash's reach while searching where `WorldMap.isLineClear` stops it: 16 puts the
 * end within distance / 65536 of the last clear point (8 m: about 0.1 mm), at 16 line tests per
 * blocked dash.
 */
export const REACH_SEARCH_STEPS = 16;

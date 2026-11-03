/**
 * Where a retreating bot laner goes (architecture 11 §4.2, `Survive`: "the nearest allied tower
 * or the Stronghold"): the map feature kinds it may fall back to.
 */
export const RETREAT_STRUCTURES: readonly string[] = ['stronghold', 'spawner-tower', 'buff-tower'];

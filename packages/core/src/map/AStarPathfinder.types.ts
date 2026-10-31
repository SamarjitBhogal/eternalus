/** How hard one A\* search may work (architecture 10 §9; `GameConfig.map`). */
export type AStarLimits = {
  /** At most this many cells settle in one search. */
  readonly maxExpansions: number;
  /** A blocked start or goal moves to the nearest open cell at most this many cells away. */
  readonly snapCells: number;
};

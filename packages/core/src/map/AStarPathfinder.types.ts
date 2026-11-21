/** How hard one A\* search may work (architecture 10 §9; `GameConfig.map`). */
export type AStarLimits = {
  /**
   * At most this much ground, in square world units (m²), settles in one search. The pathfinder
   * turns it into cells of its own grid, so a change of cell size keeps the reach (DEC-243).
   */
  readonly maxSearchArea: number;
  /** A blocked start or goal moves to the nearest open cell at most this many cells away. */
  readonly snapCells: number;
};

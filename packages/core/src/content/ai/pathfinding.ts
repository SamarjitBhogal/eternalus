/**
 * The most grid cells one A\* search may settle (architecture 10 §9, 11 §6 cost control); past it
 * the bot is told there is no way and walks straight. About a tenth of today's ~58k-cell grid.
 */
export const ASTAR_MAX_EXPANSIONS = 6000; // TUNE: no reference value; a cost cap, not gameplay

/**
 * The way out of one blocked cell, as cell indexes: the next cell of the way and, when the way is
 * 2 steps long, its open cell (else the same as `next`); both -1 when there is no way.
 */
export type ExitWay = { next: number; end: number };

/** Searches the way out of blocked `cell` and writes it into `out` (`AStarPathfinder`'s search). */
export type ExitSearch = (cell: number, out: ExitWay) => void;

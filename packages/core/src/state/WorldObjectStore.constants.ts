/**
 * Side of one cell of the grid that `WorldObjectStore.blockingAt` searches, in world units. The
 * grid only skips far objects, so this size never changes an answer for an object with a finite
 * box (all authored content). An object whose box is not finite is not in the grid.
 */
export const BLOCKING_CELL_SIZE = 32;

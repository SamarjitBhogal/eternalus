import type { Rect } from '../utils/geometry.types';

/** What decides which cells of a lane's field are corridor, besides the lane itself. */
export type LaneCorridor = {
  /** How far from the lane, in world units, the corridor reaches. */
  readonly halfWidth: number;
  /** Ground the corridor never holds: the lane tower forts' north and south wall bands. */
  readonly closed: readonly Rect[];
};

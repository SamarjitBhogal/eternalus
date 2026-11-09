import type { LaneFlowFields } from '../map/LaneFlowFields';
import type { Rect } from '../utils/geometry.types';

/** The match's ground as `PathingSystem` steers over it. */
export type PathingWorld = {
  /**
   * The lane flow fields (06 §6), which `PathingSystem` also rebuilds within
   * `config.map.flowFieldCellBudget` each tick; without them mobs steer straight to their targets.
   */
  readonly flowFields?: LaneFlowFields | null;
  /**
   * The box of the `Footprint` of every structure that `hasFortBox` (a lane tower's fort; the
   * Stronghold's palace box is a fort box for the chase, DEC-217 (16)), read once when the match is
   * built, so a fort keeps its box whatever falls later and whenever the first chase comes.
   */
  readonly forts?: readonly Rect[];
};

/**
 * How a mob on blocked ground inside a fort box moves this tick (DEC-217 (15)): as it would
 * anywhere (`stay`: it is not in a court, or it chases a target inside the same box, DEC-185), to
 * its `ChaseWatch` waypoint (`waypoint`), or by the court's way out (`exit`); the last two steer
 * by no lane field.
 */
export type CourtMove = 'stay' | 'waypoint' | 'exit';

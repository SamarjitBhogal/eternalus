import type { Vec2 } from '../utils/geometry.types';

/** What a lane shape needs to trace one lane's Light half. */
export type LaneTraceInput = {
  readonly stronghold: Vec2;
  readonly centreX: number;
  /** How far the lane sits from the Stronghold's row where it crosses the centre line. */
  readonly lateralOffset: number;
  readonly ringRadius: number;
};

/** Strategy that decides a lane's route. New lane styles are new classes (OCP). */
export interface LaneShape {
  /**
   * The Light half of a lane: from its gate on the wall ring to the centre line, x never
   * decreasing. The generator mirrors it for the Dark half.
   */
  traceLightHalf(input: LaneTraceInput): readonly Vec2[];
}

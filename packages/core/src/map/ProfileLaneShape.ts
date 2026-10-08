import type { LaneKnot } from '../content/maps/maps.types';
import { distance, polarPoint } from '../utils/geometry';
import type { Vec2 } from '../utils/geometry.types';
import type { LaneShape, LaneTraceInput } from './LaneShape.types';

/**
 * Traces lanes as straight segments through a list of bends (`LaneKnot`s) shared by every lane
 * and scaled by each lane's sideways offset. One bend is the MVP straight lane; a preset's
 * traced bends give the hand-drawn look without fixing the number of lanes.
 */
export class ProfileLaneShape implements LaneShape {
  private readonly knots: readonly LaneKnot[];

  /** Creates a shape from bends ordered by `u`, each with `0 < u < 1`. */
  public constructor(knots: readonly LaneKnot[]) {
    this.knots = knots;
  }

  /**
   * The gate on the wall ring, a point straight out of it (`apron` further along the exit
   * angle, so the lane clears the gate's turrets), every bend beyond the apron that moves the
   * lane further east, then the centre-line crossing. x never decreases, as `LaneShape` requires.
   */
  public traceLightHalf(input: LaneTraceInput): readonly Vec2[] {
    const { stronghold, centreX, lateralOffset, ringRadius, exitAngle, apron } = input;
    const span = centreX - stronghold.x;
    const gate = polarPoint(stronghold, ringRadius, exitAngle);
    const exit = polarPoint(stronghold, ringRadius + apron, exitAngle);
    const centre = { x: centreX, y: stronghold.y + lateralOffset };
    const path: Vec2[] = [gate, exit];
    for (const knot of this.knots) {
      const bend = { x: stronghold.x + knot.u * span, y: stronghold.y + knot.v * lateralOffset };
      const last = path[path.length - 1] ?? exit;
      const isAhead = bend.x > last.x && bend.x < centreX;
      if (isAhead && distance(bend, stronghold) > ringRadius + apron) {
        path.push(bend);
      }
    }
    return [...path, centre];
  }
}

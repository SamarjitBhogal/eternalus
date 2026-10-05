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

  /** Gate on the wall ring at the exit angle, then every bend outside the ring, then the centre line. */
  public traceLightHalf(input: LaneTraceInput): readonly Vec2[] {
    const { stronghold, centreX, lateralOffset, ringRadius, exitAngle } = input;
    const span = centreX - stronghold.x;
    const bends = this.knots
      .map((knot) => ({
        x: stronghold.x + knot.u * span,
        y: stronghold.y + knot.v * lateralOffset,
      }))
      .filter((point) => distance(point, stronghold) > ringRadius);
    const centre = { x: centreX, y: stronghold.y + lateralOffset };
    return [polarPoint(stronghold, ringRadius, exitAngle), ...bends, centre];
  }
}

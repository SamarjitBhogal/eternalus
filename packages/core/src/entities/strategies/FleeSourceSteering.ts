import type { Vec2 } from '../../utils/geometry.types';
import type { MutableVec2 } from '../../utils/vec2.types';
import type { StatusSteering } from './StatusSteering.types';

/**
 * Runs straight away from the status's source (Fear, DEC-203: "a feared unit runs away"; reading
 * R3). Once the source is gone, or while the holder stands right on it, the holder keeps the heading
 * it last took.
 */
export class FleeSourceSteering implements StatusSteering {
  /** Points `heading` from `source` through `position`; leaves it as it is with no way to point. */
  public steer(position: Vec2, source: Vec2 | undefined, heading: MutableVec2): void {
    if (source === undefined) {
      return;
    }
    const dx = position.x - source.x;
    const dy = position.y - source.y;
    const length = Math.hypot(dx, dy);
    if (length === 0) {
      return;
    }
    heading.x = dx / length;
    heading.y = dy / length;
  }
}

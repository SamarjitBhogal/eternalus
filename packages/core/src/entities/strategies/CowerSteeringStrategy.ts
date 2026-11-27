import type { Vec2 } from '../../utils/geometry.types';
import type { MutableVec2 } from '../../utils/vec2.types';
import type { StatusSteering } from './StatusSteering.types';

/**
 * Cowers in place (Fear, DEC-203: "or cowers in place"; DEC-382 (R3 D)). It writes a zero heading,
 * so `MovementSystem` slows the holder to a stop and holds it there, over its own steer. Where the
 * source stands does not change it.
 */
export class CowerSteeringStrategy implements StatusSteering {
  /** Sets `heading` to zero: the holder stands. */
  public steer(_position: Vec2, _source: Vec2 | undefined, heading: MutableVec2): void {
    heading.x = 0;
    heading.y = 0;
  }
}

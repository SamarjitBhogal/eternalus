import type { Vec2 } from '../../utils/geometry.types';
import type { MutableVec2 } from '../../utils/vec2.types';

/**
 * How a status steers its holder while it lasts (Fear's flight, DEC-203): one stateless strategy per
 * `StatusSteeringKind` in `defaultStrategyRegistry.ts`. `StatusSteeringSystem` asks it once per tick.
 */
export interface StatusSteering {
  /**
   * Writes the holder's heading for this tick into `heading`, which holds the one it took last tick
   * (zero before the first): a unit vector, or zero to stand.
   *
   * @param position - Where the holder stands.
   * @param source - Where the status's source stands; `undefined` once it is gone.
   */
  steer(position: Vec2, source: Vec2 | undefined, heading: MutableVec2): void;
}

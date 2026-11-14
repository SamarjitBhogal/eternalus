import { doesDiscReachPolygon } from '../../utils/circlePolygon';
import type { Polygon, Vec2 } from '../../utils/geometry.types';
import { mustBePositive } from '../specChecks';
import type { AreaShape, ShapePlacement } from './AreaShape.types';
import type { CircleSpec } from './CircleShape.types';

/**
 * A disc of `radius` centred on the placement's `to` point: the caster for a cast's own step, the
 * dash's end for an `onEnd` step. A body is in it when it overlaps the disc.
 */
export class CircleShape implements AreaShape<CircleSpec> {
  public readonly kind = 'circle';

  /** A disc needs a positive, finite radius. */
  public validate({ radius }: CircleSpec): readonly string[] {
    return mustBePositive(radius, 'circle radius');
  }

  /** Whether the body's circle overlaps the disc. */
  public overlaps(shape: CircleSpec, { to }: ShapePlacement, point: Vec2, radius: number): boolean {
    const dx = point.x - to.x;
    const dy = point.y - to.y;
    const reach = shape.radius + radius;
    return dx * dx + dy * dy <= reach * reach;
  }

  /** Whether the footprint is inside the disc or its outline within reach of the disc. */
  public overlapsPolygon(shape: CircleSpec, { to }: ShapePlacement, polygon: Polygon): boolean {
    return doesDiscReachPolygon(to, shape.radius, polygon);
  }

  /** The disc's centre, whoever asks. */
  public centreFor(_shape: CircleSpec, { to }: ShapePlacement): Vec2 {
    return { x: to.x, y: to.y };
  }
}

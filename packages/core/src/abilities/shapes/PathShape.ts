import { doesCapsuleReachPolygon } from '../../utils/circlePolygon';
import { closestPointOnSegment, distanceToSegment } from '../../utils/geometry';
import type { Polygon, Vec2 } from '../../utils/geometry.types';
import { mustBePositive } from '../specChecks';
import type { AreaShape, ShapePlacement } from './AreaShape.types';
import type { PathSpec } from './PathShape.types';

/**
 * The capsule a dash sweeps: the segment from the placement's `from` to its `to`, `width` across. A
 * body is on it when its circle overlaps the capsule.
 */
export class PathShape implements AreaShape<PathSpec> {
  public readonly kind = 'path';

  /** A path needs a positive, finite width. */
  public validate({ width }: PathSpec): readonly string[] {
    return mustBePositive(width, 'path width');
  }

  /** Whether the body's circle overlaps the capsule. */
  public overlaps(
    shape: PathSpec,
    { from, to }: ShapePlacement,
    point: Vec2,
    radius: number,
  ): boolean {
    return distanceToSegment(point, from, to) <= shape.width / 2 + radius;
  }

  /** Whether the footprint overlaps the capsule: beside the path or crossed by it. */
  public overlapsPolygon(shape: PathSpec, { from, to }: ShapePlacement, polygon: Polygon): boolean {
    return doesCapsuleReachPolygon(from, to, shape.width / 2, polygon);
  }

  /** The point of the path's line nearest to `point`. */
  public centreFor(_shape: PathSpec, { from, to }: ShapePlacement, point: Vec2): Vec2 {
    return closestPointOnSegment(point, from, to);
  }
}

import type { EffectShape } from '../../content/abilities/AbilityDefinition.types';
import { closestPointOnSegment, distanceToSegment } from '../../utils/geometry';
import type { Vec2 } from '../../utils/geometry.types';
import type { AreaShape, ShapePlacement } from './AreaShape.types';

/** A `path` shape's spec. */
type PathSpec = Extract<EffectShape, { readonly kind: 'path' }>;

/**
 * The capsule a dash sweeps: the segment from the placement's `from` to its `to`, `width` across. A
 * body is on it when its circle overlaps the capsule.
 */
export class PathShape implements AreaShape<PathSpec> {
  public readonly kind = 'path';

  /** Whether the body's circle overlaps the capsule. */
  public overlaps(
    shape: PathSpec,
    { from, to }: ShapePlacement,
    point: Vec2,
    radius: number,
  ): boolean {
    return distanceToSegment(point, from, to) <= shape.width / 2 + radius;
  }

  /** The point of the path's line nearest to `point`. */
  public centreFor(_shape: PathSpec, { from, to }: ShapePlacement, point: Vec2): Vec2 {
    return closestPointOnSegment(point, from, to);
  }
}

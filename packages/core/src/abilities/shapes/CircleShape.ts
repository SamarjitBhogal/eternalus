import type { EffectShape } from '../../content/abilities/AbilityDefinition.types';
import type { Vec2 } from '../../utils/geometry.types';
import type { AreaShape, ShapePlacement } from './AreaShape.types';

/** A `circle` shape's spec. */
type CircleSpec = Extract<EffectShape, { readonly kind: 'circle' }>;

/**
 * A disc of `radius` centred on the placement's `to` point: the caster for a cast's own step, the
 * dash's end for an `onEnd` step. A body is in it when it overlaps the disc.
 */
export class CircleShape implements AreaShape<CircleSpec> {
  public readonly kind = 'circle';

  /** Whether the body's circle overlaps the disc. */
  public overlaps(shape: CircleSpec, { to }: ShapePlacement, point: Vec2, radius: number): boolean {
    const dx = point.x - to.x;
    const dy = point.y - to.y;
    const reach = shape.radius + radius;
    return dx * dx + dy * dy <= reach * reach;
  }

  /** The disc's centre, whoever asks. */
  public centreFor(_shape: CircleSpec, { to }: ShapePlacement): Vec2 {
    return { x: to.x, y: to.y };
  }
}

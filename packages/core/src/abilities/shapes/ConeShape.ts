import type { EffectShape } from '../../content/abilities/AbilityDefinition.types';
import { FIELD_POLYGON_SIDES } from '../../content/abilities/starterEntities';
import { doesCircleOverlapPolygon } from '../../utils/circlePolygon';
import { atan2, cos, sin } from '../../utils/deterministicMath';
import { doSegmentsIntersect, isPointInPolygon } from '../../utils/geometry';
import type { Polygon, Vec2 } from '../../utils/geometry.types';
import { mustBePositive } from '../specChecks';
import type { AreaShape, ShapePlacement } from './AreaShape.types';

/** A caster-centred polygonal sector for directional melee effects. */
export class ConeShape implements AreaShape<Extract<EffectShape, { kind: 'cone' }>> {
  public readonly kind = 'cone';
  /** Rejects non-finite lengths and angles outside a single turn. */
  public validate(shape: Extract<EffectShape, { kind: 'cone' }>): readonly string[] {
    return [
      ...mustBePositive(shape.radius, 'cone radius'),
      ...mustBePositive(shape.angleDegrees, 'cone angle'),
      ...(shape.angleDegrees > 360 ? ['Cone angle exceeds a turn'] : []),
    ];
  }
  /** Tests the body's entire circle, rather than only its centre. */
  public overlaps(
    shape: Extract<EffectShape, { kind: 'cone' }>,
    placement: ShapePlacement,
    point: Vec2,
    radius: number,
  ): boolean {
    return doesCircleOverlapPolygon(point, radius, this.polygon(shape, placement));
  }
  /** Tests containment and every pair of edges for map-object footprints. */
  public overlapsPolygon(
    shape: Extract<EffectShape, { kind: 'cone' }>,
    placement: ShapePlacement,
    polygon: Polygon,
  ): boolean {
    const cone = this.polygon(shape, placement);
    if (
      polygon.some((point) => isPointInPolygon(point, cone)) ||
      cone.some((point) => isPointInPolygon(point, polygon))
    )
      return true;
    return cone.some((a, i) =>
      polygon.some((b, j) =>
        doSegmentsIntersect(
          a,
          cone[(i + 1) % cone.length] ?? a,
          b,
          polygon[(j + 1) % polygon.length] ?? b,
        ),
      ),
    );
  }
  /** A pull/knockback originates at the caster. */
  public centreFor(
    _shape: Extract<EffectShape, { kind: 'cone' }>,
    placement: ShapePlacement,
  ): Vec2 {
    return placement.from;
  }

  private polygon(
    shape: Extract<EffectShape, { kind: 'cone' }>,
    { from, to, direction }: ShapePlacement,
  ): Polygon {
    const middle = atan2(direction?.y ?? to.y - from.y, direction?.x ?? to.x - from.x);
    const span = (shape.angleDegrees * Math.PI) / 180;
    return [
      from,
      ...Array.from({ length: FIELD_POLYGON_SIDES + 1 }, (_, i) => {
        const angle = middle - span / 2 + (span * i) / FIELD_POLYGON_SIDES;
        return { x: from.x + cos(angle) * shape.radius, y: from.y + sin(angle) * shape.radius };
      }),
    ];
  }
}

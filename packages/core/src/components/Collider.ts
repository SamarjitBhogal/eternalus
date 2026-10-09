import type { Rect, Vec2 } from '../utils/geometry.types';
import type { ColliderShape, CollisionLayer } from './Collider.types';

/**
 * The solid footprint an entity uses for collisions. The shape is centred on the entity's
 * `Transform` position, so the collider never stores a position of its own.
 */
export class Collider {
  public readonly shape: ColliderShape;

  private isEnabledValue = true;

  /**
   * Creates an enabled collider with the given shape on a collision layer.
   *
   * @param shape - The footprint; a circle's radius must be positive.
   * @param layer - Which collision group the entity belongs to.
   * @param isStatic - Whether collision resolution may never move this entity (structures, walls).
   */
  public constructor(
    shape: ColliderShape,
    public readonly layer: CollisionLayer,
    public readonly isStatic = false,
  ) {
    if (!(shape.radius > 0) || !Number.isFinite(shape.radius)) {
      throw new Error(`Collider radius must be a positive number, got ${String(shape.radius)}.`);
    }

    this.shape = { kind: shape.kind, radius: shape.radius };
  }

  /** Whether the collider takes part in collisions (false while carried or dead). */
  public get isEnabled(): boolean {
    return this.isEnabledValue;
  }

  /** Makes the collider take part in collisions again. */
  public enable(): void {
    this.isEnabledValue = true;
  }

  /** Takes the collider out of collisions until `enable` is called. */
  public disable(): void {
    this.isEnabledValue = false;
  }

  /** The axis-aligned box around the shape when its centre is at `center`. */
  public bounds(center: Vec2): Rect {
    const { radius } = this.shape;
    return { x: center.x - radius, y: center.y - radius, width: radius * 2, height: radius * 2 };
  }
}

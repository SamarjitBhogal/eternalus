import type { Vec2 } from '../utils/geometry.types';

/** Where an entity is and how much room it takes. Position must always be a finite point. */
export class Transform {
  private currentPosition: Vec2;

  /**
   * @param position - Starting point in world units.
   * @param radius - Footprint radius in world units; must be positive.
   */
  public constructor(
    position: Vec2,
    public readonly radius: number,
  ) {
    if (!(radius > 0) || !Number.isFinite(radius)) {
      throw new Error(`Transform radius must be a positive number, got ${String(radius)}.`);
    }

    this.currentPosition = Transform.checkedPoint(position);
  }

  /** The current position. */
  public get position(): Vec2 {
    return this.currentPosition;
  }

  /** Moves to `position`. */
  public moveTo(position: Vec2): void {
    this.currentPosition = Transform.checkedPoint(position);
  }

  /** Moves by `delta` from the current position. */
  public moveBy(delta: Vec2): void {
    this.moveTo({ x: this.currentPosition.x + delta.x, y: this.currentPosition.y + delta.y });
  }

  private static checkedPoint(point: Vec2): Vec2 {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      throw new Error(
        `Transform position must be finite, got (${String(point.x)}, ${String(point.y)}).`,
      );
    }

    return { x: point.x, y: point.y };
  }
}

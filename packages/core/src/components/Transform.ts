import type { Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';

/** Where an entity is and how much room it takes. Position must always be a finite point. */
export class Transform {
  private readonly currentPosition: MutableVec2;
  private readonly beforeMovement: MutableVec2;

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

    Transform.assertFinite(position.x, position.y);
    this.currentPosition = { x: position.x, y: position.y };
    this.beforeMovement = { ...position };
  }

  /** The current position. Read it, but do not keep it: moves update it in place. */
  public get position(): Vec2 {
    return this.currentPosition;
  }

  /** Position before this tick's movement integration, used by continuous collision. */
  public get previousPosition(): Vec2 {
    return this.beforeMovement;
  }

  /** Moves to `position`. */
  public moveTo(position: Vec2): void {
    this.place(position.x, position.y);
  }

  /** Moves by `delta` from the current position, without allocating. */
  public moveBy(delta: Vec2): void {
    this.beforeMovement.x = this.currentPosition.x;
    this.beforeMovement.y = this.currentPosition.y;
    this.place(this.currentPosition.x + delta.x, this.currentPosition.y + delta.y);
  }

  private place(x: number, y: number): void {
    Transform.assertFinite(x, y);
    this.currentPosition.x = x;
    this.currentPosition.y = y;
  }

  private static assertFinite(x: number, y: number): void {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error(`Transform position must be finite, got (${String(x)}, ${String(y)}).`);
    }
  }
}

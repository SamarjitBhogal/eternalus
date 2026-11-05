import type { Vec2 } from '../utils/geometry.types';
import { sqrt } from '../utils/deterministicMath';
import type { MutableVec2 } from '../utils/vec2.types';
import { INITIAL_FACING } from './Transform.constants';

/**
 * Where an entity is, which way it faces and how much room it takes. Position must always be a
 * finite point; facing is always a unit vector (architecture 10 §10: vectors, never angles).
 */
export class Transform {
  private readonly currentPosition: MutableVec2;
  private readonly beforeMovement: MutableVec2;
  private readonly currentFacing: MutableVec2 = { ...INITIAL_FACING };

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

  /**
   * The direction the entity faces, a unit vector: `INITIAL_FACING` until it first turns (a unit's
   * spawn turns it to its start facing, DEC-216 (6)). Read it, but do not keep it: turns update it
   * in place.
   */
  public get facing(): Vec2 {
    return this.currentFacing;
  }

  /**
   * Turns to face along `direction`, which may have any length. A zero direction keeps the
   * current facing, so an entity that stops still faces the way it last turned (DEC-192).
   *
   * @throws Error when `direction` is not a finite vector.
   */
  public face(direction: Vec2): void {
    Transform.assertFinite(direction.x, direction.y, 'facing direction');
    this.turn(direction.x, direction.y);
  }

  /**
   * Turns to face `point`. A point equal to the entity's own position keeps the current facing.
   * Allocates nothing.
   *
   * @throws Error when `point` is not finite.
   */
  public lookAt(point: Vec2): void {
    Transform.assertFinite(point.x, point.y, 'look-at point');
    this.turn(point.x - this.currentPosition.x, point.y - this.currentPosition.y);
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

  private turn(dx: number, dy: number): void {
    const size = sqrt(dx * dx + dy * dy);
    if (size > 0) {
      const scale = 1 / size;
      this.currentFacing.x = dx * scale;
      this.currentFacing.y = dy * scale;
    }
  }

  private place(x: number, y: number): void {
    Transform.assertFinite(x, y);
    this.currentPosition.x = x;
    this.currentPosition.y = y;
  }

  private static assertFinite(x: number, y: number, name = 'position'): void {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error(`Transform ${name} must be finite, got (${String(x)}, ${String(y)}).`);
    }
  }
}

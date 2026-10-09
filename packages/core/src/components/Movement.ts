import type { MovementProfile } from '../content/units/units.types';
import type { Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';

/**
 * How fast an entity moves and in which direction. Speed builds up by `acceleration` each tick
 * and never goes above `maxSpeed`. A command sets the heading with `steer`; each tick
 * `MovementSystem` calls `advance` and applies `velocity` to the `Transform`.
 *
 * @remarks Velocity and heading are updated in place, so a tick allocates nothing per unit.
 * Read them, but do not keep them: they change on the next tick.
 */
export class Movement {
  public readonly maxSpeed: number;

  public readonly acceleration: number;

  public readonly mass: number;

  private currentSpeed = 0;

  private readonly currentVelocity: MutableVec2 = { x: 0, y: 0 };

  private readonly currentHeading: MutableVec2 = { x: 0, y: 0 };

  /**
   * Creates a stopped movement component from a unit's movement profile.
   *
   * @param stats - The unit definition's movement profile; every value must be positive.
   */
  public constructor(stats: MovementProfile) {
    for (const [name, value] of Object.entries(stats)) {
      if (!(value > 0) || !Number.isFinite(value)) {
        throw new Error(`Movement ${name} must be a positive number, got ${String(value)}.`);
      }
    }

    this.maxSpeed = stats.maxSpeed;
    this.acceleration = stats.acceleration;
    this.mass = stats.mass;
  }

  /** Current speed, between 0 and `maxSpeed`. */
  public get speed(): number {
    return this.currentSpeed;
  }

  /** Movement this tick, in world units. */
  public get velocity(): Vec2 {
    return this.currentVelocity;
  }

  /** The direction the entity wants to move in: a unit vector, or zero when it wants to stop. */
  public get heading(): Vec2 {
    return this.currentHeading;
  }

  /**
   * Sets the direction to move in from the next `advance`. Any length works; a zero direction
   * asks the entity to slow down to a stop.
   *
   * @throws Error when `direction` is not a finite vector.
   */
  public steer(direction: Vec2): void {
    if (!Number.isFinite(direction.x) || !Number.isFinite(direction.y)) {
      throw new Error(
        `Movement direction must be finite, got (${String(direction.x)}, ${String(direction.y)}).`,
      );
    }

    const length = Math.hypot(direction.x, direction.y);
    this.currentHeading.x = length === 0 ? 0 : direction.x / length;
    this.currentHeading.y = length === 0 ? 0 : direction.y / length;
  }

  /**
   * One tick of movement: speeds up along the heading, or slows down by one tick of
   * acceleration when there is no heading.
   */
  public advance(): void {
    if (this.currentHeading.x !== 0 || this.currentHeading.y !== 0) {
      this.accelerateToward(this.currentHeading);
      return;
    }

    const slower = Math.max(0, this.currentSpeed - this.acceleration);
    const factor = this.currentSpeed === 0 ? 0 : slower / this.currentSpeed;
    this.currentSpeed = slower;
    this.currentVelocity.x *= factor;
    this.currentVelocity.y *= factor;
  }

  /**
   * Speeds up by one tick of acceleration and points the velocity along `direction`.
   * A zero direction stops the unit.
   */
  public accelerateToward(direction: Vec2): void {
    const length = Math.hypot(direction.x, direction.y);

    if (length === 0) {
      this.stop();
      return;
    }

    this.currentSpeed = Math.min(this.maxSpeed, this.currentSpeed + this.acceleration);
    const scale = this.currentSpeed / length;
    this.currentVelocity.x = direction.x * scale;
    this.currentVelocity.y = direction.y * scale;
  }

  /** Stops at once and drops the heading. */
  public stop(): void {
    this.currentSpeed = 0;
    this.currentVelocity.x = 0;
    this.currentVelocity.y = 0;
    this.currentHeading.x = 0;
    this.currentHeading.y = 0;
  }
}

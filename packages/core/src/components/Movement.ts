import type { MovementProfile } from '../content/units/units.types';
import type { Vec2 } from '../utils/geometry.types';

const STOPPED: Vec2 = { x: 0, y: 0 };

/**
 * How fast an entity moves and in which direction. Speed builds up by `acceleration` each tick
 * and never goes above `maxSpeed`. The MovementSystem applies `velocity` to the Transform.
 */
export class Movement {
  public readonly maxSpeed: number;

  public readonly acceleration: number;

  public readonly mass: number;

  private currentSpeed = 0;

  private currentVelocity: Vec2 = STOPPED;

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
    this.currentVelocity = { x: direction.x * scale, y: direction.y * scale };
  }

  /** Stops at once. */
  public stop(): void {
    this.currentSpeed = 0;
    this.currentVelocity = STOPPED;
  }
}

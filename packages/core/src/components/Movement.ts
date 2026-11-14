import type { MovementProfile, MovementStrategyId } from '../content/units/units.types';
import type { Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';
import type { ForcedPush } from './Movement.types';

/**
 * How fast an entity moves and in which direction. Speed builds up by `acceleration` each tick
 * and never goes above `topSpeed`. A command sets the heading with `steer`; each tick
 * `MovementSystem` calls `advance` and applies `velocity` to the `Transform`.
 *
 * Dashes and knock-backs are forced motion (plan arch call 6), not impulses: `push` spreads a
 * displacement over a number of ticks, and `takeForcedStep` gives `MovementSystem` this tick's
 * share, which it adds to `velocity`. Forced motion never touches velocity or heading, so the
 * per-tick re-pointing of velocity along the heading cannot wipe it, and pushes add up as vectors.
 *
 * @remarks Velocity and heading are updated in place, so a tick allocates nothing per unit.
 * Read them, but do not keep them: they change on the next tick.
 */
export class Movement {
  public readonly maxSpeed: number;

  public readonly acceleration: number;

  public readonly mass: number;

  /** The strategy that steers this entity (architecture 04 §4), or `undefined` when none does. */
  public readonly strategyId: MovementStrategyId | undefined;

  private currentSpeed = 0;

  private currentTopSpeed: number;

  private readonly currentVelocity: MutableVec2 = { x: 0, y: 0 };

  private readonly currentHeading: MutableVec2 = { x: 0, y: 0 };

  /** The pushes under way, oldest first. */
  private readonly pushes: ForcedPush[] = [];

  private readonly forcedStep: MutableVec2 = { x: 0, y: 0 };

  /**
   * Creates a stopped movement component from a unit's movement profile.
   *
   * @param stats - The unit definition's movement profile; every value must be positive.
   * @param strategyId - The definition's `movementStrategy`, resolved through the strategy
   *   registry by `PathingSystem`.
   */
  public constructor(stats: MovementProfile, strategyId?: MovementStrategyId) {
    for (const [name, value] of Object.entries(stats)) {
      if (!(value > 0) || !Number.isFinite(value)) {
        throw new Error(`Movement ${name} must be a positive number, got ${String(value)}.`);
      }
    }

    this.maxSpeed = stats.maxSpeed;
    this.currentTopSpeed = stats.maxSpeed;
    this.acceleration = stats.acceleration;
    this.mass = stats.mass;
    this.strategyId = strategyId;
  }

  /** Current speed, between 0 and `topSpeed`. */
  public get speed(): number {
    return this.currentSpeed;
  }

  /**
   * The top speed the last `advance` allowed: `maxSpeed` times its `speedScale`, so above
   * `maxSpeed` while a status speeds the entity up (`enraged`).
   */
  public get topSpeed(): number {
    return this.currentTopSpeed;
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
   * acceleration when there is no heading. The heading is kept, so movement resumes on its own.
   *
   * @param speedScale - Multiplies `maxSpeed` for this tick (statuses: 0.7 slowed, 0 stunned,
   *   above 1 enraged).
   */
  public advance(speedScale = 1): void {
    const cap = this.maxSpeed * speedScale;
    this.currentTopSpeed = cap;
    if (this.currentHeading.x !== 0 || this.currentHeading.y !== 0) {
      this.accelerateToward(this.currentHeading, cap);
      return;
    }

    const slower = Math.min(cap, Math.max(0, this.currentSpeed - this.acceleration));
    const factor = this.currentSpeed === 0 ? 0 : slower / this.currentSpeed;
    this.currentSpeed = slower;
    this.currentVelocity.x *= factor;
    this.currentVelocity.y *= factor;
  }

  /**
   * Speeds up by one tick of acceleration, up to `cap`, and points the velocity along
   * `direction`. A zero direction stops the unit.
   */
  public accelerateToward(direction: Vec2, cap = this.maxSpeed): void {
    const length = Math.hypot(direction.x, direction.y);

    if (length === 0) {
      this.stop();
      return;
    }

    this.currentSpeed = Math.min(cap, this.currentSpeed + this.acceleration);
    const scale = this.currentSpeed / length;
    this.currentVelocity.x = direction.x * scale;
    this.currentVelocity.y = direction.y * scale;
  }

  /** Whether a push (a dash or knock-back) is still moving the entity. */
  public get isForced(): boolean {
    return this.pushes.length > 0;
  }

  /**
   * Moves the entity by `displacement` (world units), spread evenly over the next `ticks` ticks.
   * Pushes under way add up as vectors (two knock-backs in one tick move the sum, DEC-208), and
   * the entity's own walking adds to them. Walls and world bounds stop it as they stop walking,
   * because `MovementSystem` moves the forced step and the walking step together.
   *
   * @throws Error when `displacement` is not finite or `ticks` is not a positive whole number.
   */
  public push(displacement: Vec2, ticks: number): void {
    if (!Number.isFinite(displacement.x) || !Number.isFinite(displacement.y)) {
      throw new Error(
        `Push displacement must be finite, got (${String(displacement.x)}, ${String(displacement.y)}).`,
      );
    }
    if (!Number.isInteger(ticks) || ticks < 1) {
      throw new Error(`A push lasts a positive whole number of ticks, got ${String(ticks)}.`);
    }
    this.pushes.push({ x: displacement.x / ticks, y: displacement.y / ticks, ticksLeft: ticks });
  }

  /**
   * This tick's forced displacement: the sum of every push under way, oldest first, each then one
   * tick closer to its end; zero with none. `MovementSystem` calls it once per tick.
   *
   * @returns A vector reused on the next call; read it, do not keep it.
   */
  public takeForcedStep(): Vec2 {
    this.forcedStep.x = 0;
    this.forcedStep.y = 0;
    let kept = 0;
    for (const push of this.pushes) {
      this.forcedStep.x += push.x;
      this.forcedStep.y += push.y;
      push.ticksLeft -= 1;
      if (push.ticksLeft > 0) {
        this.pushes[kept] = push;
        kept += 1;
      }
    }
    this.pushes.length = kept;
    return this.forcedStep;
  }

  /** Stops at once and drops the heading. A push under way goes on: it is not the entity's will. */
  public stop(): void {
    this.currentSpeed = 0;
    this.currentVelocity.x = 0;
    this.currentVelocity.y = 0;
    this.currentHeading.x = 0;
    this.currentHeading.y = 0;
  }
}

import type { MovementProfile, MovementStrategyId } from '../content/units/units.types';
import type { Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';
import { Momentum } from './Momentum';
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
 * A unit whose profile has `momentum` (the Sentinel's Wrecking Run, DEC-307) drives through its
 * `Momentum` instead: a turn slides and loses speed, and a wall takes the speed that runs into it
 * (`hitBlock`).
 *
 * @remarks Velocity and heading are updated in place, so a tick allocates nothing per unit.
 * Read them, but do not keep them: they change on the next tick.
 */
export class Movement {
  /** The walls of a unit without momentum: none, shared so that `wallNormals` allocates nothing. */
  private static readonly NO_WALLS: readonly Vec2[] = [];

  public readonly maxSpeed: number;

  public readonly acceleration: number;

  public readonly mass: number;

  /** The strategy that steers this entity (architecture 04 §4), or `undefined` when none does. */
  public readonly strategyId: MovementStrategyId | undefined;

  private currentSpeed = 0;

  private currentTopSpeed: number;

  private currentSpeedLimit = Number.POSITIVE_INFINITY;

  private readonly currentVelocity: MutableVec2 = { x: 0, y: 0 };

  private readonly currentHeading: MutableVec2 = { x: 0, y: 0 };

  /** The pushes under way, oldest first. */
  private readonly pushes: ForcedPush[] = [];

  private readonly forcedStep: MutableVec2 = { x: 0, y: 0 };

  /** The momentum rule, or `undefined` for a unit that turns at once and keeps its speed. */
  private readonly momentum: Momentum | undefined;

  /**
   * Creates a stopped movement component from a unit's movement profile.
   *
   * @param stats - The unit definition's movement profile; every value must be positive, and a
   *   momentum's `walkSpeed` must be below `maxSpeed`.
   * @param strategyId - The definition's `movementStrategy`, resolved through the strategy
   *   registry by `PathingSystem`.
   */
  public constructor(stats: MovementProfile, strategyId?: MovementStrategyId) {
    const { momentum, ...numbers } = stats;
    for (const [name, value] of Object.entries(numbers)) {
      if (!(value > 0) || !Number.isFinite(value)) {
        throw new Error(`Movement ${name} must be a positive number, got ${String(value)}.`);
      }
    }

    this.maxSpeed = stats.maxSpeed;
    this.currentTopSpeed = stats.maxSpeed;
    this.acceleration = stats.acceleration;
    this.mass = stats.mass;
    this.strategyId = strategyId;
    this.momentum =
      momentum === undefined
        ? undefined
        : new Momentum(momentum, stats.acceleration, stats.maxSpeed);
  }

  /** Current speed, between 0 and `topSpeed`. */
  public get speed(): number {
    return this.currentSpeed;
  }

  /**
   * The top speed the last `advance` allowed: `maxSpeed` times its `speedScale`, so above
   * `maxSpeed` while a status speeds the entity up (`enraged`). For a unit with momentum that slides
   * down to a lower top (a stun or a slow), its speed before that tick.
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

  /** The cap `limitSpeed` set; `Infinity` while none is set. */
  public get speedLimit(): number {
    return this.currentSpeedLimit;
  }

  /**
   * Caps the speed from the next `advance` by the entity's own rules, on top of `maxSpeed` and the
   * status scale (a projectile slowing to its end). The limit stays until it is set again.
   *
   * @param limit - The most speed in world units per tick.
   * @throws Error when `limit` is negative or not a number.
   */
  public limitSpeed(limit: number): void {
    if (!(limit >= 0)) {
      throw new Error(`Movement speed limit must be zero or more, got ${String(limit)}.`);
    }
    this.currentSpeedLimit = limit;
  }

  /**
   * One tick of movement: speeds up along the heading, or slows down by one tick of
   * acceleration when there is no heading. The heading is kept, so movement resumes on its own.
   * A unit with momentum drives through its `Momentum` instead: a status lowers only the top it
   * drives to, and the speed above that top slides off at its grip (DEC-330, card F3), so a stun
   * takes away its drive and it slides to a stop.
   *
   * @param speedScale - Multiplies `maxSpeed` for this tick (statuses: 0.7 slowed, 0 stunned,
   *   above 1 enraged). The speed limit (`limitSpeed`) still caps the result at once.
   */
  public advance(speedScale = 1): void {
    const top = Math.min(this.maxSpeed * speedScale, this.currentSpeedLimit);
    if (this.momentum !== undefined) {
      // The drive never adds speed above the top; speed already above it only slides off.
      const cap = Math.min(this.currentSpeedLimit, Math.max(top, this.currentSpeed));
      this.currentTopSpeed = cap;
      this.currentSpeed = this.momentum.drive(this.currentVelocity, this.currentHeading, top, cap);
      return;
    }
    this.currentTopSpeed = top;
    if (this.currentHeading.x !== 0 || this.currentHeading.y !== 0) {
      this.accelerateToward(this.currentHeading, top);
      return;
    }

    const slower = Math.min(top, Math.max(0, this.currentSpeed - this.acceleration));
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

  /**
   * The last move touched the walls or world edges whose unit normals, pointing out of each, are
   * `normals` (`CollisionSystem`). A unit with momentum loses the velocity that runs into them, so
   * a head-on hit stops it dead, and builds along them while it steers into them. A unit without
   * momentum re-points its velocity from its heading every tick, so nothing changes for it.
   */
  public hitBlock(normals: readonly Vec2[]): void {
    if (this.momentum !== undefined) {
      this.currentSpeed = this.momentum.shed(this.currentVelocity, normals);
    }
  }

  /**
   * The unit normals of the walls the last move touched, which the next `advance` reads: state
   * that `StateHasher` hashes. Always empty for a unit without momentum.
   */
  public get wallNormals(): readonly Vec2[] {
    return this.momentum?.wallNormals ?? Movement.NO_WALLS;
  }

  /** Whether a push (a dash or knock-back) is still moving the entity. */
  public get isForced(): boolean {
    return this.pushes.length > 0;
  }

  /** The pushes under way, oldest first: each one's share per tick and its ticks left. */
  public get forcedPushes(): readonly Readonly<ForcedPush>[] {
    return this.pushes;
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

  /** Ends every push under way (a dash or knock-back), for a reset that puts the entity somewhere new. */
  public endPushes(): void {
    this.pushes.length = 0;
  }

  /**
   * Holds the entity still for this tick, in place of `advance`, while the match holds every unit
   * idle (the countdown): its speed drops to zero at once, a unit with momentum too, and it keeps
   * its heading, so movement resumes on its own when the hold ends.
   */
  public hold(): void {
    this.currentTopSpeed = 0;
    this.currentSpeed = 0;
    this.currentVelocity.x = 0;
    this.currentVelocity.y = 0;
  }

  /** Stops at once and drops the heading. A push under way goes on: it is not the entity's will. */
  public stop(): void {
    this.momentum?.forgetWalls();
    this.currentSpeed = 0;
    this.currentVelocity.x = 0;
    this.currentVelocity.y = 0;
    this.currentHeading.x = 0;
    this.currentHeading.y = 0;
  }
}

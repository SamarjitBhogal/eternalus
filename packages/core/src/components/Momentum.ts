import type { MomentumProfile } from '../content/units/units.types';
import type { Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';
import { sqrt } from '../utils/deterministicMath';
import { BLOCK_EPSILON } from './Momentum.constants';

/**
 * The velocity rule of a unit with momentum (the Sentinel's Wrecking Run, DEC-307; architecture
 * 10 §2): the part of the velocity that points where the unit is heading builds up, fast to
 * `walkSpeed` and then slowly to the top speed; the rest (sideways, backward, or all of it while
 * the unit does not steer) slides off at `grip`. So a gentle curve keeps its speed, a sharp turn
 * slides and comes out slow, and a reverse slides to a stop before it builds up again. A wall takes
 * the part of the velocity that runs into it (`shed`), so a head-on hit stops the unit dead; a unit
 * that steers into a wall it touches builds along the wall instead, up to the top speed times the
 * cosine of its angle to the wall (as a unit without momentum slides).
 * `Movement` owns one when its profile has `momentum`; every value is per tick (loaded content).
 */
export class Momentum {
  private readonly rampAcceleration: number;

  /** The unit normal into the wall the last move hit (`shed`); zero when it hit none. */
  private readonly wall: MutableVec2 = { x: 0, y: 0 };

  /** The direction this tick's drive builds along (`aim`), reused every tick. */
  private readonly guide: MutableVec2 = { x: 0, y: 0 };

  /**
   * @param profile - The loaded momentum numbers (per tick).
   * @param acceleration - The unit's acceleration, used up to `walkSpeed`.
   * @param maxSpeed - The unit's top speed; the build-up reaches it after `rampDuration` ticks.
   */
  public constructor(
    private readonly profile: MomentumProfile,
    private readonly acceleration: number,
    maxSpeed: number,
  ) {
    for (const [name, value] of Object.entries(profile)) {
      if (!(value > 0) || !Number.isFinite(value)) {
        throw new Error(`Momentum ${name} must be a positive number, got ${String(value)}.`);
      }
    }
    if (profile.walkSpeed >= maxSpeed) {
      throw new Error(
        `Momentum walkSpeed ${String(profile.walkSpeed)} must be below maxSpeed ${String(maxSpeed)}.`,
      );
    }
    this.rampAcceleration = (maxSpeed - profile.walkSpeed) / profile.rampDuration;
  }

  /**
   * One tick of the unit's own driving: builds the speed along `heading` (a unit vector, or zero
   * while the unit does not steer) and slides the rest of `velocity` off at `grip`, never above
   * `cap`. A part that points against the heading brakes at `grip` first. When the last move hit a
   * wall that the heading points into, the drive builds along the wall and keeps pressing into it,
   * so the next move hits it again. Mutates `velocity` and returns its length, the new speed.
   */
  public drive(velocity: MutableVec2, heading: Vec2, cap: number): number {
    const { guide, wall } = this;
    const press = Math.max(0, heading.x * wall.x + heading.y * wall.y);
    const top = this.aim(heading, press, cap);
    const along = velocity.x * guide.x + velocity.y * guide.y;
    const acrossX = velocity.x - guide.x * along;
    const acrossY = velocity.y - guide.y * along;
    const across = sqrt(acrossX * acrossX + acrossY * acrossY);
    const kept = across === 0 ? 0 : Math.max(0, across - this.profile.grip) / across;
    let driven: number;
    if (along < 0) driven = Math.min(0, along + this.profile.grip);
    else if (along > top) driven = Math.max(top, along - this.profile.grip);
    else driven = Math.min(this.buildUp(along), top);
    const pressed = press * this.acceleration;
    velocity.x = guide.x * driven + acrossX * kept + wall.x * pressed;
    velocity.y = guide.y * driven + acrossY * kept + wall.y * pressed;
    wall.x = 0;
    wall.y = 0;
    const speed = sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    if (speed <= cap) return speed;
    velocity.x *= cap / speed;
    velocity.y *= cap / speed;
    return cap;
  }

  /**
   * The unit's last move was cut short by `lost` (the part a wall or the world's edge took): drops
   * the part of `velocity` that runs into it, so a head-on hit stops the unit and a glancing one
   * keeps its slide along the wall, and keeps the wall for the next `drive`. A loss within
   * `BLOCK_EPSILON` is the resolver's back-off, not a wall.
   * Mutates `velocity` and returns its length, the new speed.
   */
  public shed(velocity: MutableVec2, lost: Vec2): number {
    const length = sqrt(lost.x * lost.x + lost.y * lost.y);
    if (length > BLOCK_EPSILON) {
      this.wall.x = lost.x / length;
      this.wall.y = lost.y / length;
      const into = velocity.x * this.wall.x + velocity.y * this.wall.y;
      if (into > 0) {
        velocity.x -= this.wall.x * into;
        velocity.y -= this.wall.y * into;
      }
    }
    return sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  }

  /**
   * Points `guide` where this tick's drive builds: along `heading`, or, when the heading presses
   * into the wall by `press`, along the wall. Returns the most speed the drive builds to along
   * `guide`: no limit in the open (the caller's `cap` still holds), `cap` times the share of the
   * heading along the wall at a wall, and 0 head-on.
   */
  private aim(heading: Vec2, press: number, cap: number): number {
    const { guide, wall } = this;
    if (press === 0) {
      guide.x = heading.x;
      guide.y = heading.y;
      return Number.POSITIVE_INFINITY;
    }
    const alongWallX = heading.x - wall.x * press;
    const alongWallY = heading.y - wall.y * press;
    const reach = sqrt(alongWallX * alongWallX + alongWallY * alongWallY);
    guide.x = reach === 0 ? 0 : alongWallX / reach;
    guide.y = reach === 0 ? 0 : alongWallY / reach;
    return cap * reach;
  }

  /** The forward speed after one tick of driving: fast to `walkSpeed`, then the slow ramp. */
  private buildUp(forward: number): number {
    return forward < this.profile.walkSpeed
      ? Math.min(this.profile.walkSpeed, forward + this.acceleration)
      : forward + this.rampAcceleration;
  }
}

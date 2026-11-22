import type { MomentumProfile } from '../content/units/units.types';
import type { Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';
import { CONTACT_EPSILON } from '../utils/circlePolygon.constants';
import { sqrt } from '../utils/deterministicMath';

/**
 * The velocity rule of a unit with momentum (the Sentinel's Wrecking Run, DEC-307; architecture
 * 10 §2): the part of the velocity that points where the unit is heading builds up, fast to
 * `walkSpeed` and then slowly to the top speed; the rest (sideways, backward, or all of it while
 * the unit does not steer) slides off at `grip`. So a gentle curve keeps its speed, a sharp turn
 * slides and comes out slow, and a reverse slides to a stop before it builds up again. A wall takes
 * the part of the velocity that runs into it (`shed`), so a head-on hit stops the unit dead.
 * `Movement` owns one when its profile has `momentum`; every value is per tick (loaded content).
 */
export class Momentum {
  private readonly rampAcceleration: number;

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
   * `cap`. Mutates `velocity` and returns its length, the new speed.
   */
  public drive(velocity: MutableVec2, heading: Vec2, cap: number): number {
    const along = velocity.x * heading.x + velocity.y * heading.y;
    const forward = Math.max(0, along);
    const restX = velocity.x - heading.x * forward;
    const restY = velocity.y - heading.y * forward;
    const rest = sqrt(restX * restX + restY * restY);
    const kept = rest === 0 ? 0 : Math.max(0, rest - this.profile.grip) / rest;
    const isSteering = heading.x !== 0 || heading.y !== 0;
    // Moving away from the heading: no drive until the slide has stopped it.
    const driven = isSteering && along >= 0 ? this.buildUp(forward) : forward;
    velocity.x = heading.x * driven + restX * kept;
    velocity.y = heading.y * driven + restY * kept;
    const speed = sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    if (speed <= cap) return speed;
    velocity.x *= cap / speed;
    velocity.y *= cap / speed;
    return cap;
  }

  /**
   * The unit's last move was cut short by `lost` (the part a wall or the world's edge took): drops
   * the part of `velocity` that runs into it, so a head-on hit stops the unit and a glancing one
   * keeps its slide along the wall. A loss within `CONTACT_EPSILON` is rounding, not a wall.
   * Mutates `velocity` and returns its length, the new speed.
   */
  public shed(velocity: MutableVec2, lost: Vec2): number {
    const length = sqrt(lost.x * lost.x + lost.y * lost.y);
    if (length > CONTACT_EPSILON) {
      const into = (velocity.x * lost.x + velocity.y * lost.y) / length;
      if (into > 0) {
        velocity.x -= (lost.x / length) * into;
        velocity.y -= (lost.y / length) * into;
      }
    }
    return sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  }

  /** The forward speed after one tick of driving: fast to `walkSpeed`, then the slow ramp. */
  private buildUp(forward: number): number {
    return forward < this.profile.walkSpeed
      ? Math.min(this.profile.walkSpeed, forward + this.acceleration)
      : forward + this.rampAcceleration;
  }
}

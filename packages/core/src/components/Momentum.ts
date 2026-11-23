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
 * the part of the velocity that runs into it (`shed`), so a head-on hit stops the unit dead; a unit
 * that steers into a wall it touches builds along the wall instead, up to the top speed times the
 * cosine of its angle to the wall (as a unit without momentum slides), and stops when it is pressed
 * into a corner. `Movement` owns one when its profile has `momentum`; every value is per tick
 * (loaded content).
 */
export class Momentum {
  /** The heading of a unit that cannot drive (a stun): zero, so all of its velocity slides off. */
  private static readonly NO_HEADING: Vec2 = { x: 0, y: 0 };

  private readonly rampAcceleration: number;

  /**
   * The unit normals (pointing out of each wall) of the walls the last move touched (`shed`): the
   * objects `CollisionResolver` made, a new one per contact that nothing changes.
   */
  private readonly walls: Vec2[] = [];

  /** The direction this tick's drive builds along (`aim`), reused every tick. */
  private readonly guide: MutableVec2 = { x: 0, y: 0 };

  /** The part of this tick's heading that runs into the walls (`aim`), reused every tick. */
  private readonly press: MutableVec2 = { x: 0, y: 0 };

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
   * while the unit does not steer) up to `top` and slides the rest of `velocity` off at `grip`,
   * never above `cap`. A part that points against the heading brakes at `grip` first, and speed
   * above `top` (a slow lowered it) slides down to it at `grip`. A zero `top` (a stun) takes away
   * the drive: all of the velocity slides off at `grip`, as when the unit does not steer. When the
   * last move touched walls that the heading points into, the drive builds along them and keeps
   * pressing into them, so the next move touches them again. Mutates `velocity` and returns its
   * length, the new speed.
   */
  public drive(velocity: MutableVec2, heading: Vec2, top: number, cap: number): number {
    const { guide, press } = this;
    const reach = this.aim(top === 0 ? Momentum.NO_HEADING : heading, top);
    const along = velocity.x * guide.x + velocity.y * guide.y;
    const acrossX = velocity.x - guide.x * along;
    const acrossY = velocity.y - guide.y * along;
    const across = sqrt(acrossX * acrossX + acrossY * acrossY);
    const kept = across === 0 ? 0 : Math.max(0, across - this.profile.grip) / across;
    let driven: number;
    // A backward part within CONTACT_EPSILON is roundoff left by `shed`, not a reverse: braking it
    // would hold a unit at rest against a slanted wall forever.
    if (along < -CONTACT_EPSILON) driven = Math.min(0, along + this.profile.grip);
    else if (along > reach) driven = Math.max(reach, along - this.profile.grip);
    else driven = Math.min(this.buildUp(along), reach);
    velocity.x = guide.x * driven + acrossX * kept + press.x * this.acceleration;
    velocity.y = guide.y * driven + acrossY * kept + press.y * this.acceleration;
    this.forgetWalls();
    const speed = sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    if (speed <= cap) return speed;
    velocity.x *= cap / speed;
    velocity.y *= cap / speed;
    return cap;
  }

  /**
   * The unit's last move touched the walls or world edges whose unit normals, pointing out of
   * each, are `normals` (`CollisionSystem`): drops the part of `velocity` that runs into them
   * (`slideOff`), so a head-on hit stops the unit, a glancing one keeps its slide along the wall,
   * and a press into a corner stops it. Keeps the walls for the next `drive`.
   * Mutates `velocity` and returns its length, the new speed.
   */
  public shed(velocity: MutableVec2, normals: readonly Vec2[]): number {
    this.forgetWalls();
    for (const normal of normals) this.walls.push(normal);
    this.slideOff(velocity.x, velocity.y, velocity);
    return sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
  }

  /** The unit normals of the walls the last move touched, which the next `drive` reads. */
  public get wallNormals(): readonly Vec2[] {
    return this.walls;
  }

  /** Drops the walls the last move touched, for a unit that is put somewhere new. */
  public forgetWalls(): void {
    this.walls.length = 0;
  }

  /**
   * Points `guide` where this tick's drive builds and sets `press`, the part of `heading` that runs
   * into the walls the last move touched (`slideOff` takes it off). Returns the most speed the
   * drive builds to along `guide`: `top` in the open, `top` times what is left of the heading at a
   * wall, and 0 head-on or in a corner.
   */
  private aim(heading: Vec2, top: number): number {
    const { guide, press } = this;
    this.slideOff(heading.x, heading.y, guide);
    press.x = heading.x - guide.x;
    press.y = heading.y - guide.y;
    if (press.x === 0 && press.y === 0) return top;
    const reach = sqrt(guide.x * guide.x + guide.y * guide.y);
    guide.x = reach === 0 ? 0 : guide.x / reach;
    guide.y = reach === 0 ? 0 : guide.y / reach;
    return top * reach;
  }

  /**
   * Sets `out` to the vector closest to (`x`, `y`) that runs into none of the walls the last move
   * touched, as a frictionless contact does: the vector itself, else its slide along the one wall
   * that leaves it clear of the others, else zero (head-on, or pressed into a corner). Sliding off
   * each wall in turn is not enough: in a corner wider than 90° it leaves a part that points out
   * along the second wall, and the unit flips between the walls every tick.
   */
  private slideOff(x: number, y: number, out: MutableVec2): void {
    out.x = x;
    out.y = y;
    if (this.isClear(x, y, 0)) return;
    out.x = 0;
    out.y = 0;
    let reach = 0;
    for (const wall of this.walls) {
      const into = -(x * wall.x + y * wall.y);
      if (into <= 0) continue;
      const slidX = x + wall.x * into;
      const slidY = y + wall.y * into;
      const length = slidX * slidX + slidY * slidY;
      // The slide runs along this wall, so roundoff can put it a hair into this wall or one in line.
      if (length > reach && this.isClear(slidX, slidY, CONTACT_EPSILON)) {
        out.x = slidX;
        out.y = slidY;
        reach = length;
      }
    }
  }

  /** Whether (`x`, `y`) runs into none of the walls the last move touched by more than `slack`. */
  private isClear(x: number, y: number, slack: number): boolean {
    for (const wall of this.walls) if (x * wall.x + y * wall.y < -slack) return false;
    return true;
  }

  /**
   * The forward speed after one tick of driving: fast to `walkSpeed`, then the slow ramp. A speed
   * within `CONTACT_EPSILON` below `walkSpeed` counts as walk speed: `drive` reads the speed along a
   * unit heading that roundoff makes a hair short (a diagonal, a slide along a wall), so a strict
   * test would cap it at walk speed every tick and the ramp would never start.
   */
  private buildUp(forward: number): number {
    return forward < this.profile.walkSpeed - CONTACT_EPSILON
      ? Math.min(this.profile.walkSpeed, forward + this.acceleration)
      : forward + this.rampAcceleration;
  }
}

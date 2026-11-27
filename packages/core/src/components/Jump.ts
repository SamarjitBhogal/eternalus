import type { LegendJump } from '../content/legends/legendJump.types';
import type { Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';

/**
 * A Legend's jump (DEC-390): whether the jump key is held, and the arc it flies while in the air.
 * `JumpSystem` calls `advance` each tick and `takeOff` when a held key meets the ground; while
 * airborne, `MovementSystem` moves the Legend by `velocity`, the velocity it had at takeoff
 * (momentum). The height is only drawn: collision does not change in the air, and no combat code
 * reads it, so a Legend attacks and casts in the air as on the ground (HC-Q126 default).
 *
 * @remarks The velocity is copied in place, so a jump allocates nothing.
 */
export class Jump {
  private isHeldValue = false;

  /** Ticks since takeoff; `null` on the ground. */
  private airTick: number | null = null;

  private heightValue = 0;

  private readonly takeoffVelocity: MutableVec2 = { x: 0, y: 0 };

  /** Whether the jump key is held: a held key jumps again on each landing. */
  public get isHeld(): boolean {
    return this.isHeldValue;
  }

  /** Whether the Legend is in the air, from the takeoff tick until it lands. */
  public get isAirborne(): boolean {
    return this.airTick !== null;
  }

  /** Metres above the ground; 0 on the ground. */
  public get height(): number {
    return this.heightValue;
  }

  /** The movement per tick kept from takeoff; zero on the ground. Read it, do not keep it. */
  public get velocity(): Vec2 {
    return this.takeoffVelocity;
  }

  /** The fields that change the Legend's future, for `StateHasher` (the height follows from them). */
  public get fields(): readonly (number | boolean | null)[] {
    return [this.isHeldValue, this.airTick, this.takeoffVelocity.x, this.takeoffVelocity.y];
  }

  /** Records whether the jump key is held, from the `jump` command. */
  public hold(isHeld: boolean): void {
    this.isHeldValue = isHeld;
  }

  /** Leaves the ground with `velocity`, which the Legend keeps until it lands. */
  public takeOff(velocity: Vec2): void {
    this.airTick = 0;
    this.heightValue = 0;
    this.takeoffVelocity.x = velocity.x;
    this.takeoffVelocity.y = velocity.y;
  }

  /**
   * One tick of the arc: a parabola that peaks at `peakHeight` halfway through `airTicks` and
   * lands (back on the ground, no velocity) once `airTicks` have passed. Does nothing on the
   * ground.
   */
  public advance({ airTicks, peakHeight }: LegendJump): void {
    if (this.airTick === null) {
      return;
    }
    const tick = this.airTick + 1;
    if (tick >= airTicks) {
      this.land();
      return;
    }
    this.airTick = tick;
    this.heightValue = (4 * peakHeight * tick * (airTicks - tick)) / (airTicks * airTicks);
  }

  /** Back on the ground with the key released (a Legend that returns from death or a Duel round). */
  public reset(): void {
    this.isHeldValue = false;
    this.land();
  }

  private land(): void {
    this.airTick = null;
    this.heightValue = 0;
    this.takeoffVelocity.x = 0;
    this.takeoffVelocity.y = 0;
  }
}

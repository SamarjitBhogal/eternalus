import type { Vec2 } from '../utils/geometry.types';
import type { StuckWindow } from './ChaseWatch.types';

/**
 * How a unit's chase of its attack target is going (owner 2026-11-05, DEC-193): its gap to the
 * point it heads for (its target, or its detour waypoint once it was stuck) when its current window
 * started (its last progress, new target, waypoint or stuck call), when that was, and the
 * waypoint. `StuckSystem` adds, updates and removes it;
 * `PathingSystem` and the bot Legends steer to `waypoint` while there is one.
 */
export class ChaseWatch {
  private watchedId: string | null = null;

  private closest = 0;

  private sinceTick = 0;

  private readonly way = { x: 0, y: 0 };

  private hasWay = false;

  private isPlanDueValue = false;

  /** The point the detour heads for next, or `null` when the unit chases straight. */
  public get waypoint(): Vec2 | null {
    return this.hasWay ? this.way : null;
  }

  /**
   * Whether the unit waits for an A\* plan: stuck, or at its waypoint, on a tick whose plan budget
   * was spent (`requestPlan`). `headFor` and `dropWaypoint` answer it.
   */
  public get isPlanDue(): boolean {
    return this.isPlanDueValue;
  }

  /** The fields that change the unit's future, for `StateHasher`. */
  public get fields(): readonly (string | number | boolean | null)[] {
    return [
      this.watchedId,
      this.closest,
      this.sinceTick,
      this.hasWay,
      this.way.x,
      this.way.y,
      this.isPlanDueValue,
    ];
  }

  /** Marks the unit as due an A\* plan, which it keeps until `headFor` or `dropWaypoint`. */
  public requestPlan(): void {
    this.isPlanDueValue = true;
  }

  /**
   * Records `window.tick`'s `gap` to what the unit heads for (its waypoint while it has one, else
   * the point of `targetId` it aims at) and returns `true` when it is stuck: no `minProgress`
   * closer for `windowTicks`; a fresh window then starts. A new target or being in reach drops the
   * waypoint and any plan due, and starts a fresh window too.
   */
  public observe(targetId: string, gap: number, isInReach: boolean, window: StuckWindow): boolean {
    const { tick } = window;
    if (targetId !== this.watchedId || isInReach) {
      this.watchedId = targetId;
      this.hasWay = false;
      this.isPlanDueValue = false;
      this.restart(gap, tick);
      return false;
    }
    if (gap <= this.closest - window.minProgress) {
      this.restart(gap, tick);
      return false;
    }
    if (tick - this.sinceTick < window.windowTicks) {
      return false;
    }
    this.restart(gap, tick);
    return true;
  }

  /** Heads the detour for `(x, y)`, `gap` away, judging progress toward it from `tick`. */
  public headFor(x: number, y: number, gap: number, tick: number): void {
    this.way.x = x;
    this.way.y = y;
    this.hasWay = true;
    this.isPlanDueValue = false;
    this.restart(gap, tick);
  }

  /** Drops the waypoint: the unit chases straight again, `gap` from its target at `tick`. */
  public dropWaypoint(gap: number, tick: number): void {
    this.hasWay = false;
    this.isPlanDueValue = false;
    this.restart(gap, tick);
  }

  private restart(gap: number, tick: number): void {
    this.closest = gap;
    this.sinceTick = tick;
  }
}

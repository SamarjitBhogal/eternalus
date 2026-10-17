import type { HordeSteeringProfile } from '../../content/ai/ai.types';
import { sqrt } from '../../utils/deterministicMath';
import type { Vec2 } from '../../utils/geometry.types';
import { length } from '../../utils/vec2';
import type { MutableVec2 } from '../../utils/vec2.types';
import type { Crowd } from './LaneFollowMovementStrategy.types';

/**
 * How a lane-horde mob steers (architecture 18 §5.2): toward its formation slot until it is
 * within `slotArrivalRadius`, plus separation from every neighbour (10 §9, MS-19). Holds no
 * per-unit state and allocates nothing per call.
 *
 * @remarks ponytail: a plain class, not behind a `MovementStrategy` interface, while it is the
 * only strategy `PathingSystem` runs; add the interface and the registry with the second one.
 * Wall avoidance and the flow field join with terrain-aware routing (minion plan M4).
 */
export class LaneFollowMovementStrategy {
  private crowd: Crowd | null = null;
  private selfIndex = -1;
  private pushX = 0;
  private pushY = 0;

  /** @param profile - Distances and weights; the strategy holds no numbers of its own. */
  public constructor(private readonly profile: HordeSteeringProfile) {}

  /** The grid cell size that keeps a neighbour query to the 3 × 3 cells around a unit. */
  public get neighbourRadius(): number {
    return this.profile.separationRadius;
  }

  /**
   * Writes the steer of the mob at `index` in `crowd` into `out`: toward `slot`, or none once
   * within `slotArrivalRadius`, plus the separation push; a steer shorter than `minSteer` is none.
   */
  public steer(out: MutableVec2, crowd: Crowd, index: number, slot: Vec2): void {
    const x = crowd.xs[index] ?? 0;
    const y = crowd.ys[index] ?? 0;
    const dx = slot.x - x;
    const dy = slot.y - y;
    const gap = sqrt(dx * dx + dy * dy);
    const isThere = gap <= this.profile.slotArrivalRadius;
    out.x = isThere ? 0 : dx / gap;
    out.y = isThere ? 0 : dy / gap;
    this.crowd = crowd;
    this.selfIndex = index;
    this.pushX = 0;
    this.pushY = 0;
    crowd.hash.forEachNear(x, y, this.profile.separationRadius, this.pushFrom);
    out.x += this.pushX;
    out.y += this.pushY;
    if (length(out) < this.profile.minSteer) {
      out.x = 0;
      out.y = 0;
    }
  }

  /** Bound once, so a query allocates no closure. */
  private readonly pushFrom = (other: number): void => {
    const crowd = this.crowd;
    const self = this.selfIndex;
    if (crowd === null || other === self) {
      return;
    }
    const dx = (crowd.xs[self] ?? 0) - (crowd.xs[other] ?? 0);
    const dy = (crowd.ys[self] ?? 0) - (crowd.ys[other] ?? 0);
    const gap = sqrt(dx * dx + dy * dy);
    const { separationRadius, separationWeight } = this.profile;
    if (gap === 0 || gap >= separationRadius) {
      return;
    }
    // Away from the neighbour: full weight at contact, nothing at the radius.
    const strength = (separationWeight * (separationRadius - gap)) / separationRadius;
    this.pushX += (dx / gap) * strength;
    this.pushY += (dy / gap) * strength;
  };
}

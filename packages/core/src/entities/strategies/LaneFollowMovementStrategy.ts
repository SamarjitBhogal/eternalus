import type { HordeSteeringProfile } from '../../content/ai/ai.types';
import { sqrt } from '../../utils/deterministicMath';
import type { Vec2 } from '../../utils/geometry.types';
import { length } from '../../utils/vec2';
import type { MovementContext, MovementStrategy } from './MovementStrategy.types';

/**
 * How a lane-horde mob steers (architecture 18 §5.2): toward its formation slot until it is
 * within `slotArrivalRadius`, or along the lane's flow field while the next `blockedLookAhead` of
 * the straight line to the slot crosses unwalkable ground, plus separation from every neighbour
 * (10 §9, MS-19). Stateless: it reads the context's buffers, writes `context.out` and allocates
 * nothing.
 *
 * @remarks ponytail: no wall avoidance term yet (it arrives with `CollisionSystem`, 10 §8);
 * separation falls off linearly, not as 1/r (minion plan §2).
 */
export class LaneFollowMovementStrategy implements MovementStrategy {
  /** @param profile - Distances and weights; the strategy holds no numbers of its own. */
  public constructor(private readonly profile: HordeSteeringProfile) {}

  /** Toward the slot, or none once there, plus the separation push; below `minSteer` is none. */
  public desiredVelocity(self: number, context: MovementContext): Vec2 {
    const { xs, ys, target, out, found } = context;
    const { slotArrivalRadius, separationRadius, separationWeight, minSteer } = this.profile;
    const x = xs[self] ?? 0;
    const y = ys[self] ?? 0;
    const dx = target.x - x;
    const dy = target.y - y;
    const gap = sqrt(dx * dx + dy * dy);
    const isThere = gap <= slotArrivalRadius;
    const { flow } = context;
    // The lane flow field takes over where the straight line to the slot is blocked (MS-19).
    const isRouted =
      !isThere &&
      flow !== null &&
      !flow.isLineClear(x, y, target.x, target.y, this.profile.blockedLookAhead) &&
      flow.directionAt(x, y, out);
    if (!isRouted) {
      out.x = isThere ? 0 : dx / gap;
      out.y = isThere ? 0 : dy / gap;
    }
    const count = context.neighbours.collectNear(x, y, separationRadius, found);
    for (let at = 0; at < count; at += 1) {
      const other = found[at] ?? self;
      const awayX = x - (xs[other] ?? x);
      const awayY = y - (ys[other] ?? y);
      const apart = sqrt(awayX * awayX + awayY * awayY);
      if (other === self || apart === 0 || apart >= separationRadius) {
        continue;
      }
      // Away from the neighbour: full weight at contact, nothing at the radius.
      const strength = (separationWeight * (separationRadius - apart)) / separationRadius;
      out.x += (awayX / apart) * strength;
      out.y += (awayY / apart) * strength;
    }
    if (length(out) < minSteer) {
      out.x = 0;
      out.y = 0;
    }
    return out;
  }
}

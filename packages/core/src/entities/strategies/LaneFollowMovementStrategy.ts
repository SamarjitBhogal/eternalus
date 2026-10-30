import type { HordeSteeringProfile } from '../../content/ai/ai.types';
import { sqrt } from '../../utils/deterministicMath';
import type { Vec2 } from '../../utils/geometry.types';
import { length } from '../../utils/vec2';
import type { MovementContext, MovementStrategy } from './MovementStrategy.types';

/**
 * How a lane-horde mob steers (architecture 18 §5.2): toward its target (its formation slot, or
 * the unit it chases) until it is within the context's `arrivalRadius`, plus separation from every
 * neighbour (10 §9, MS-19). While the next `blockedLookAhead` of the straight line to the target
 * crosses unwalkable ground, a marching mob follows the lane's flow field instead and a chasing
 * mob holds there. Whatever the final heading (separation included), a mob it would take onto
 * unwalkable ground holds. Stateless: it reads the context's buffers, writes `context.out` and allocates
 * nothing.
 *
 * @remarks ponytail: no wall avoidance term yet (it arrives with `CollisionSystem`, 10 §8);
 * separation falls off linearly, not as 1/r (minion plan §3). A chase blocked by terrain holds
 * until target-aware routing (an A* path to the target) lets it go round.
 */
export class LaneFollowMovementStrategy implements MovementStrategy {
  /** @param profile - Distances and weights; the strategy holds no numbers of its own. */
  public constructor(private readonly profile: HordeSteeringProfile) {}

  /** Toward the target, or none once there, plus the separation push; below `minSteer` is none. */
  public desiredVelocity(self: number, context: MovementContext): Vec2 {
    const { positions, target, out, found, arrivalRadius } = context;
    const { separationRadius, separationWeight, minSteer, blockedLookAhead } = this.profile;
    const x = positions[2 * self] ?? 0;
    const y = positions[2 * self + 1] ?? 0;
    const dx = target.x - x;
    const dy = target.y - y;
    const gap = sqrt(dx * dx + dy * dy);
    const isThere = gap <= arrivalRadius;
    const { flow, isChasing } = context;
    const isBlocked =
      !isThere && flow !== null && !flow.isLineClear(x, y, target.x, target.y, blockedLookAhead);
    // Where the straight line is blocked a march follows the lane flow field (MS-19); a chase
    // holds, since the lane field leads to the lane's end, not to the chased unit.
    const isRouted = isBlocked && !isChasing && flow.directionAt(x, y, out);
    const isHeld = isThere || (isBlocked && isChasing);
    if (!isRouted) {
      out.x = isHeld ? 0 : dx / gap;
      out.y = isHeld ? 0 : dy / gap;
    }
    const count = context.neighbours.queryCircle(x, y, separationRadius, found);
    for (let at = 0; at < count; at += 1) {
      const other = found[at] ?? self;
      const awayX = x - (positions[2 * other] ?? x);
      const awayY = y - (positions[2 * other + 1] ?? y);
      const apart = sqrt(awayX * awayX + awayY * awayY);
      if (other === self || apart === 0 || apart >= separationRadius) {
        continue;
      }
      // Away from the neighbour: full weight at contact, nothing at the radius.
      const strength = (separationWeight * (separationRadius - apart)) / separationRadius;
      out.x += (awayX / apart) * strength;
      out.y += (awayY / apart) * strength;
    }
    // The final heading, separation included, never steps onto unwalkable ground (18 §5.2:
    // obstacle avoidance comes first); a mob it would take there holds this tick instead. A chase
    // with a clear line probes only up to its target, where arrival stops it, so ground beyond a
    // reachable target never holds it out of attack reach. A march keeps the full look-ahead,
    // which keeps formations from edging into a wall's face.
    const steer = length(out);
    const probe = isChasing && !isBlocked ? Math.min(blockedLookAhead, gap) : blockedLookAhead;
    const isIntoBlocked =
      flow !== null &&
      steer >= minSteer &&
      !flow.isLineClear(x, y, x + (out.x / steer) * probe, y + (out.y / steer) * probe, probe);
    if (steer < minSteer || isIntoBlocked) {
      out.x = 0;
      out.y = 0;
    }
    return out;
  }
}

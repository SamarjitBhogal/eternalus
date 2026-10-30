import type { HordeSteeringProfile } from '../../content/ai/ai.types';
import { sqrt } from '../../utils/deterministicMath';
import type { Vec2 } from '../../utils/geometry.types';
import { addSeparation } from './addSeparation';
import type { MovementContext, MovementStrategy } from './MovementStrategy.types';

/**
 * How a lane-horde mob steers (architecture 18 §5.2): toward its target (its formation slot, or
 * the unit it chases) until it is within the context's `arrivalRadius`, plus separation from every
 * neighbour (10 §9, MS-19). While the next `blockedLookAhead` of the straight line to the target
 * crosses unwalkable ground, a marching mob follows the lane's flow field instead and a chasing
 * mob holds there. Stateless: it reads the context's buffers, writes `context.out` and allocates
 * nothing.
 *
 * @remarks ponytail: no wall avoidance term yet (it arrives with `CollisionSystem`, 10 §8);
 * separation falls off linearly, not as 1/r (minion plan §2). A chase blocked by terrain holds
 * until target-aware routing (an A* path to the target) lets it go round.
 */
export class LaneFollowMovementStrategy implements MovementStrategy {
  /** @param profile - Distances and weights; the strategy holds no numbers of its own. */
  public constructor(private readonly profile: HordeSteeringProfile) {}

  /** Toward the target, or none once there, plus the separation push; below `minSteer` is none. */
  public desiredVelocity(self: number, context: MovementContext): Vec2 {
    const { positions, target, out, arrivalRadius } = context;
    const x = positions[2 * self] ?? 0;
    const y = positions[2 * self + 1] ?? 0;
    const dx = target.x - x;
    const dy = target.y - y;
    const gap = sqrt(dx * dx + dy * dy);
    const isThere = gap <= arrivalRadius;
    const { flow, isChasing } = context;
    const isBlocked =
      !isThere &&
      flow !== null &&
      !flow.isLineClear(x, y, target.x, target.y, this.profile.blockedLookAhead);
    // Where the straight line is blocked a march follows the lane flow field (MS-19); a chase
    // holds, since the lane field leads to the lane's end, not to the chased unit.
    const isRouted = isBlocked && !isChasing && flow.directionAt(x, y, out);
    const isHeld = isThere || (isBlocked && isChasing);
    if (!isRouted) {
      out.x = isHeld ? 0 : dx / gap;
      out.y = isHeld ? 0 : dy / gap;
    }
    addSeparation(self, x, y, context, this.profile);
    return out;
  }
}

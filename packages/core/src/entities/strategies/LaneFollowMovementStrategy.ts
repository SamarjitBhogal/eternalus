import type { HordeSteeringProfile } from '../../content/ai/ai.types';
import { sqrt } from '../../utils/deterministicMath';
import type { Vec2 } from '../../utils/geometry.types';
import { length } from '../../utils/vec2';
import type { MovementContext, MovementStrategy } from './MovementStrategy.types';

/**
 * How a lane-horde mob steers (architecture 18 §5.2): toward its target (its formation slot, or
 * the unit it chases) until it is within the context's `arrivalRadius`, plus separation from every
 * neighbour (10 §9, MS-19). Stateless: it reads the context's buffers, writes `context.out` and
 * allocates nothing.
 *
 * @remarks ponytail: wall avoidance and the flow field join with terrain-aware routing (minion
 * plan M4); separation falls off linearly, not as 1/r (minion plan §3).
 */
export class LaneFollowMovementStrategy implements MovementStrategy {
  /** @param profile - Distances and weights; the strategy holds no numbers of its own. */
  public constructor(private readonly profile: HordeSteeringProfile) {}

  /** Toward the target, or none once there, plus the separation push; below `minSteer` is none. */
  public desiredVelocity(self: number, context: MovementContext): Vec2 {
    const { positions, target, out, found, arrivalRadius } = context;
    const { separationRadius, separationWeight, minSteer } = this.profile;
    const x = positions[2 * self] ?? 0;
    const y = positions[2 * self + 1] ?? 0;
    const dx = target.x - x;
    const dy = target.y - y;
    const gap = sqrt(dx * dx + dy * dy);
    const isThere = gap <= arrivalRadius;
    out.x = isThere ? 0 : dx / gap;
    out.y = isThere ? 0 : dy / gap;
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
    if (length(out) < minSteer) {
      out.x = 0;
      out.y = 0;
    }
    return out;
  }
}

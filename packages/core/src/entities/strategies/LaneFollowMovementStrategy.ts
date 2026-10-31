import type { HordeSteeringProfile } from '../../content/ai/ai.types';
import { sqrt } from '../../utils/deterministicMath';
import type { Vec2 } from '../../utils/geometry.types';
import { length } from '../../utils/vec2';
import type { MutableVec2 } from '../../utils/vec2.types';
import type { FlowQuery, MovementContext, MovementStrategy } from './MovementStrategy.types';

/**
 * How a lane-horde mob steers (architecture 18 §5.2): toward its target (its formation slot, or
 * the unit it chases) until it is within the context's `arrivalRadius`, plus separation from every
 * neighbour (10 §9, MS-19). While the next `blockedLookAhead` of the straight line to the target
 * crosses unwalkable ground, a marching mob follows the lane's flow field instead; a chasing mob,
 * or a march the field cannot route, holds there. A chase standing on unwalkable ground (a member
 * spawned inside its structure's footprint) follows the field out like a march (MS-31, DEC-126). A final heading (separation included) that
 * would take a mob onto unwalkable ground turns along the wall instead: the mob faces and walks
 * the open axis of its heading. A chase with no open axis holds; a march keeps its heading, and
 * the wall cells' field leads it back out (10 §9). Stateless: it reads the context's buffers,
 * writes `context.out` and allocates nothing.
 *
 * @remarks ponytail: no wall avoidance term yet (it arrives with `CollisionSystem`, 10 §8), so the
 * wall turn reads the grid's axes, not the contact normal. A chase blocked by terrain holds until
 * target-aware routing (an A* path to the target) lets it go round.
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
    // holds, since the lane field leads to the lane's end, not to the chased unit, and so does a
    // march where the field has no direction. A chase on unwalkable ground, where no line is
    // clear, follows the field out of it like a march (MS-31).
    const isMarching = !isChasing || (flow !== null && !flow.isWalkableAt(x, y));
    const isRouted = isBlocked && isMarching && flow.directionAt(x, y, out);
    const isHeld = isThere || (isBlocked && !isRouted);
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
      // Away from the neighbour, weighted 1/r (10 §9) and shifted to reach 0 at the radius.
      const strength = (separationWeight * (separationRadius - apart)) / apart;
      out.x += (awayX / apart) * strength;
      out.y += (awayY / apart) * strength;
    }
    // The final heading, separation included, never steps onto unwalkable ground (18 §5.2:
    // obstacle avoidance comes first): one that would turns along the wall, and a chase that
    // cannot turn holds. A march that cannot turn keeps its heading: holding it there for good
    // would strand it, since nothing else moves it on. A chase with a clear line probes only up to
    // its target, where arrival stops it, so ground beyond a reachable target never holds it out
    // of attack reach. A march keeps the full look-ahead, so it turns along a wall's face before
    // it edges into it.
    const steer = length(out);
    const probe = isChasing && !isBlocked ? Math.min(blockedLookAhead, gap) : blockedLookAhead;
    const isIntoBlocked =
      flow !== null &&
      steer >= minSteer &&
      !flow.isLineClear(x, y, x + (out.x / steer) * probe, y + (out.y / steer) * probe, probe);
    const isStopped =
      steer < minSteer || (isIntoBlocked && !this.slide(flow, x, y, probe, out) && !isMarching);
    if (isStopped) {
      out.x = 0;
      out.y = 0;
    }
    return out;
  }

  /**
   * Turns `out` along a wall: to its larger axis component, or else its smaller one, whose next
   * `probe` is walkable; a component under `minSteer` counts as none. The mob then faces the way
   * it moves, never sliding sideways. Returns `false`, leaving `out` as it was, when neither turns.
   */
  private slide(flow: FlowQuery, x: number, y: number, probe: number, out: MutableVec2): boolean {
    const isXFirst = Math.abs(out.x) >= Math.abs(out.y);
    return (
      this.turnAlong(flow, x, y, probe, out, isXFirst) ||
      this.turnAlong(flow, x, y, probe, out, !isXFirst)
    );
  }

  /** Keeps only `out`'s x (or y) component, when it is at least `minSteer` and its probe is open. */
  private turnAlong(
    flow: FlowQuery,
    x: number,
    y: number,
    probe: number,
    out: MutableVec2,
    isX: boolean,
  ): boolean {
    const along = isX ? out.x : out.y;
    const step = Math.sign(along) * probe;
    const isOpen =
      Math.abs(along) >= this.profile.minSteer &&
      flow.isLineClear(x, y, isX ? x + step : x, isX ? y : y + step, probe);
    if (isOpen) {
      out.x = isX ? along : 0;
      out.y = isX ? 0 : along;
    }
    return isOpen;
  }
}

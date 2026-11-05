import type { HordeSteeringProfile } from '../../content/ai/ai.types';
import { sqrt } from '../../utils/deterministicMath';
import type { Vec2 } from '../../utils/geometry.types';
import { addSeparation } from './addSeparation';
import type { MovementContext, MovementStrategy } from './MovementStrategy.types';

/**
 * How a guard steers (architecture 18 §7, 10 §9 "seek/arrival inside their leash"): toward its
 * target (the unit it chases, or its post) until within the context's `arrivalRadius`, plus
 * separation from every neighbour. It never follows a lane flow field. Keeping inside the leash
 * is the controller's job: it stops the chase and the post becomes the target again. Stateless.
 */
export class LeashedChaseMovementStrategy implements MovementStrategy {
  /** @param profile - Separation distances and weights; the strategy holds no numbers of its own. */
  public constructor(
    private readonly profile: Pick<
      HordeSteeringProfile,
      'separationRadius' | 'separationWeight' | 'minSteer'
    >,
  ) {}

  /** Toward the target, or none once there, plus the separation push. */
  public desiredVelocity(self: number, context: MovementContext): Vec2 {
    const { positions, target, out, arrivalRadius } = context;
    const x = positions[2 * self] ?? 0;
    const y = positions[2 * self + 1] ?? 0;
    const dx = target.x - x;
    const dy = target.y - y;
    const gap = sqrt(dx * dx + dy * dy);
    const isThere = gap <= arrivalRadius;
    out.x = isThere ? 0 : dx / gap;
    out.y = isThere ? 0 : dy / gap;
    addSeparation(self, x, y, context, this.profile);
    return out;
  }
}

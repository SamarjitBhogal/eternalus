import type { HordeSteeringProfile } from '../../content/ai/ai.types';
import { length } from '../../utils/vec2';
import { sqrt } from '../../utils/deterministicMath';
import type { MovementContext } from './MovementStrategy.types';

/**
 * Adds the separation push from every neighbour within `separationRadius` to `context.out` (10 §9,
 * MS-19): full weight at contact, nothing at the radius. Zeroes a result shorter than `minSteer`,
 * so a settled crowd stands still. Shared by the movement strategies; allocates nothing.
 */
export const addSeparation = (
  self: number,
  x: number,
  y: number,
  context: MovementContext,
  profile: Pick<HordeSteeringProfile, 'separationRadius' | 'separationWeight' | 'minSteer'>,
): void => {
  const { positions, found, out } = context;
  const { separationRadius, separationWeight, minSteer } = profile;
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
};

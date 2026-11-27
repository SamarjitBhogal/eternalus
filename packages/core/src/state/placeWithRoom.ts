import type { Vec2 } from '../utils/geometry.types';
import type { CollisionQuery } from './CollisionQuery.types';

/**
 * Where a body of `radius` at `at` stands once the walls push it out (`CollisionQuery.pushOut`),
 * or `null` when the push leaves it in a wall (`hasRoom`): a gap narrower than the body. The one
 * room test for a body that grows: `BodySizeSystem` grows a body only where this gives a place,
 * and `BuffEffect` refuses a cast whose status would grow the caster where it gives none
 * (`no-room`; DEC-365, DEC-382, `INBOX.md` HC-Q113).
 */
export const placeWithRoom = (
  collisions: CollisionQuery,
  at: Vec2,
  radius: number,
): Vec2 | null => {
  const freed = collisions.pushOut(at, radius);
  return collisions.hasRoom(freed, radius) ? freed : null;
};

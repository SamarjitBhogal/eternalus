import type { Vec2 } from '../utils/geometry.types';
import type { EntityId } from './EntityStore.types';
import type { EntitySnapshot } from './Snapshot.types';

/**
 * Selects the Cathedral gem whose hit circle (snapshot position and `radius`) holds `point` (world
 * units), so the player can aim an attack at it (DEC-292: "anyone including the player"). A unit
 * there wins over the gem, and the gem over the building's map objects (the pick order of DEC-150
 * and DEC-183, with the gem between them, as it is drawn over the floor and under the units).
 *
 * @returns The gem's entity id, or `null` when no gem is under the point.
 */
export const findGemAt = (entities: readonly EntitySnapshot[], point: Vec2): EntityId | null => {
  for (const { id, gem, transform } of entities) {
    if (gem === null || transform === null) continue;
    const dx = transform.x - point.x;
    const dy = transform.y - point.y;
    // Squared distances: core keeps transcendental Math out (ADR 0012).
    if (dx * dx + dy * dy <= transform.radius * transform.radius) return id;
  }
  return null;
};

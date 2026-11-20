import { isUnitFamily } from '../entities/unitFamilies';
import type { Vec2 } from '../utils/geometry.types';
import type { EntityId } from './EntityStore.types';
import type { EntitySnapshot } from './Snapshot.types';

/**
 * Selects the living enemy unit (Legend, mob or boss) drawn under `point` (world units): the
 * snapshot position and `radiusFor` set its disc. The default uses the collider radius.
 * Allies (the attacker included) and dead units are
 * skipped. Where discs overlap the unit drawn on top wins: the largest `y`, the order of
 * the client's `EntityLayer.draw` (a later entity wins a tie as it is drawn later; DEC-183). Structures and map
 * objects are no units, so a click on a unit wins over the building behind it.
 *
 * ponytail: the hit test uses the snapshot position; the drawn one is interpolated up to one tick
 * (about 0.12 world units) behind it. Fine at the smallest radius of 0.4. Upgrade: pass the
 * interpolated position if units get smaller or faster.
 *
 * @returns The unit's entity id, or `null` when none is under the point.
 */
export const findUnitAt = (
  entities: readonly EntitySnapshot[],
  actorId: EntityId,
  point: Vec2,
  radiusFor: (family: string, colliderRadius: number) => number = (_, radius) => radius,
): EntityId | null => {
  const actorTeam = entities.find((entity) => entity.id === actorId)?.team ?? null;
  let selected: EntityId | null = null;
  let frontY = -Infinity;
  for (const { id, family, team, transform, health } of entities) {
    if (
      team === actorTeam ||
      !isUnitFamily(family) ||
      transform === null ||
      health === null ||
      health.current <= 0
    ) {
      continue;
    }
    const dx = transform.x - point.x;
    const dy = transform.y - point.y;
    // Squared distances: core keeps transcendental Math out (ADR 0012).
    const radius = radiusFor(family, transform.radius);
    const isUnderPoint = dx * dx + dy * dy <= radius * radius;
    if (isUnderPoint && transform.y >= frontY) {
      selected = id;
      frontY = transform.y;
    }
  }
  return selected;
};

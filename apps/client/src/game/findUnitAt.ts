import type { EntityId, EntitySnapshot, Vec2 } from '@eternalus/core';

import { UNIT_FAMILIES } from './findUnitAt.constants';

/**
 * Selects the living enemy unit (Legend, mob or boss) drawn under `point` (world units): the
 * snapshot position and `radius` set its disc. Allies, the attacker and dead units are skipped;
 * where discs overlap the nearest centre wins. Structures and map objects are no units, so a click
 * on a unit wins over the building behind it (it is drawn on top).
 *
 * @returns The unit's entity id, or `null` when none is under the point.
 */
export const findUnitAt = (
  entities: readonly EntitySnapshot[],
  actorId: EntityId,
  point: Vec2,
): EntityId | null => {
  const actorTeam = entities.find((entity) => entity.id === actorId)?.team ?? null;
  let selected: EntityId | null = null;
  let nearest = Infinity;
  for (const { id, family, team, transform, health } of entities) {
    const isEnemy = actorTeam === null || team !== actorTeam;
    if (
      id === actorId ||
      !isEnemy ||
      !UNIT_FAMILIES.includes(family) ||
      transform === null ||
      health === null ||
      health.current <= 0
    ) {
      continue;
    }
    const distance = Math.hypot(transform.x - point.x, transform.y - point.y);
    if (distance <= transform.radius && distance < nearest) {
      selected = id;
      nearest = distance;
    }
  }
  return selected;
};

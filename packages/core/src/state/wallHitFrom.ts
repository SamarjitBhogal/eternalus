import type { MapObject } from '../content/maps/mapObjects.types';
import type { Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';
import { nearestPointOnPolygons } from '../utils/geometry';

/**
 * The fort wall of a structure's `body` that a hit from `from` lands on, or `undefined` when a part
 * of the body that is no wall (the keep) is nearer. `DamageSource` carries no hit point, so the
 * wall is the one nearest `from` (attack reach is measured to that nearest point,
 * `EntityStore.aimPointOf`); the lower index wins a tie. `aim` is scratch space the call writes
 * into, so a caller can reuse one object.
 */
export const wallHitFrom = (
  body: readonly MapObject[],
  from: Vec2,
  aim: MutableVec2,
): MapObject | undefined => {
  let wall: MapObject | undefined;
  let wallGap = Number.POSITIVE_INFINITY;
  let ownGap = Number.POSITIVE_INFINITY;
  for (const object of body) {
    const gap = nearestPointOnPolygons(from, object.footprints, aim);
    if (object.partOf === undefined) ownGap = Math.min(ownGap, gap);
    else if (gap < wallGap) [wall, wallGap] = [object, gap];
  }
  return wallGap <= ownGap ? wall : undefined;
};

import type { DuelArenaRules } from '../content/duel/duelRules.types';
import type { MapObject } from '../content/maps/mapObjects.types';

/** Whether a Duel keeps `object` (DEC-348): no structure's object and nothing a side built. */
const isKept = (object: MapObject, arena: DuelArenaRules): boolean =>
  !arena.omittedObjectKinds.includes(object.kind) &&
  !(arena.omitsSideObjects && object.team !== undefined);

/** `object` as a Duel has it: a closed barrier blocks (SCRUM-450), a Cathedral wall cannot break. */
const inDuel = (
  object: MapObject,
  arena: DuelArenaRules,
  cathedralId: string | undefined,
): MapObject => {
  const isBarrier = arena.isCathedralClosed && object.isDuelBarrier === true;
  const isUnbreakable =
    cathedralId !== undefined &&
    object.buildingId === cathedralId &&
    arena.unbreakableCathedralKinds.includes(object.kind);
  if (!isBarrier && !isUnbreakable) return object;
  return {
    ...object,
    ...(isBarrier && { isBlocking: true }),
    ...(isUnbreakable && { isUnbreakable: true as const }),
  };
};

/**
 * A Duel's map objects. It drops the objects of the structures a Duel does not build and everything
 * a side built (DEC-348), so no removed tower, gate, camp or Stronghold leaves an obstacle behind;
 * trees, houses, rocks and the Cathedral stay. When `arena` closes the Cathedral, every Duel barrier
 * (its entrances, `MapObject.isDuelBarrier`) blocks, so collision and the walk grid keep both
 * Legends inside (SCRUM-450). The Cathedral's objects of `arena.unbreakableCathedralKinds` (its
 * walls) become `isUnbreakable` (DEC-348). Every other object is unchanged.
 *
 * @param objects - The map's objects as `MapObjectBuilder` built them.
 * @param arena - The Duel's arena rules (`DUEL_RULES.arena`).
 * @param cathedralId - The map's Cathedral feature id (its objects' `buildingId`), if it has one.
 */
export const duelMapObjects = (
  objects: readonly MapObject[],
  arena: DuelArenaRules,
  cathedralId?: string,
): readonly MapObject[] =>
  objects
    .filter((object) => isKept(object, arena))
    .map((object) => inDuel(object, arena, cathedralId));

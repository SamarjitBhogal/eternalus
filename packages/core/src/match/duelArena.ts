import type { DuelArenaRules } from '../content/duel/duelRules.types';
import type { MapObject } from '../content/maps/mapObjects.types';

/**
 * A Duel's map objects (SCRUM-450): when `arena` closes the Cathedral, every Duel barrier (its
 * entrances, `MapObject.isDuelBarrier`) blocks, so collision and the walk grid keep both Legends
 * inside. Other objects, and every object outside such a Duel, are unchanged.
 *
 * @param objects - The map's objects as `MapObjectBuilder` built them.
 * @param arena - The Duel's arena rules (`DUEL_RULES.arena`).
 */
export const duelMapObjects = (
  objects: readonly MapObject[],
  arena: DuelArenaRules,
): readonly MapObject[] =>
  arena.isCathedralClosed
    ? objects.map((object) =>
        object.isDuelBarrier === true ? { ...object, isBlocking: true } : object,
      )
    : objects;

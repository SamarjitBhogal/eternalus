import type { MapObjectKind } from '../maps/mapObjects.types';

/**
 * What of a normal match's world a Duel keeps (DEC-36: "the surrounding world is deactivated";
 * DEC-348: no structures, no minions, the Cathedral's walls cannot break). Each switch is read
 * where that part of the world is built, so a Duel needs no `if (duel)` in a system's per-tick
 * logic.
 */
export type DuelArenaRules = {
  /** Whether minions, tower guards and camp units spawn and respawn (SCRUM-445, DEC-348). */
  readonly spawnsMobs: boolean;
  /** Whether the capture objectives (capture points and the Cathedral's) exist (SCRUM-446). */
  readonly hasCaptureObjectives: boolean;
  /**
   * The structure definition ids a Duel does not build (DEC-348: towers, gates, camps and
   * Strongholds). The Cathedral and its gem (definition id `cathedral`) are not listed: they stay.
   */
  readonly omittedStructureIds: readonly string[];
  /**
   * The map-object kinds a Duel drops, so no removed structure leaves an obstacle behind (DEC-348):
   * the structures' own objects and the capture points' forts.
   */
  readonly omittedObjectKinds: readonly MapObjectKind[];
  /**
   * Whether a Duel drops every object a side built (`MapObject.team`): each palace with its walls
   * and rooms, the wall segments and turrets (DEC-348). Neutral scenery (trees, houses, rocks) stays.
   */
  readonly omitsSideObjects: boolean;
  /** Whether the Cathedral's entrances are blocked, so the Legends cannot leave it (SCRUM-450). */
  readonly isCathedralClosed: boolean;
  /**
   * The kinds of the Cathedral's own objects (`MapObject.buildingId`) that cannot break in a Duel
   * (DEC-348: "The Cathedral's walls cannot break in a Duel"). Normal matches are unchanged.
   */
  readonly unbreakableCathedralKinds: readonly MapObjectKind[];
};

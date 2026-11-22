/**
 * What of a normal match's world a Duel keeps (DEC-36: "the surrounding world is deactivated").
 * Each switch is read where that part of the world is built, so a Duel needs no `if (duel)` in a
 * system's per-tick logic.
 */
export type DuelArenaRules = {
  /** Whether minions, tower guards and camp units spawn and respawn (SCRUM-445). */
  readonly spawnsMobs: boolean;
  /** Whether the capture objectives (capture points and the Cathedral's) exist (SCRUM-446). */
  readonly hasCaptureObjectives: boolean;
  /**
   * The structure definition ids a Duel does not build: the Cathedral crystal (the gem, SCRUM-447)
   * is the structure `cathedral`. Code that adds the gem's scenery or view must leave it out too.
   */
  readonly omittedStructureIds: readonly string[];
  /** Whether the Cathedral's entrances are blocked, so the Legends cannot leave it (SCRUM-450). */
  readonly isCathedralClosed: boolean;
};

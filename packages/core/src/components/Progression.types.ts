/** Where a Legend stands inside its level (`Progression.levelProgress`; 05 §15, the HUD's XP ring). */
export type LevelProgress = {
  /** XP earned inside the current level; it starts again from the remainder on level-up. */
  readonly xp: number;
  /** XP the current level needs to reach the next; `null` at the curve's cap (DEC-224). */
  readonly xpToNext: number | null;
};

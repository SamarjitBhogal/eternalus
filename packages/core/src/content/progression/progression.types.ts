/** Kebab-case id of a level curve, e.g. `legend`. */
export type LevelCurveId = string;

/** An XP table (architecture 05 §13): how much XP each level takes, up to a cap. */
export type LevelCurveDefinition = {
  readonly id: LevelCurveId;
  /** XP from level L to L + 1, for L = 1 … cap − 1; its length is `cap − 1`. */
  readonly xpToNext: readonly number[];
  /** The highest level. */
  readonly cap: number;
};

/** What each level above 1 adds to a Legend (06 "XP-based scaling"). */
export type LevelScalingDefinition = {
  /** Fraction of base health added to max health per level (0.08 = +8%). */
  readonly healthPerLevel: number;
  /** Flat max aether added per level. */
  readonly aetherPerLevel: number;
};

/** How much XP a kill is worth (06 "XP sources"); a mob's own XP is its `xpValue` (04 §5). */
export type XpSourcesDefinition = {
  /** A Legend kill: `base + perVictimLevel × victim level`, to the killer. */
  readonly legendKill: { readonly base: number; readonly perVictimLevel: number };
  /** A destroyed structure: this much XP to every Legend of the destroying team (DEC-186). */
  readonly structureDestroyed: number;
  /**
   * The mobs whose kill pays every Legend of the killer's team instead of the killer, by mob
   * definition id: `xp` each, but never more than lifts a Legend `maxLevels` levels (DEC-237).
   */
  readonly teamKills: Readonly<Record<string, TeamKillReward>>;
};

/** A team-wide kill reward (balancing.md boss table, DEC-237). */
type TeamKillReward = {
  readonly xp: number;
  /** The most levels one award may lift a Legend; XP past that point is not paid. */
  readonly maxLevels: number;
};

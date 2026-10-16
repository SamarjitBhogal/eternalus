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

/** How much XP a kill is worth (06 "XP sources"); sources without a system yet are left out. */
export type XpSourcesDefinition = {
  /** A Legend kill: `base + perVictimLevel × victim level`, to the killer. */
  readonly legendKill: { readonly base: number; readonly perVictimLevel: number };
  /** XP for killing a unit of each kind (`light-mob`, …); a kind not listed is worth 0. */
  readonly mobKill: Readonly<Record<string, number>>;
};

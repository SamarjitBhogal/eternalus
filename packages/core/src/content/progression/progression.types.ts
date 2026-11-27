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
   * A cleared camp: this much XP to the Legend that killed its last mob, on top of the XP each camp
   * mob paid its own killer (balancing.md "Camps"), by camp structure definition id. A camp with no
   * entry pays no bonus.
   */
  readonly campCleared: Readonly<Record<string, number>>;
  /**
   * A cleared checkpoint set (07 §7): `xp[checkpoint]` shared among the clearing team's living
   * Legends within `shareRadius` metres of where its last defender fell, `share_i = xp × (evenShare
   * / n + (1 − evenShare) × damage_i / totalDamage)`, damage being what each of them dealt to the
   * set's defenders. With no damage among them, an even split. A checkpoint with no entry pays
   * nothing.
   */
  readonly checkpointCleared: {
    readonly xp: Readonly<Record<number, number>>;
    readonly shareRadius: number;
    readonly evenShare: number;
  };
  /**
   * The mobs whose kill pays every Legend of the killer's team instead of the killer, by mob
   * definition id: `xp` each, but never more than lifts a Legend `maxLevels` levels, or `levels`
   * levels whatever the XP (DEC-237), with a last hitter's `lastHitterLevels` (DEC-371 E8b).
   */
  readonly teamKills: Readonly<Record<string, TeamKillReward>>;
};

/** A team-wide kill reward (balancing.md boss table, DEC-237). */
type TeamKillReward =
  | {
      readonly xp: number;
      /** The most levels one award may lift a Legend; XP past that point is not paid. */
      readonly maxLevels: number;
    }
  | {
      /**
       * Lifts each Legend this many levels from where it stands, keeping its share of its level
       * (up to the curve's cap), "flat" (DEC-237, DEC-371 E8a).
       */
      readonly levels: number;
      /**
       * The levels the team's last hitter gets in all, instead of `levels` (DEC-371 E8b): the
       * killing Legend, or for a last hit by a minion or a tower its team's Legend that hit last
       * (DEC-416).
       */
      readonly lastHitterLevels?: number;
    };

import type { MobKind } from '../mobs/mobs.types';

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
};

/**
 * How many points each source puts in a Legend's ultimate meter (architecture 05 §6, DEC-272,
 * DEC-273). The meter holds `charge` from 0 to 1, that is `points / fullMeter`; it never fills
 * passively.
 */
export type UltimateChargeDefinition = {
  /** The points of a full meter. */
  readonly fullMeter: number;
  /** For the last hit on an enemy Legend. */
  readonly legendKill: number;
  /** For each assist on an enemy Legend's death (the scoring rule's window, DEC-79). */
  readonly assist: number;
  /**
   * For the last hit on an enemy or neutral mob, by weight class: lane minions, tower guards and
   * camp mobs alike (DEC-273). Keyed by `MobKind`, so a new weight class needs a value.
   */
  readonly mobKill: Readonly<Record<MobKind, number>>;
  /** For each 1% of an enemy structure's max health dealt (absorbed damage included). */
  readonly structureDamagePerPercent: number;
  /** For each Legend present when its team's push reaches a capture checkpoint (DEC-273). */
  readonly checkpointReached: number;
  /** Taken from the Legend's own meter at its death, whoever killed it; not below 0. */
  readonly deathLoss: number;
};

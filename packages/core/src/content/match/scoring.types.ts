import type { MobKind } from '../mobs/mobs.types';

/**
 * The points a Legend or a team earns (architecture 12 §5). `minionKill` is keyed by `MobKind`, so a new mob
 * weight class does not compile until it has a value.
 */
export type ScoringWeights = {
  /** For the last hit on an enemy Legend. */
  readonly legendKill: number;
  /** For each other Legend that hit that Legend inside the assist window. */
  readonly legendKillAssist: number;
  /** For the Legend that died. */
  readonly death: number;
  /**
   * For the last hit on a mob, by its weight class (enemy team mobs, Host units and tower guards,
   * and neutral mobs alike).
   */
  readonly minionKill: Readonly<Record<MobKind, number>>;
  /** For the team that destroys an enemy structure: team-only points, no Legend's (DEC-212). */
  readonly structureDestroyed: number;
};

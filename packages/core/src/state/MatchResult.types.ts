import type { VictoryConditionId } from '../config/VictoryConditionId.types';
import type { PlayableTeam } from '../teams/teams.types';
import type { LegendStats, TeamStats } from './ScoringState.types';

/**
 * What a `VictoryCondition` returns when the match is over (architecture 12 §6). Lives in `state/`
 * beside `MatchResult`, because `state/` may not import `match/` (02 §2).
 */
export type Verdict = {
  /** The team that won, or `null` for a draw. */
  readonly winner: PlayableTeam | null;
  readonly condition: VictoryConditionId;
};

/**
 * How a match ended (architecture 12 §10): deterministic, with no wall clock and no client ids.
 * Built once by the `MatchDirector` and kept in `state.match.result`. It holds only the fields
 * built so far: `timeline` and `achievements` arrive with the work that produces them.
 */
export type MatchResult = {
  /** The team that won, or `null` for a draw. */
  readonly winner: PlayableTeam | null;
  readonly condition: VictoryConditionId;
  /** The team the match was played (or, in sim mode, spectated) for. */
  readonly playerTeam: PlayableTeam;
  /** `false` for a pure sim match: no human Legend (`state.match.humanLegendId` was `null`). */
  readonly hadHuman: boolean;
  /** The ticks the match ran, the ending tick included (`MatchDirector` gives the exact rule). */
  readonly durationTicks: number;
  readonly seed: number;
  /** FNV-1a of the canonical config, so a replay can refuse a mismatched config. */
  readonly configHash: number;
  /** A copy of every Legend's row when the match ended, in spawn order (12 §5). */
  readonly legends: readonly Readonly<LegendStats>[];
  /** A copy of each team's totals when the match ended. */
  readonly teams: Readonly<Record<PlayableTeam, Readonly<TeamStats>>>;
  /**
   * The `StateHasher` hash of the state when the verdict came, mid-tick: before the terminal phase
   * is entered and the result stored. Not a `Simulation.hash()` between steps, a replay checkpoint
   * or `ReplayOutcome.finalHash` (the hash after a replay's last tick).
   */
  readonly finalHash: number;
};

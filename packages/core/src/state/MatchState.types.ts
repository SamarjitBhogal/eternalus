import type { MatchPhase } from '../config/matchPhases';
import type { PlayableTeam } from '../teams/teams.types';
import type { EntityId } from './EntityStore.types';
import type { MatchResult } from './MatchResult.types';
import type { ScoringState } from './ScoringState.types';

/** One timeline entry's resolved tick, kept as plain data so the snapshot can list it (12 §3). */
export type ScheduledMark = {
  readonly entryId: string;
  readonly tick: number;
};

/**
 * The match director's memory (architecture 12 §4), all plain data, so it is hashed, snapshotted
 * and replayed like the rest of the state.
 */
export type MatchState = {
  /** Changed only through `GameState.setPhase`, which also stamps `phaseEnteredTick`. */
  readonly phase: MatchPhase;
  readonly phaseEnteredTick: number;
  /** Index into `schedule` of the next unfired entry; advanced by the `MatchDirector`. */
  timelineCursor: number;
  /** Every timeline entry's tick in firing order, resolved once when the match is built. */
  readonly schedule: readonly ScheduledMark[];
  /**
   * While true every unit is idle (the countdown, DEC-88): nothing walks, attacks or casts, and
   * turning is allowed. Set by phases; read by `MovementSystem` and `CombatSystem`.
   */
  isIdleHeld: boolean;
  /** The team the match is played (or spectated) for, from `config.match.playerTeam`. */
  readonly playerTeam: PlayableTeam;
  /** The human's Legend; `null` in sim mode (11 §7), and when the seat's spawn failed. Set once by `Simulation` from `config.match.seat`. */
  humanLegendId: EntityId | null;
  /** The Legends' counters and points, and the teams' totals; written by `Scoring` (12 §5). */
  readonly scoring: ScoringState;
  /**
   * How the match ended; `null` until a verdict. Set once by the `MatchDirector`, which does
   * nothing after it. Not hashed: the terminal phase it comes with already is.
   */
  result: MatchResult | null;
};

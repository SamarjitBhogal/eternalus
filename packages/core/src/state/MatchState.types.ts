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
 * and replayed like the rest of the state. Read-only: only the writers of `MatchRecord`, which
 * holds it as `GameState.match`, change it (DEC-172, DEC-177).
 */
export interface MatchState {
  /** Changed only through `MatchRecord.setPhase`, which also stamps `phaseEnteredTick`. */
  readonly phase: MatchPhase;
  readonly phaseEnteredTick: number;
  /** Index into `schedule` of the next unfired entry; advanced only through `MatchRecord.advanceTimeline`. */
  readonly timelineCursor: number;
  /** Every timeline entry's tick in firing order, resolved once when the match is built. */
  readonly schedule: readonly ScheduledMark[];
  /**
   * While true every unit is idle (the countdown, DEC-88): nothing walks, attacks or casts, and
   * turning is allowed. Set only through `MatchRecord.holdIdle` (by phases); read by
   * `MovementSystem`, `CombatSystem` and `HordeSystem`.
   */
  readonly isIdleHeld: boolean;
  /** The team the match is played (or spectated) for, from `config.match.playerTeam`. */
  readonly playerTeam: PlayableTeam;
  /**
   * The human's Legend; `null` in sim mode (11 §7: no human slot in the roster), and when the
   * human slot names no Legend definition. Set once, only through `MatchRecord.seatHuman`, by
   * `Simulation` from the roster's human slot, when the match is built.
   */
  readonly humanLegendId: EntityId | null;
  /** The Legends' counters and points, and the teams' totals; written by `Scoring` (12 §5). */
  readonly scoring: ScoringState;
  /**
   * How the match ended; `null` until a verdict. Set once, only through `MatchRecord.endMatch`, by the
   * `MatchDirector`, which does nothing after it. Not hashed: the terminal phase it comes with
   * already is.
   */
  readonly result: MatchResult | null;
}

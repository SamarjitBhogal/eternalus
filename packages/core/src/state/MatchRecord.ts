import type { MatchPhase } from '../config/matchPhases';
import type { PlayableTeam } from '../teams/teams.types';
import { deepFreeze } from '../utils/deepFreeze';
import type { EntityId } from './EntityStore.types';
import type { GameEvents } from './GameEvents';
import type { MatchResult } from './MatchResult.types';
import type { MatchState, ScheduledMark } from './MatchState.types';
import { ScoreBook } from './ScoreBook';
import type { ScoringState } from './ScoringState.types';

/**
 * The match director's memory (architecture 12 §4), kept as `GameState.match` (DEC-177): the
 * read-only `MatchState` fields and the only writers that change them (DEC-172). Each writer has
 * one caller, named on it; the set-once writers throw on a second call. The scoring data has its
 * own writers: the `ScoreBook` this record holds (DEC-211).
 */
export class MatchRecord implements MatchState {
  /** Every timeline entry's tick in firing order, frozen when the match is built. */
  public readonly schedule: readonly ScheduledMark[];
  /**
   * The scoring data's only writer (DEC-211, 12 §5). Written by `Scoring` only, in its fold;
   * everyone else reads `scoring`.
   */
  public readonly scoreBook = new ScoreBook();
  private currentPhase: MatchPhase = 'countdown';
  private enteredTick = 0;
  private cursor = 0;
  private isHeld = false;
  private humanId: EntityId | null = null;
  private verdict: MatchResult | null = null;

  /**
   * @param playerTeam - The team the match is played (or spectated) for.
   * @param schedule - The resolved timeline as plain marks; empty when no director runs.
   * @param events - The match's event channel; `setPhase` emits `phase-changed` on it.
   * @param currentTick - Reads the tick that `setPhase` stamps.
   */
  public constructor(
    public readonly playerTeam: PlayableTeam,
    schedule: readonly ScheduledMark[],
    private readonly events: GameEvents,
    private readonly currentTick: () => number,
  ) {
    this.schedule = deepFreeze([...schedule]);
  }

  /** Where the match is in its timeline; a match starts in `countdown`. */
  public get phase(): MatchPhase {
    return this.currentPhase;
  }

  /** The tick of the last `setPhase`; 0 before the first. */
  public get phaseEnteredTick(): number {
    return this.enteredTick;
  }

  /** Index into `schedule` of the next unfired entry. */
  public get timelineCursor(): number {
    return this.cursor;
  }

  /** While true every unit is idle (DEC-88); see `MatchState.isIdleHeld`. */
  public get isIdleHeld(): boolean {
    return this.isHeld;
  }

  /** The human's Legend; `null` in sim mode and when the human slot did not spawn. */
  public get humanLegendId(): EntityId | null {
    return this.humanId;
  }

  /** The Legends' rows and the teams' totals, read-only at every depth: the `ScoreBook`'s view. */
  public get scoring(): ScoringState {
    return this.scoreBook.view;
  }

  /** How the match ended; `null` until a verdict. */
  public get result(): MatchResult | null {
    return this.verdict;
  }

  /**
   * Moves the match to `next`: stamps `phaseEnteredTick` and emits `phase-changed`. Called by the
   * `MatchDirector` only, which checks the move is forward; `phase-monotonic` checks it again.
   */
  public setPhase(next: MatchPhase): void {
    const from = this.currentPhase;
    this.currentPhase = next;
    this.enteredTick = this.currentTick();
    this.events.emit('phase-changed', { from, to: next });
  }

  /** Holds (`true`) or releases (`false`) every unit idle (DEC-88). Called by the countdown phase only. */
  public holdIdle(isHeld: boolean): void {
    this.isHeld = isHeld;
  }

  /**
   * Stores the match's verdict. Called by the `MatchDirector` only, once: the director is inert
   * after the end (12 §4), so a second call is a bug and throws.
   */
  public endMatch(result: MatchResult): void {
    if (this.verdict !== null) {
      throw new Error('The match has already ended: its result is set once.');
    }
    this.verdict = result;
  }

  /**
   * Records the human's Legend. Called by `Simulation` only, once, when the human slot's Legend
   * spawns; a second call throws.
   */
  public seatHuman(legendId: EntityId): void {
    if (this.humanId !== null) {
      throw new Error('The human is already seated: humanLegendId is set once.');
    }
    this.humanId = legendId;
  }

  /** Moves the timeline cursor past the entry that is due. Called by the `MatchDirector` only. */
  public advanceTimeline(): void {
    this.cursor += 1;
  }
}

import type { MatchPhase } from '../config/matchPhases';
import type { PlayableTeam } from '../teams/teams.types';
import { deepFreeze } from '../utils/deepFreeze';
import type { EntityId } from './EntityStore.types';
import type { GameEvents } from './GameEvents';
import type { MatchResult } from './MatchResult.types';
import type { DuelScore, MatchState, ScheduledMark } from './MatchState.types';
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
  private readonly seats = new Map<PlayableTeam, EntityId>();
  private verdict: MatchResult | null = null;
  private duelKills: Record<PlayableTeam, number> | null = null;
  private duelKillTarget = 0;

  /**
   * @param playerTeam - The team the match is played (or spectated) for.
   * @param schedule - The resolved timeline as plain marks; empty when no director runs.
   * @param events - The match's event channel; `setPhase` emits `phase-changed` on it and
   *   `reseatHuman` `human-reseated`.
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

  /**
   * The Legend of the human on `playerTeam`; `null` in sim mode and when that human slot did not
   * spawn. In a Duel (ADR 0016) it is the `playerTeam` seat; `humanLegendIdOf` reads the other.
   */
  public get humanLegendId(): EntityId | null {
    return this.humanLegendIdOf(this.playerTeam);
  }

  /** The Legend seated for `team`'s human slot (ADR 0016); `null` when that team has none. */
  public humanLegendIdOf(team: PlayableTeam): EntityId | null {
    return this.seats.get(team) ?? null;
  }

  /** The Legends' rows and the teams' totals, read-only at every depth: the `ScoreBook`'s view. */
  public get scoring(): ScoringState {
    return this.scoreBook.view;
  }

  /** How the match ended; `null` until a verdict. */
  public get result(): MatchResult | null {
    return this.verdict;
  }

  /** The Duel's score; `null` outside a Duel. */
  public get duel(): DuelScore | null {
    return this.duelKills === null
      ? null
      : { kills: { ...this.duelKills }, killTarget: this.duelKillTarget };
  }

  /**
   * Makes this match a Duel won at `killTarget` kills, both teams at 0. Called by `Simulation`
   * only, once, when the match is built; a second call throws.
   */
  public startDuel(killTarget: number): void {
    if (this.duelKills !== null) {
      throw new Error('The Duel has already started: its target is set once.');
    }
    this.duelKills = { light: 0, dark: 0 };
    this.duelKillTarget = killTarget;
  }

  /** Counts a kill for `team`. Called by `DuelRoundSystem` only; throws outside a Duel. */
  public recordDuelKill(team: PlayableTeam): void {
    if (this.duelKills === null) {
      throw new Error('There is no Duel to record a kill in.');
    }
    this.duelKills[team] += 1;
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
   * Records the Legend of `team`'s human (default `playerTeam`). Called by `Simulation` only, once
   * per team, when that human slot's Legend spawns; a second call for a team throws.
   */
  public seatHuman(legendId: EntityId, team: PlayableTeam = this.playerTeam): void {
    if (this.seats.has(team)) {
      throw new Error(`The ${team} human is already seated: a team's seat is set once.`);
    }
    this.seats.set(team, legendId);
  }

  /**
   * Moves the `playerTeam` human seat (sim mode, FR-099) to `legendId`, or to nobody (`null`).
   * Emits `human-reseated` (DEC-294), so the scoring rows follow. Called by
   * `DevSetControllerHandler` only, after the match is built; a move to the current seat and a
   * move in a Duel (ADR 0016: its seats are never moved) are bugs and throw.
   */
  public reseatHuman(legendId: EntityId | null): void {
    const from = this.humanLegendId;
    if (legendId === from) {
      throw new Error('The human is already seated there: reseat only moves humanLegendId.');
    }
    if (this.duelKills !== null) {
      throw new Error("A Duel's seats are never moved (ADR 0016): sim mode only.");
    }
    if (legendId === null) {
      this.seats.delete(this.playerTeam);
    } else {
      this.seats.set(this.playerTeam, legendId);
    }
    this.events.emit('human-reseated', { from, to: legendId });
  }

  /** Moves the timeline cursor past the entry that is due. Called by the `MatchDirector` only. */
  public advanceTimeline(): void {
    this.cursor += 1;
  }
}

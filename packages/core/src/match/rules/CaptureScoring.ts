import { Transform } from '../../components/Transform';
import { ZoneArea } from '../../components/ZoneArea';
import type { ScoringWeights } from '../../content/match/scoring.types';
import type { EntityId } from '../../state/EntityStore.types';
import type { GameEventMap } from '../../state/GameEvents.types';
import type { GameState } from '../../state/GameState';
import type { ScoreBook } from '../../state/ScoreBook';
import { isPlayableTeam, PLAYABLE_TEAMS } from '../../teams/playableTeams';
import type { PlayableTeam } from '../../teams/teams.types';
import type { PendingChange, ScoringListener } from '../ScoringRule.types';

/**
 * The capture-point rules (architecture 12 §5, DEC-214), a listener rule of `Scoring`. Its
 * listeners only buffer, through `Scoring`'s `defer`, and it writes only through the match's
 * `ScoreBook`.
 *
 * - Checkpoints: a playable team whose push reaches a capture point's checkpoint gets team-only
 *   points; each of its living Legends whose centre is on the zone at that moment wins the
 *   checkpoint (a counter, no points; DEC-214 (A1)). A neutral camp's push gives nothing.
 * - Holds: each fold, every capture point a playable team owns adds one tick to its pooled held
 *   time, and each full minute of it gives team-only points; a lost point stops adding but takes
 *   nothing back (DEC-214 (A2)). Who owns how many points follows `capture-point-owner-changed`.
 */
export class CaptureScoring implements ScoringListener {
  /**
   * @param weights - The checkpoint and hold points.
   * @param minuteTicks - One minute in ticks: hold points come per full minute of held time.
   */
  public constructor(
    private readonly weights: Pick<ScoringWeights, 'captureCheckpoint' | 'holdPerMinute'>,
    private readonly minuteTicks: number,
  ) {}

  /** Subscribes to `checkpoint-reached` and `capture-point-owner-changed`. */
  public listen(state: GameState, defer: (change: PendingChange) => void): void {
    state.events.on('checkpoint-reached', (payload) => {
      this.onCheckpointReached(state, payload, defer);
    });
    state.events.on('capture-point-owner-changed', (payload) => {
      CaptureScoring.onOwnerChanged(payload, defer);
    });
  }

  /**
   * Adds one tick per owned capture point to each playable team's pooled held time, and the hold
   * points for each full minute that tick completes (DEC-214 (A2)). `Scoring` calls it once per
   * fold, after the buffered changes.
   */
  public scoreTick(book: ScoreBook): void {
    for (const team of PLAYABLE_TEAMS) {
      const owned = book.view.ownedPoints[team];
      if (owned === 0) {
        continue;
      }
      const before = book.view.teams[team].capturesHeldTicks;
      const minutes =
        Math.floor((before + owned) / this.minuteTicks) - Math.floor(before / this.minuteTicks);
      book.awardTeam(team, {
        counter: 'capturesHeldTicks',
        by: owned,
        points: minutes * this.weights.holdPerMinute,
      });
    }
  }

  /**
   * Buffers the team-only points for a checkpoint a playable team's push reached, and the
   * checkpoint won by each of its Legends on the zone now (DEC-214 (A1)).
   */
  private onCheckpointReached(
    state: GameState,
    { pointId, team }: GameEventMap['checkpoint-reached'],
    defer: (change: PendingChange) => void,
  ): void {
    if (!isPlayableTeam(team)) {
      return;
    }
    const present = CaptureScoring.legendsOn(state, pointId, team);
    const points = this.weights.captureCheckpoint;
    defer((book) => {
      book.awardTeamPoints(team, points);
      for (const legendId of present) {
        if (book.rowOf(legendId) !== undefined) {
          book.award(legendId, { counter: 'checkpointsWon', by: 1, points: 0 });
        }
      }
    });
  }

  /** Buffers the change of who owns a capture point; only a playable team's count moves. */
  private static onOwnerChanged(
    { from, to }: GameEventMap['capture-point-owner-changed'],
    defer: (change: PendingChange) => void,
  ): void {
    defer((book) => {
      if (isPlayableTeam(from)) {
        book.countOwnedPoints(from, -1);
      }
      if (isPlayableTeam(to)) {
        book.countOwnedPoints(to, 1);
      }
    });
  }

  /**
   * The living Legends of `team` whose centre is on the capture point's area now: the test
   * `CaptureSystem` counts presence with (`ZoneArea.contains`, DEC-145 (a)).
   */
  private static legendsOn(state: GameState, pointId: string, team: PlayableTeam): EntityId[] {
    const { entities } = state;
    const area = entities.get(pointId)?.findComponent(ZoneArea);
    const present: EntityId[] = [];
    entities.forEach((entity) => {
      const position = entity.findComponent(Transform)?.position;
      if (
        entity.family === 'legend' &&
        entities.teamOf(entity.id) === team &&
        entities.isAlive(entity.id) &&
        position !== undefined &&
        area?.contains(position) === true
      ) {
        present.push(entity.id);
      }
    });
    return present;
  }
}

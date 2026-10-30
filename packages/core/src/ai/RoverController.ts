import type { EntityId } from '../state/EntityStore.types';
import { laneScores, mostLaneScore } from '../state/LaneAssessment';
import { Action } from './bt/Action';
import { ActiveSelector } from './bt/ActiveSelector';
import type { BtNode } from './bt/BtNode.types';
import { Condition } from './bt/Condition';
import { Sequence } from './bt/Sequence';
import type { BotTurn } from './BotLegendController.types';
import { BotLeaves } from './BotLeaves';
import type { Controller, Decision, DecisionInput } from './Controller.types';
import type { RoverControllerContent } from './RoverController.types';
import { share } from './utility/considerations';
import { UtilityScorer } from './utility/UtilityScorer';

/**
 * The enemy Rover, the hard bot (architecture 11 §4.7): no lane (18 §8), the laner's leaves and a
 * Rover root, re-checked on every decision:
 *
 * 1. `Survive`, as a laner.
 * 2. `Hunt` (`HumanProximity`, `HumanVulnerability`): the human within `huntRadius` while the
 *    Rover's health fraction leads the human's by `huntAdvantage` → it fights the human.
 * 3. `Fight`, as a laner.
 * 4. `Lane`: a utility pick over the lanes, `StructurePressure` (how much worse its team is doing
 *    on the lane than on its calmest one) against `HumanProximity` (the human's lane), weighted by `tactics.laneWeights`. On
 *    the human's lane it mirrors the human (the lane point nearest them); on another it defends,
 *    with that lane's lead horde.
 *
 * @remarks ponytail: the human is the enemy Legend no controller drives, sensed through
 * `Perception` (Legends only) within `senseRadius`, wider than 11 §3's vision-sized queries, until
 * the match state names it (12 §4 `humanLegendId`); the lane scores stand in for structure health
 * per lane until structure entities exist (minion plan M2c); no `LaneAdvantage` push yet.
 */
export class RoverController implements Controller {
  public readonly id = 'rover';
  private readonly leaves: BotLeaves;
  private readonly root: BtNode<BotTurn>;
  private readonly laneScorer: UtilityScorer<'pressure' | 'human'>;

  /** @param content - Difficulties, retreat points, tactics, kind classes and lane weights. */
  public constructor(private readonly content: RoverControllerContent) {
    const leaves = new BotLeaves(content);
    this.leaves = leaves;
    this.laneScorer = new UtilityScorer(content.tactics.laneWeights);
    this.root = new ActiveSelector<BotTurn>([
      new Sequence([
        new Condition((turn) => leaves.shouldRetreat(turn)),
        new Action((turn) => leaves.retreat(turn)),
      ]),
      new Sequence([
        new Condition((turn) => this.shouldHunt(turn)),
        new Action((turn) => leaves.fight(turn)),
      ]),
      new Sequence([
        new Condition((turn) => leaves.findEnemy(turn)),
        new Action((turn) => leaves.fight(turn)),
      ]),
      new Sequence([
        new Condition((turn) => this.chooseLane(turn)),
        new Action((turn) => leaves.moveTo(turn, turn.destination)),
      ]),
    ]);
  }

  /** Whether `profileId` names one of the injected difficulties. */
  public hasProfile(profileId: string): boolean {
    return this.leaves.hasProfile(profileId);
  }

  /**
   * Runs the Rover tree once.
   *
   * @throws Error when the brain names a difficulty that does not exist (a content error).
   */
  public decide(input: DecisionInput): Decision {
    const turn = this.leaves.begin(input);
    if (turn !== null) {
      this.root.tick(turn);
    }
    return BotLeaves.finish(turn, input);
  }

  /** The human is close and the Rover has the health advantage: it becomes the enemy. */
  private shouldHunt(turn: BotTurn): boolean {
    const human = this.humanNear(turn, this.content.tactics.huntRadius);
    if (human === null) {
      return false;
    }
    const { entities } = turn.state;
    const lead =
      (entities.healthFractionOf(turn.id) ?? 0) - (entities.healthFractionOf(human) ?? 1);
    if (lead < this.content.tactics.huntAdvantage) {
      return false;
    }
    turn.enemy = human;
    return true;
  }

  /** Picks the lane to play (pressure against the human's lane) and where on it to go. */
  private chooseLane(turn: BotTurn): boolean {
    const { state } = turn;
    const human = this.humanNear(turn, this.content.tactics.senseRadius);
    const humanAt = human === null ? undefined : BotLeaves.positionOf(state, human);
    const humanLane =
      humanAt === undefined ? undefined : state.world?.routes.nearestLane(humanAt)?.id;
    const scores = laneScores(state, turn.team, this.content.laneWeights);
    // Pressure counts from the calmest lane, so what every lane shares does not dilute it.
    const calmest = Math.min(...scores.map(({ score }) => score));
    const most = mostLaneScore(this.content.laneWeights) - calmest;
    // Lanes nearest the middle first, so a full tie goes there (as `assessLanes` breaks ties).
    const middle = Math.floor(scores.length / 2);
    const byMiddle = [...scores].sort(
      (a, b) => Math.abs(a.index - middle) - Math.abs(b.index - middle) || a.index - b.index,
    );
    const lane = this.laneScorer.best(
      byMiddle.map(({ id }) => id),
      (id) => ({
        pressure: share((scores.find((score) => score.id === id)?.score ?? 0) - calmest, most),
        human: id === humanLane ? 1 : 0,
      }),
    );
    if (lane === null) {
      return false;
    }
    if (lane === humanLane && humanAt !== undefined) {
      return this.leaves.findLanePoint(turn, lane, humanAt);
    }
    return (
      this.leaves.findHorde(turn, lane) || this.leaves.findLanePoint(turn, lane, turn.position)
    );
  }

  /** The nearest enemy Legend within `radius` that no controller drives, or `null`. */
  private humanNear(turn: BotTurn, radius: number): EntityId | null {
    const { state, team, position, perception } = turn;
    const legends = perception.unitsWithin(position, radius, {
      hostileTo: team,
      aliveOnly: true,
      kinds: this.content.legendKinds,
    });
    let best: EntityId | null = null;
    let bestGap = Number.POSITIVE_INFINITY;
    for (const id of legends) {
      const at = BotLeaves.positionOf(state, id);
      const isHuman = state.ai.get(id) === undefined;
      const gap = at === undefined ? Number.POSITIVE_INFINITY : BotLeaves.gapSquared(position, at);
      // Candidates come in id order, so a strict comparison keeps the lower id on a tie.
      if (isHuman && gap < bestGap) {
        best = id;
        bestGap = gap;
      }
    }
    return best;
  }
}

import type { EntityId } from '../state/EntityStore.types';
import { assessLanes } from '../state/LaneAssessment';
import { Action } from './bt/Action';
import { ActiveSelector } from './bt/ActiveSelector';
import type { BtNode } from './bt/BtNode.types';
import { Condition } from './bt/Condition';
import { Sequence } from './bt/Sequence';
import type { BotTurn } from './BotLegendController.types';
import { BotLeaves } from './BotLeaves';
import type { Controller, Decision, DecisionInput } from './Controller.types';
import type { RoverControllerContent } from './RoverController.types';

/**
 * The enemy Rover, the hard bot (architecture 11 §4.7): no lane (18 §8), the laner's leaves and a
 * Rover root, re-checked on every decision:
 *
 * 1. `Survive`, as a laner.
 * 2. `Hunt` (`HumanProximity`, `HumanVulnerability`): the human within `huntRadius` while the
 *    Rover's health fraction leads the human's by `huntAdvantage` → it fights the human.
 * 3. `Fight`, as a laner.
 * 4. `Mirror`: it goes to the point of the human's lane nearest the human.
 * 5. `Defend` (`StructurePressure`): with no human in sight it holds the team's worst lane, the one
 *    the lane assessment names, with that lane's lead horde.
 *
 * @remarks ponytail: the human is the enemy Legend no controller drives, sensed through
 * `Perception` within `senseRadius`, until the match state names it (12 §4 `humanLegendId`); the
 * lane assessment stands in for structure health per lane until structure entities exist
 * (minion plan M2c); no `LaneAdvantage` push yet.
 */
export class RoverController implements Controller {
  public readonly id = 'rover';
  private readonly leaves: BotLeaves;
  private readonly root: BtNode<BotTurn>;

  /** @param content - Difficulties, retreat points, tactics, kind classes and lane weights. */
  public constructor(private readonly content: RoverControllerContent) {
    const leaves = new BotLeaves(content);
    this.leaves = leaves;
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
        new Condition((turn) => this.findHumanLane(turn)),
        new Action((turn) => leaves.moveTo(turn, turn.destination)),
      ]),
      new Sequence([
        new Condition((turn) => this.findWorstLane(turn)),
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

  /** The point of the human's lane nearest the human. */
  private findHumanLane(turn: BotTurn): boolean {
    const human = this.humanNear(turn, this.content.tactics.senseRadius);
    const at = human === null ? undefined : BotLeaves.positionOf(turn.state, human);
    const lane = at === undefined ? undefined : turn.state.routes?.nearestLane(at);
    return at !== undefined && lane !== undefined && this.leaves.findLanePoint(turn, lane.id, at);
  }

  /** The lead allied horde of the lane the assessment names, or that lane's nearest point. */
  private findWorstLane(turn: BotTurn): boolean {
    const lane = assessLanes(turn.state, turn.team, this.content.laneWeights);
    if (lane === undefined) {
      return false;
    }
    return (
      this.leaves.findHorde(turn, lane) || this.leaves.findLanePoint(turn, lane, turn.position)
    );
  }

  /** The nearest enemy Legend within `radius` that no controller drives, or `null`. */
  private humanNear(turn: BotTurn, radius: number): EntityId | null {
    const { state, team, position, perception } = turn;
    const legends = perception.unitsWithin(position, radius, { hostileTo: team, aliveOnly: true });
    let best: EntityId | null = null;
    let bestGap = Number.POSITIVE_INFINITY;
    for (const id of legends) {
      const kind = state.entities.get(id)?.kind;
      const at = BotLeaves.positionOf(state, id);
      const isHuman =
        kind !== undefined &&
        this.content.classOf(kind) === 'legend' &&
        state.ai.get(id) === undefined;
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

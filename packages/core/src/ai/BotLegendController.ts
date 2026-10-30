import { Action } from './bt/Action';
import { ActiveSelector } from './bt/ActiveSelector';
import type { BtNode } from './bt/BtNode.types';
import { Condition } from './bt/Condition';
import { Sequence } from './bt/Sequence';
import type { BotLegendControllerContent, BotTurn } from './BotLegendController.types';
import { BotLeaves } from './BotLeaves';
import type { Controller, Decision, DecisionInput } from './Controller.types';

/**
 * Plays a bot Legend in its lane (architecture 11 §4.2, 18 §8) with the `laner` tree, an
 * `ActiveSelector` re-checked on every decision:
 *
 * 1. `Survive`: below `retreatHealthFraction` (until back at `rejoinHealthFraction`) it drops its
 *    target and falls back to the nearest allied tower or its Stronghold.
 * 2. `Fight`: an enemy inside `engageRadius` → the `UtilityScorer` picks one by closeness and
 *    weakness; it attacks it (casting when the roll allows) and closes in until it is in reach.
 * 3. `Push`: it walks with the most advanced allied horde on its lane, at that horde's anchor.
 * 4. `Regroup`: with no allied horde on its lane, it returns to the nearest point of its lane.
 *
 * Every step is a `move`, `attack-target`, `cast-ability` or `stop` command for the next tick,
 * routed around obstacles by A\*. Stateless: its lane, retreat flag, target and cast timer live in
 * the brain it returns, and its rolls advance the brain's own RNG stream.
 *
 * @remarks ponytail: never attacks structures (minion plan M2c); casts go nowhere until abilities
 * land (Phase 4); nothing heals a retreated bot yet, so it rejoins only once something restores
 * its health.
 */
export class BotLegendController implements Controller {
  public readonly id = 'bot-legend';
  private readonly leaves: BotLeaves;
  private readonly laner: BtNode<BotTurn>;

  /** @param content - Difficulties and retreat points; the controller holds no numbers. */
  public constructor(content: BotLegendControllerContent) {
    const leaves = new BotLeaves(content);
    this.leaves = leaves;
    this.laner = new ActiveSelector<BotTurn>([
      new Sequence([
        new Condition((turn) => leaves.shouldRetreat(turn)),
        new Action((turn) => leaves.retreat(turn)),
      ]),
      new Sequence([
        new Condition((turn) => leaves.findEnemy(turn)),
        new Action((turn) => leaves.fight(turn)),
      ]),
      new Sequence([
        new Condition((turn) => leaves.findHorde(turn, turn.memory.lane)),
        new Action((turn) => leaves.moveTo(turn, turn.destination)),
      ]),
      new Sequence([
        new Condition((turn) => leaves.findLanePoint(turn, turn.memory.lane, turn.position)),
        new Action((turn) => leaves.moveTo(turn, turn.destination)),
      ]),
    ]);
  }

  /** Whether `profileId` names one of the injected difficulties. */
  public hasProfile(profileId: string): boolean {
    return this.leaves.hasProfile(profileId);
  }

  /**
   * Runs the laner tree once for one bot.
   *
   * @throws Error when the brain names a difficulty that does not exist (a content error).
   */
  public decide(input: DecisionInput): Decision {
    const turn = this.leaves.begin(input);
    if (turn !== null) {
      this.laner.tick(turn);
    }
    return BotLeaves.finish(turn, input);
  }
}

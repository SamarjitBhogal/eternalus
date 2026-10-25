import type { BotDifficultyDefinition } from '../content/ai/ai.types';
import type { AiMemory } from '../state/AiState.types';
import type { EntityId } from '../state/EntityStore.types';
import { compareById } from '../utils/compareById';
import { sqrt } from '../utils/deterministicMath';
import type { Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';
import { Action } from './bt/Action';
import { ActiveSelector } from './bt/ActiveSelector';
import type { BtNode, BtStatus } from './bt/BtNode.types';
import { Condition } from './bt/Condition';
import { Sequence } from './bt/Sequence';
import type {
  BotLanerMemory,
  BotLegendControllerContent,
  BotTurn,
} from './BotLegendController.types';
import type { Controller, Decision, DecisionInput } from './Controller.types';
import { closeness, weakness } from './utility/considerations';
import { UtilityScorer } from './utility/UtilityScorer';

/**
 * Plays a bot Legend in its lane (architecture 11 §4.2, 18 §8) with the `laner` tree, an
 * `ActiveSelector` re-checked on every decision:
 *
 * 1. `Survive`: below `retreatHealthFraction` (until back at `rejoinHealthFraction`) it drops its
 *    target and falls back to the nearest allied tower or its Stronghold.
 * 2. `Fight`: an enemy inside `engageRadius` → the `UtilityScorer` picks one by closeness and
 *    weakness; it attacks it and closes in until it is in reach.
 * 3. `Push`: it walks with the most advanced allied horde on its lane, at that horde's anchor.
 * 4. `Regroup`: with no allied horde on its lane, it returns to the nearest point of its lane.
 *
 * Every step is a `move`, `attack-target` or `stop` command for the next tick. Stateless: its lane,
 * retreat flag and target live in the brain it returns.
 *
 * @remarks ponytail: it moves in a straight line (A\* for Legends is minion plan M8), never casts
 * (abilities are Phase 4) and never attacks structures (minion plan M2c); nothing heals a retreated
 * bot yet, so it rejoins only once something restores its health.
 */
export class BotLegendController implements Controller {
  public readonly id = 'bot-legend';
  private readonly laner: BtNode<BotTurn>;
  private readonly scorers = new Map<string, UtilityScorer<'closeness' | 'weakness'>>();
  private readonly anchor: MutableVec2 = { x: 0, y: 0 };
  private readonly forward: MutableVec2 = { x: 0, y: 0 };

  /** @param content - Difficulties and retreat points; the controller holds no numbers. */
  public constructor(private readonly content: BotLegendControllerContent) {
    this.laner = new ActiveSelector<BotTurn>([
      new Sequence([
        new Condition((turn) => this.shouldRetreat(turn)),
        new Action((turn) => this.retreat(turn)),
      ]),
      new Sequence([
        new Condition((turn) => this.findEnemy(turn)),
        new Action((turn) => this.fight(turn)),
      ]),
      new Sequence([
        new Condition((turn) => this.findHorde(turn)),
        new Action((turn) => this.moveTo(turn, turn.destination)),
      ]),
      new Action((turn) => this.regroup(turn)),
    ]);
  }

  /** Whether `profileId` names one of the injected difficulties. */
  public hasProfile(profileId: string): boolean {
    return this.content.difficulties[profileId] !== undefined;
  }

  /**
   * Runs the laner tree once for one bot.
   *
   * @throws Error when the brain names a difficulty that does not exist (a content error).
   */
  public decide({ state, entityId, brain, perception }: DecisionInput): Decision {
    const difficulty = this.content.difficulties[brain.profileId];
    if (difficulty === undefined) {
      throw new Error(
        `Bot "${entityId}" names difficulty "${brain.profileId}", which does not exist.`,
      );
    }
    const memory = BotLegendController.read(brain.memory);
    const position = BotLegendController.positionOf(state, entityId);
    const team = state.entities.teamOf(entityId);
    if (position === undefined || (team !== 'light' && team !== 'dark')) {
      return { commands: [], memory, rngState: brain.rngState };
    }
    const turn: BotTurn = {
      state,
      id: entityId,
      team,
      position,
      difficulty,
      perception,
      memory,
      next: memory,
      commands: [],
      enemy: null,
      destination: null,
    };
    this.laner.tick(turn);
    return { commands: turn.commands, memory: turn.next, rngState: brain.rngState };
  }

  /** Below the retreat line, or still under the rejoin line once retreating. */
  private shouldRetreat(turn: BotTurn): boolean {
    const health = turn.state.entities.healthFractionOf(turn.id) ?? 1;
    const { retreatHealthFraction, rejoinHealthFraction } = turn.difficulty;
    const isRetreating = turn.memory.isRetreating
      ? health < rejoinHealthFraction
      : health < retreatHealthFraction;
    turn.next = { ...turn.next, isRetreating };
    return isRetreating;
  }

  /** Drops the target and heads for the nearest allied retreat point. */
  private retreat(turn: BotTurn): BtStatus {
    const map = turn.state.map;
    let best: { readonly id: string; readonly position: Vec2 } | null = null;
    let bestGap = Number.POSITIVE_INFINITY;
    for (const feature of map?.features ?? []) {
      const gap = BotLegendController.gapSquared(turn.position, feature.position);
      const isNearer =
        gap < bestGap || (gap === bestGap && best !== null && compareById(feature.id, best.id) < 0);
      if (feature.team === turn.team && this.content.retreatTo.includes(feature.kind) && isNearer) {
        best = feature;
        bestGap = gap;
      }
    }
    if (best === null) {
      return 'failure';
    }
    if (turn.memory.targetId !== null) {
      turn.commands.push({ type: 'stop', actorId: turn.id });
      turn.next = { ...turn.next, targetId: null };
    }
    return this.moveTo(turn, best.position);
  }

  /** Picks the enemy in `engageRadius` the utility scorer likes best. */
  private findEnemy(turn: BotTurn): boolean {
    const { state, team, position, difficulty, perception } = turn;
    const enemies = perception.unitsWithin(position, difficulty.engageRadius, {
      hostileTo: team,
      aliveOnly: true,
    });
    turn.enemy = this.scorerFor(difficulty).best(enemies, (enemy) => {
      const at = BotLegendController.positionOf(state, enemy) ?? position;
      return {
        closeness: closeness(
          sqrt(BotLegendController.gapSquared(position, at)),
          difficulty.engageRadius,
        ),
        weakness: weakness(state.entities.healthFractionOf(enemy) ?? 1),
      };
    });
    return turn.enemy !== null;
  }

  /** Attacks the chosen enemy and closes in until it is in reach. */
  private fight(turn: BotTurn): BtStatus {
    const { state, id, enemy } = turn;
    const at = enemy === null ? undefined : BotLegendController.positionOf(state, enemy);
    if (enemy === null || at === undefined) {
      return 'failure';
    }
    if (enemy !== turn.memory.targetId) {
      turn.commands.push({ type: 'attack-target', actorId: id, targetId: enemy });
      turn.next = { ...turn.next, targetId: enemy };
    }
    const isInReach = state.entities.isInReach(id, enemy);
    turn.commands.push({
      type: 'move',
      actorId: id,
      direction: isInReach
        ? { x: 0, y: 0 }
        : { x: at.x - turn.position.x, y: at.y - turn.position.y },
    });
    return 'running';
  }

  /** Finds the anchor of the most advanced allied horde on the bot's lane. */
  private findHorde(turn: BotTurn): boolean {
    const { state, team } = turn;
    const routes = state.routes;
    let lead = -1;
    state.hordes.forEach((horde) => {
      // The progress is all that is read, so which of two equal hordes wins does not matter.
      if (horde.team === team && horde.lane === turn.memory.lane && horde.progress > lead) {
        lead = horde.progress;
      }
    });
    if (routes === null || lead < 0) {
      return false;
    }
    routes.pose(turn.memory.lane, team, lead, this.anchor, this.forward);
    turn.destination = { x: this.anchor.x, y: this.anchor.y };
    return true;
  }

  /** Returns to the nearest point of the bot's lane (the lane corridor, 11 §4.2). */
  private regroup(turn: BotTurn): BtStatus {
    const routes = turn.state.routes;
    if (routes === null || turn.memory.lane === '') {
      return 'failure';
    }
    const along = routes.distanceAlong(turn.memory.lane, turn.team, turn.position);
    routes.pose(turn.memory.lane, turn.team, along, this.anchor, this.forward);
    return this.moveTo(turn, this.anchor);
  }

  /** One `move` toward `destination`, or a halt once within `arrivalDistance` of it. */
  private moveTo(turn: BotTurn, destination: Vec2 | null): BtStatus {
    if (destination === null) {
      return 'failure';
    }
    const { arrivalDistance } = turn.difficulty;
    const isThere =
      BotLegendController.gapSquared(turn.position, destination) <=
      arrivalDistance * arrivalDistance;
    turn.commands.push({
      type: 'move',
      actorId: turn.id,
      direction: isThere
        ? { x: 0, y: 0 }
        : { x: destination.x - turn.position.x, y: destination.y - turn.position.y },
    });
    return 'running';
  }

  private scorerFor(difficulty: BotDifficultyDefinition): UtilityScorer<'closeness' | 'weakness'> {
    let scorer = this.scorers.get(difficulty.id);
    if (scorer === undefined) {
      scorer = new UtilityScorer(difficulty.utilityWeights);
      this.scorers.set(difficulty.id, scorer);
    }
    return scorer;
  }

  private static positionOf(state: DecisionInput['state'], id: EntityId): Vec2 | undefined {
    const index = state.space?.indexOf(id);
    if (state.space === null || index === undefined) {
      return undefined;
    }
    return {
      x: state.space.positions[2 * index] ?? 0,
      y: state.space.positions[2 * index + 1] ?? 0,
    };
  }

  private static gapSquared(a: Vec2, b: Vec2): number {
    return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
  }

  /** The laner's memory from its brain; with no lane it only survives and fights. */
  private static read(memory: AiMemory): BotLanerMemory {
    return {
      lane: typeof memory.lane === 'string' ? memory.lane : '',
      isRetreating: memory.isRetreating === true,
      targetId: typeof memory.targetId === 'string' ? memory.targetId : null,
    };
  }
}

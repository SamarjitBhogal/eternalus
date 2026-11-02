import type { AiMemory, BotDifficultyDefinition } from '../content/ai/ai.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import { compareById } from '../utils/compareById';
import { sqrt } from '../utils/deterministicMath';
import type { Vec2 } from '../utils/geometry.types';
import { SeededRandom } from '../utils/SeededRandom';
import type { MutableVec2 } from '../utils/vec2.types';
import type { BtStatus } from './bt/BtNode.types';
import type { BotMemory, BotLegendControllerContent, BotTurn } from './BotLegendController.types';
import type { Decision, DecisionInput } from './Controller.types';
import { closeness, weakness } from './utility/considerations';
import { UtilityScorer } from './utility/UtilityScorer';

/**
 * The conditions and actions every bot Legend tree is built from (architecture 11 §4.2):
 * surviving, choosing and fighting an enemy (and casting), following the lead horde and walking,
 * around obstacles through A\* (`state.paths`). `BotLegendController` and `RoverController` arrange
 * them into their trees. Stateless apart from scratch: what a bot remembers is its brain.
 */
export class BotLeaves {
  private readonly scorers = new Map<string, UtilityScorer<'closeness' | 'weakness'>>();
  private readonly anchor: MutableVec2 = { x: 0, y: 0 };
  private readonly forward: MutableVec2 = { x: 0, y: 0 };
  private readonly step: MutableVec2 = { x: 0, y: 0 };

  /** @param content - Difficulties and retreat points; the leaves hold no numbers. */
  public constructor(private readonly content: BotLegendControllerContent) {}

  /** Whether `profileId` names one of the injected difficulties. */
  public hasProfile(profileId: string): boolean {
    return this.content.difficulties[profileId] !== undefined;
  }

  /**
   * Gathers one decision's turn, or `null` when the bot cannot decide (not indexed or teamless).
   *
   * @throws Error when the brain names a difficulty that does not exist (a content error).
   */
  public begin({ state, entityId, brain, perception }: DecisionInput): BotTurn | null {
    const difficulty = this.content.difficulties[brain.profileId];
    if (difficulty === undefined) {
      throw new Error(
        `Bot "${entityId}" names difficulty "${brain.profileId}", which does not exist.`,
      );
    }
    const position = BotLeaves.positionOf(state, entityId);
    const team = state.entities.teamOf(entityId);
    if (position === undefined || (team !== 'light' && team !== 'dark')) {
      return null;
    }
    const memory = BotLeaves.read(brain.memory);
    return {
      state,
      id: entityId,
      team,
      position,
      difficulty,
      perception,
      rng: SeededRandom.fromState(brain.rngState),
      memory,
      next: memory,
      commands: [],
      enemy: null,
      destination: null,
    };
  }

  /** The decision a finished turn makes; an unplayable turn keeps its brain. */
  public static finish(turn: BotTurn | null, input: DecisionInput): Decision {
    return turn === null
      ? { commands: [], memory: input.brain.memory, rngState: input.brain.rngState }
      : { commands: turn.commands, memory: turn.next, rngState: turn.rng.getState() };
  }

  /** Below the retreat line, or still under the rejoin line once retreating. */
  public shouldRetreat(turn: BotTurn): boolean {
    const health = turn.state.entities.healthFractionOf(turn.id) ?? 1;
    const { retreatHealthFraction, rejoinHealthFraction } = turn.difficulty;
    const isRetreating = turn.memory.isRetreating
      ? health < rejoinHealthFraction
      : health < retreatHealthFraction;
    turn.next = { ...turn.next, isRetreating };
    return isRetreating;
  }

  /** Drops the target and heads for the nearest allied retreat point (lower id on a tie). */
  public retreat(turn: BotTurn): BtStatus {
    let best: { readonly id: string; readonly position: Vec2 } | null = null;
    let bestGap = Number.POSITIVE_INFINITY;
    for (const feature of turn.state.world?.definition.features ?? []) {
      const gap = BotLeaves.gapSquared(turn.position, feature.position);
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
  public findEnemy(turn: BotTurn): boolean {
    const { state, team, position, difficulty, perception } = turn;
    const enemies = perception.unitsWithin(position, difficulty.engageRadius, {
      hostileTo: team,
      aliveOnly: true,
    });
    turn.enemy = this.scorerFor(difficulty).best(enemies, (enemy) => {
      const at = BotLeaves.positionOf(state, enemy) ?? position;
      return {
        closeness: closeness(sqrt(BotLeaves.gapSquared(position, at)), difficulty.engageRadius),
        weakness: weakness(state.entities.healthFractionOf(enemy) ?? 1),
      };
    });
    return turn.enemy !== null;
  }

  /** Attacks `turn.enemy`, may cast at it, and closes in until it is in reach. */
  public fight(turn: BotTurn): BtStatus {
    const { state, id, enemy } = turn;
    const at = enemy === null ? undefined : BotLeaves.positionOf(state, enemy);
    if (enemy === null || at === undefined) {
      return 'failure';
    }
    if (enemy !== turn.memory.targetId) {
      turn.commands.push({ type: 'attack-target', actorId: id, targetId: enemy });
      turn.next = { ...turn.next, targetId: enemy };
    }
    this.mayCast(turn, enemy, at);
    if (state.entities.isInReach(id, enemy)) {
      turn.commands.push({ type: 'move', actorId: id, direction: { x: 0, y: 0 } });
      return 'running';
    }
    return this.moveTo(turn, at);
  }

  /** Finds the anchor of the most advanced allied horde on `lane`. */
  public findHorde(turn: BotTurn, lane: string): boolean {
    const { state, team } = turn;
    const routes = state.world?.routes ?? null;
    let lead = -1;
    state.hordes.forEach((horde) => {
      // The progress is all that is read, so which of two equal hordes wins does not matter.
      if (horde.team === team && horde.lane === lane && horde.progress > lead) {
        lead = horde.progress;
      }
    });
    if (routes === null || lead < 0) {
      return false;
    }
    routes.pose(lane, team, lead, this.anchor, this.forward);
    turn.destination = { x: this.anchor.x, y: this.anchor.y };
    return true;
  }

  /** Finds the nearest point of `lane` to `point` (the lane corridor, 11 §4.2). */
  public findLanePoint(turn: BotTurn, lane: string, point: Vec2): boolean {
    const routes = turn.state.world?.routes ?? null;
    if (routes === null || lane === '') {
      return false;
    }
    routes.pose(
      lane,
      turn.team,
      routes.distanceAlong(lane, turn.team, point),
      this.anchor,
      this.forward,
    );
    turn.destination = { x: this.anchor.x, y: this.anchor.y };
    return true;
  }

  /**
   * One `move` toward `destination`, through the A\* waypoint when the straight line is blocked,
   * or a halt once within `arrivalDistance` of it. When the pathfinder finds no way, a `stop`, a
   * forgotten target and `failure`, so the bot does not lean on the obstruction and lower branches may run.
   */
  public moveTo(turn: BotTurn, destination: Vec2 | null): BtStatus {
    if (destination === null) {
      return 'failure';
    }
    const { arrivalDistance } = turn.difficulty;
    const isThere =
      BotLeaves.gapSquared(turn.position, destination) <= arrivalDistance * arrivalDistance;
    const paths = turn.state.paths;
    if (!isThere && paths !== null && !paths.waypoint(turn.position, destination, this.step)) {
      // `stop` clears the live attack target, so memory forgets it too and a later fight re-targets.
      turn.commands.push({ type: 'stop', actorId: turn.id });
      turn.next = { ...turn.next, targetId: null };
      return 'failure';
    }
    const next = !isThere && paths !== null ? this.step : destination;
    turn.commands.push({
      type: 'move',
      actorId: turn.id,
      direction: isThere
        ? { x: 0, y: 0 }
        : { x: next.x - turn.position.x, y: next.y - turn.position.y },
    });
    return 'running';
  }

  /** Casts its first ability at the enemy when the cast is due and the roll comes up (11 §4.2). */
  private mayCast(turn: BotTurn, enemy: EntityId, at: Vec2): void {
    const { abilityUseChance, castIntervalTicks } = turn.difficulty;
    if (turn.state.tick < turn.memory.nextCastTick || turn.rng.nextFloat() >= abilityUseChance) {
      return;
    }
    turn.commands.push({
      type: 'cast-ability',
      actorId: turn.id,
      slot: 'ability-1',
      aim: { point: { x: at.x, y: at.y }, targetId: enemy },
    });
    turn.next = { ...turn.next, nextCastTick: turn.state.tick + castIntervalTicks };
  }

  private scorerFor(difficulty: BotDifficultyDefinition): UtilityScorer<'closeness' | 'weakness'> {
    let scorer = this.scorers.get(difficulty.id);
    if (scorer === undefined) {
      scorer = new UtilityScorer(difficulty.utilityWeights);
      this.scorers.set(difficulty.id, scorer);
    }
    return scorer;
  }

  /** Where `id` stood at the last index rebuild, or `undefined` when the index lacks it. */
  public static positionOf(state: GameState, id: EntityId): Vec2 | undefined {
    const index = state.space?.indexOf(id);
    if (state.space === null || index === undefined) {
      return undefined;
    }
    return {
      x: state.space.positions[2 * index] ?? 0,
      y: state.space.positions[2 * index + 1] ?? 0,
    };
  }

  /** The squared distance between two points. */
  public static gapSquared(a: Vec2, b: Vec2): number {
    return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
  }

  /** A bot's memory from its brain; anything it does not hold reads as a fresh bot's. */
  private static read(memory: AiMemory): BotMemory {
    return {
      lane: typeof memory.lane === 'string' ? memory.lane : '',
      isRetreating: memory.isRetreating === true,
      targetId: typeof memory.targetId === 'string' ? memory.targetId : null,
      nextCastTick: typeof memory.nextCastTick === 'number' ? memory.nextCastTick : 0,
    };
  }
}

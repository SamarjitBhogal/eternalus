import type { AiMemory, BotDifficultyDefinition } from '../content/ai/ai.types';
import type { EntityId } from '../state/EntityStore.types';
import { compareById } from '../utils/compareById';
import { sqrt } from '../utils/deterministicMath';
import type { Vec2 } from '../utils/geometry.types';
import { SeededRandom } from '../utils/SeededRandom';
import type { MutableVec2 } from '../utils/vec2.types';
import type { BtStatus } from './bt/BtNode.types';
import type { BotMemory, BotLegendControllerContent, BotTurn } from './BotLegendController.types';
import { BotMovement } from './BotMovement';
import type { Decision, DecisionInput } from './Controller.types';
import { closeness, weakness } from './utility/considerations';
import { UtilityScorer } from './utility/UtilityScorer';

/**
 * The conditions and actions every bot Legend tree is built from (architecture 11 §4.2):
 * surviving, choosing and fighting an enemy (and casting), attacking the lane's next enemy
 * structure, following the lead horde and walking. How the bot gets there (A\* round obstacles,
 * footprint edges, detours) is `BotMovement`'s. `BotLegendController` and `RoverController`
 * arrange the leaves into their trees. Stateless apart from scratch: what a bot remembers is its
 * brain.
 */
export class BotLeaves {
  private readonly scorers = new Map<string, UtilityScorer<'closeness' | 'weakness'>>();
  private readonly anchor: MutableVec2 = { x: 0, y: 0 };
  private readonly forward: MutableVec2 = { x: 0, y: 0 };
  private readonly movement = new BotMovement();

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
    const position = BotMovement.positionOf(state, entityId);
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
      objective: null,
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
      const gap = BotMovement.gapSquared(turn.position, feature.position);
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
      BotMovement.stop(turn);
    }
    return this.moveTo(turn, best.position);
  }

  /**
   * Picks the enemy in `engageRadius` the utility scorer likes best: an enemy unit, or a camp mob
   * attacking the bot (DEC-166; it never farms a camp that leaves it alone).
   */
  public findEnemy(turn: BotTurn): boolean {
    const { state, id, team, position, difficulty, perception } = turn;
    const enemies = perception.unitsWithin(position, difficulty.engageRadius, {
      hostileTo: team,
      neutralAttackersOf: id,
      aliveOnly: true,
    });
    turn.enemy = this.scorerFor(difficulty).best(enemies, (enemy) => {
      const at = BotMovement.positionOf(state, enemy) ?? position;
      return {
        closeness: closeness(sqrt(BotMovement.gapSquared(position, at)), difficulty.engageRadius),
        weakness: weakness(state.entities.healthFractionOf(enemy) ?? 1),
      };
    });
    return turn.enemy !== null;
  }

  /**
   * Attacks `turn.enemy`, may cast at it, and closes in until it is in reach. An enemy on ground
   * the nav grid blocks (inside a tower's fort court) is closed in on as a siege closes in, so the
   * bot follows it inside instead of waiting at the edge (DEC-189). A bot stuck on the way goes
   * round (`BotMovement.goRound`, DEC-193).
   */
  public fight(turn: BotTurn): BtStatus {
    const { state, id, enemy } = turn;
    const at = enemy === null ? undefined : BotMovement.positionOf(state, enemy);
    if (enemy === null || at === undefined) {
      return 'failure';
    }
    const isHolding = BotLeaves.attackAndHold(turn, enemy, state.entities.isInReach(id, enemy));
    this.mayCast(turn, enemy, at);
    if (isHolding) {
      return 'running';
    }
    if (BotMovement.goRound(turn)) {
      return 'running';
    }
    const isOnOpenGround = state.world?.grid.isWalkableAt(at.x, at.y) ?? true;
    return isOnOpenGround ? this.moveTo(turn, at) : this.movement.closeIn(turn, at, 0);
  }

  /**
   * Finds `lane`'s next standing enemy structure (18 §6.2) once the bot has come within
   * `engageRadius` of the point hordes gather at to attack it. A gate that cannot be broken yet
   * does not count, so the bot stays with its horde, which holds in front of it.
   */
  public findObjective(turn: BotTurn, lane: string): boolean {
    const { state, team, position, difficulty } = turn;
    const routes = state.world?.routes ?? null;
    if (routes === null || lane === '') {
      return false;
    }
    const objective = state.laneStructures.objectiveFor(lane, team, state.entities);
    const progress = routes.distanceAlong(lane, team, position);
    if (
      objective === null ||
      !objective.isBreakable ||
      progress + difficulty.engageRadius < objective.frontProgress
    ) {
      return false;
    }
    turn.objective = objective;
    return true;
  }

  /**
   * Attacks `turn.objective` (11 §4.2 `Push`): A\* to the edge of its footprint on the bot's side
   * (from its collider radius), then straight at it for the last step, holding once it is in
   * reach (B66-F1, `BotMovement.closeIn`). The edge faces the bot, so a Stronghold behind its wall
   * ring is reached through the ring's gate instead of leaned on from outside. A bot stuck on the
   * way goes round (`BotMovement.goRound`, DEC-193).
   */
  public siege(turn: BotTurn): BtStatus {
    const { state, id, objective } = turn;
    if (objective === null) {
      return 'failure';
    }
    const isInReach = state.entities.isInReach(id, objective.id);
    if (BotLeaves.attackAndHold(turn, objective.id, isInReach) || BotMovement.goRound(turn)) {
      return 'running';
    }
    return this.movement.closeIn(turn, objective, objective.radius);
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
   * One `move` toward `to`, or a halt once there, round blocked ground (`BotMovement.moveTo`):
   * the walking leaf of the trees.
   */
  public moveTo(turn: BotTurn, to: Vec2 | null): BtStatus {
    return this.movement.moveTo(turn, to);
  }

  /**
   * Points the bot's attack at `targetId` unless it already is, and holds it still while
   * `isInReach`: the opening Fight and Push share (DEC-168, B9). Returns whether it holds.
   */
  private static attackAndHold(turn: BotTurn, targetId: EntityId, isInReach: boolean): boolean {
    if (targetId !== turn.memory.targetId) {
      turn.commands.push({ type: 'attack-target', actorId: turn.id, targetId });
      turn.next = { ...turn.next, targetId };
    }
    if (isInReach) {
      BotMovement.halt(turn);
    }
    return isInReach;
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

  /** A bot's memory from its brain; anything it does not hold reads as a fresh bot's. */
  private static read(memory: AiMemory): BotMemory {
    return {
      lane: typeof memory.lane === 'string' ? memory.lane : '',
      isRetreating: memory.isRetreating === true,
      targetId: typeof memory.targetId === 'string' ? memory.targetId : null,
      nextCastTick: typeof memory.nextCastTick === 'number' ? memory.nextCastTick : 0,
      isHalted: memory.isHalted === true,
    };
  }
}

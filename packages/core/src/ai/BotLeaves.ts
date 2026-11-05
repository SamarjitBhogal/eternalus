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
 * surviving, choosing and fighting an enemy (and casting), attacking the lane's next enemy
 * structure, following the lead horde and walking,
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
      BotLeaves.stop(turn);
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
    const isHolding = BotLeaves.attackAndHold(turn, enemy, state.entities.isInReach(id, enemy));
    this.mayCast(turn, enemy, at);
    return isHolding ? 'running' : this.moveTo(turn, at);
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
   * (`approach` from its collider radius), then straight at it for the last step, holding once it
   * is in reach (B66-F1). The edge faces the bot, so a Stronghold behind its wall ring is reached
   * through the ring's gate instead of leaned on from outside.
   */
  public siege(turn: BotTurn): BtStatus {
    const { state, id, position, objective } = turn;
    if (objective === null) {
      return 'failure';
    }
    if (BotLeaves.attackAndHold(turn, objective.id, state.entities.isInReach(id, objective.id))) {
      return 'running';
    }
    const edge = BotLeaves.approach(turn, objective, objective.radius);
    // Measured from the structure, so stepping in from the edge never sends the bot back out.
    const isAtEdge =
      sqrt(BotLeaves.gapSquared(position, objective)) <=
      sqrt(BotLeaves.gapSquared(edge, objective)) + turn.difficulty.arrivalDistance;
    return isAtEdge
      ? BotLeaves.steer(turn, { x: objective.x - position.x, y: objective.y - position.y })
      : this.moveTo(turn, edge);
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
   * One `move` toward `to`, through the A\* waypoint when the straight line is blocked, or a halt
   * once within `arrivalDistance` of it. A `to` on blocked ground (a tower's centre) counts as its
   * footprint's edge on the bot's side (`approach`). When the pathfinder
   * finds no way, a `stop`, a forgotten target and `failure`, so the bot does not lean on the
   * obstruction and lower branches may run.
   */
  public moveTo(turn: BotTurn, to: Vec2 | null): BtStatus {
    if (to === null) {
      return 'failure';
    }
    const destination = BotLeaves.approach(turn, to, 0);
    const { arrivalDistance } = turn.difficulty;
    const isThere =
      BotLeaves.gapSquared(turn.position, destination) <= arrivalDistance * arrivalDistance;
    if (isThere) {
      return BotLeaves.halt(turn);
    }
    const paths = turn.state.paths;
    if (paths !== null && !paths.waypoint(turn.position, destination, this.step)) {
      BotLeaves.stop(turn);
      return 'failure';
    }
    const next = paths !== null ? this.step : destination;
    return BotLeaves.steer(turn, { x: next.x - turn.position.x, y: next.y - turn.position.y });
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
      BotLeaves.halt(turn);
    }
    return isInReach;
  }

  /** Heads the bot along `direction` (any length): a `move`, after which it is not halted. */
  private static steer(turn: BotTurn, direction: Vec2): BtStatus {
    turn.commands.push({ type: 'move', actorId: turn.id, direction });
    turn.next = { ...turn.next, isHalted: false };
    return 'running';
  }

  /** Holds the bot still: a zero `move`, sent only when it is not standing already (B66-F2). */
  private static halt(turn: BotTurn): BtStatus {
    if (!turn.next.isHalted) {
      turn.commands.push({ type: 'move', actorId: turn.id, direction: { x: 0, y: 0 } });
      turn.next = { ...turn.next, isHalted: true };
    }
    return 'running';
  }

  /**
   * A `stop`: it drops the heading and the live attack target, so memory forgets the target too
   * and a later fight re-targets.
   */
  private static stop(turn: BotTurn): void {
    turn.commands.push({ type: 'stop', actorId: turn.id });
    turn.next = { ...turn.next, targetId: null, isHalted: true };
  }

  /**
   * Where the bot can stand to reach `to`: the first point of the nav grid's open ground on the
   * way from `to` back to the bot, starting `clearance` out from `to`. That is `to` itself on open
   * ground, and the near edge of the footprint on blocked ground. Without it, A\* snaps a blocked
   * goal to the nearest open cell, the bot never comes within `arrivalDistance` of `to`, and every
   * decision overshoots that cell's centre and turns back: the playtest's bots moving in and out
   * of a tower's doorway (2026-11-04). `to` when no open ground lies between, or with no grid.
   */
  private static approach(turn: BotTurn, to: Vec2, clearance: number): Vec2 {
    const grid = turn.state.world?.grid;
    const { position } = turn;
    const span = sqrt(BotLeaves.gapSquared(position, to));
    if (grid === undefined || span === 0) {
      return to;
    }
    const start = Math.min(clearance, span);
    const steps = Math.ceil((span - start) / grid.cellSize);
    for (let step = 0; step <= steps; step += 1) {
      const along = Math.min(start + step * grid.cellSize, span) / span;
      const x = to.x + (position.x - to.x) * along;
      const y = to.y + (position.y - to.y) * along;
      if (grid.isWalkableAt(x, y)) {
        return { x, y };
      }
    }
    return to;
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
      isHalted: memory.isHalted === true,
    };
  }
}

import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import { sqrt } from '../utils/deterministicMath';
import type { Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';
import type { BtStatus } from './bt/BtNode.types';
import type { BotTurn } from './BotLegendController.types';

/**
 * How a bot Legend gets where its leaves send it (architecture 11 §4.2, 10 §9): `move`, halt and
 * `stop` commands, A\* waypoints from `state.paths` round blocked ground, the edge of a footprint
 * to stand at, the detour `StuckSystem` plans for a stuck bot (DEC-193), and the position and
 * distance helpers the leaves share. `BotLeaves` builds its conditions and actions on it.
 * Stateless apart from scratch.
 */
export class BotMovement {
  private readonly step: MutableVec2 = { x: 0, y: 0 };

  /**
   * One `move` toward `to`, through the A\* waypoint when the straight line is blocked, or a halt
   * once within `arrivalDistance` of it. A `to` on blocked ground (a tower's centre) counts as its
   * footprint's edge on the bot's side (`edgeOf`). When the pathfinder
   * finds no way, a `stop`, a forgotten target and `failure`, so the bot does not lean on the
   * obstruction and lower branches may run.
   */
  public moveTo(turn: BotTurn, to: Vec2 | null): BtStatus {
    if (to === null) {
      return 'failure';
    }
    const destination = BotMovement.edgeOf(turn, to, 0) ?? to;
    const { arrivalDistance } = turn.difficulty;
    const isThere =
      BotMovement.gapSquared(turn.position, destination) <= arrivalDistance * arrivalDistance;
    if (isThere) {
      return BotMovement.halt(turn);
    }
    const paths = turn.state.paths;
    if (paths !== null && !paths.waypoint(turn.position, destination, this.step)) {
      BotMovement.stop(turn);
      return 'failure';
    }
    const next = paths !== null ? this.step : destination;
    return BotMovement.steer(turn, { x: next.x - turn.position.x, y: next.y - turn.position.y });
  }

  /**
   * Closes in on `to` on blocked nav ground: A\* to its edge on the bot's side (`edgeOf`, from
   * `clearance` out), then straight at `to`. Measured from `to`, so stepping in from the edge never
   * sends the bot back out; a bot already inside the blocked ground keeps stepping in, and the
   * collision system stops it at the real walls (a fort's court is open, DEC-189).
   */
  public closeIn(turn: BotTurn, to: Vec2, clearance: number): BtStatus {
    const { position } = turn;
    const edge = BotMovement.edgeOf(turn, to, clearance);
    const isPastEdge =
      edge === null ||
      sqrt(BotMovement.gapSquared(position, to)) <=
        sqrt(BotMovement.gapSquared(edge, to)) + turn.difficulty.arrivalDistance;
    return isPastEdge
      ? BotMovement.steer(turn, { x: to.x - position.x, y: to.y - position.y })
      : this.moveTo(turn, edge);
  }

  /**
   * Heads the bot for its detour waypoint while the stuck detection has one for it (`StuckSystem`,
   * owner 2026-11-05, DEC-193): the A\* way round to its attack target, so it does not press a wall
   * forever. Returns whether it did.
   */
  public static goRound(turn: BotTurn): boolean {
    const way = turn.state.entities.detourWaypointOf(turn.id);
    if (way === null) {
      return false;
    }
    BotMovement.steer(turn, { x: way.x - turn.position.x, y: way.y - turn.position.y });
    return true;
  }

  /** Heads the bot along `direction` (any length): a `move`, after which it is not halted. */
  public static steer(turn: BotTurn, direction: Vec2): BtStatus {
    turn.commands.push({ type: 'move', actorId: turn.id, direction });
    turn.next = { ...turn.next, isHalted: false };
    return 'running';
  }

  /** Holds the bot still: a zero `move`, sent only when it is not standing already (B66-F2). */
  public static halt(turn: BotTurn): BtStatus {
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
  public static stop(turn: BotTurn): void {
    turn.commands.push({ type: 'stop', actorId: turn.id });
    turn.next = { ...turn.next, targetId: null, isHalted: true };
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

  /**
   * Where the bot can stand to reach `to`: the first point of the nav grid's open ground on the
   * way from `to` back to the bot, starting `clearance` out from `to`. That is `to` itself on open
   * ground, and the near edge of the footprint on blocked ground. Without it, A\* snaps a blocked
   * goal to the nearest open cell, the bot never comes within `arrivalDistance` of `to`, and every
   * decision overshoots that cell's centre and turns back: the playtest's bots moving in and out
   * of a tower's doorway (2026-11-04). `null` when no open ground lies between `to` and the bot
   * (it then stands inside the blocked ground around `to` itself), or with no grid.
   */
  private static edgeOf(turn: BotTurn, to: Vec2, clearance: number): Vec2 | null {
    const grid = turn.state.world?.grid;
    const { position } = turn;
    const span = sqrt(BotMovement.gapSquared(position, to));
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
    return null;
  }
}

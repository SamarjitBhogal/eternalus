import { ChaseWatch } from '../components/ChaseWatch';
import { Combat } from '../components/Combat';
import { Deploying } from '../components/Deploying';
import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import type { FormationDefinition } from '../content/mobs/formations/formations.types';
import type { StrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import type {
  FlowQuery,
  MovementContext,
  MovementStrategy,
} from '../entities/strategies/MovementStrategy.types';
import type { LaneFlowFields } from '../map/LaneFlowFields';
import type { WorldMap } from '../map/WorldMap';
import { formationSlot } from '../state/formationSlot';
import type { Rect, Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';
import type { PathingWorld } from './PathingSystem.types';
import type { System, SystemContext } from './System.types';

/**
 * Sets next tick's heading of every horde member and every guard (architecture 10 §9, 18 §5): it
 * lays each horde's formation out around its anchor (a member with an attack target chases it
 * instead, stopping at attack reach, and holding at blocked ground rather than following the lane
 * flow field, which leads to the lane's end, not to the target) and asks each mob's
 * `MovementStrategy` how to reach its slot, with neighbours from `state.space`. Runs after
 * `SpaceSystem`, so it reads this tick's positions. Allocates nothing per unit once its scratch has
 * grown to the crowd.
 *
 * Slots are `formationSlot`'s (18 §5.1), by each formation's shape, counting every follower in
 * `memberIds` order.
 *
 * A chase that `StuckSystem` found stuck heads for its `ChaseWatch` waypoint instead, the A\* way
 * round to its target (owner 2026-11-05, DEC-193), so blocked terrain holds it only until then.
 */
export class PathingSystem implements System {
  public readonly name = 'pathing';
  private readonly target: MutableVec2 = { x: 0, y: 0 };
  private readonly out: MutableVec2 = { x: 0, y: 0 };
  private readonly forward: MutableVec2 = { x: 0, y: 0 };
  private readonly anchor: MutableVec2 = { x: 0, y: 0 };
  /** The last `chase`'s target blocked depth (`chase`). */
  private depth = 0;
  private found = new Int32Array(0);
  private readonly flowFields: LaneFlowFields | null;
  private readonly forts: readonly Rect[];

  /**
   * @param strategies - Every movement strategy by id; a mob's `Movement.strategyId` picks one.
   * @param formations - Every formation, by id.
   * @param slotArrivalRadius - A mob this close to its formation slot is there.
   * @param world - The lane flow fields and the fort boxes (`PathingWorld`); none of either by
   *   default.
   */
  public constructor(
    private readonly strategies: StrategyRegistry['movement'],
    private readonly formations: Readonly<Record<string, FormationDefinition>>,
    private readonly slotArrivalRadius: number,
    { flowFields = null, forts = [] }: PathingWorld = {},
  ) {
    this.flowFields = flowFields;
    this.forts = forts;
  }

  /**
   * Points `target` at the unit `memberId` attacks (18 §5.2, engaging) and returns the distance
   * from it at which the target is in reach; `undefined` when it attacks nothing. The target point
   * is `EntityStore.aimPointOf`'s, the one `isInReach` measures to: on the outline of a target that
   * has one (a map object; a lane tower's fort or the Stronghold's palace, DEC-185), or the unit's
   * own position when it stands inside that outline, so it holds there (DEC-234), else its
   * centre. For an outline, and for a unit standing inside a fort's box, `depth` is how far the
   * blocked nav ground under the target reaches back toward the attacker: the grid blocks a fort's
   * whole court, but its walls stop no one at the doorways (owner 2026-11-04: units may enter
   * towers). Otherwise `depth` is 0. A stuck chase's detour waypoint (DEC-193) replaces the
   * target, reached like a slot.
   */
  private chase(state: SystemContext['state'], memberId: string): number | undefined {
    const attacker = state.entities.get(memberId);
    const combat = attacker?.findComponent(Combat);
    const targetId = combat?.targetId;
    const self = attacker?.findComponent(Transform);
    const other =
      targetId == null ? undefined : state.entities.get(targetId)?.findComponent(Transform);
    this.depth = 0;
    if (combat === undefined || self === undefined || targetId == null || other === undefined) {
      return undefined;
    }
    const way = attacker?.findComponent(ChaseWatch)?.waypoint;
    if (way != null) {
      this.target.x = way.x;
      this.target.y = way.y;
      return this.slotArrivalRadius;
    }
    const aimed = state.entities.aimPointOf(targetId, self.position, this.target);
    if (aimed === null) {
      return undefined;
    }
    const { x, y } = self.position;
    const grid = state.world?.grid;
    if (aimed !== 'centre') {
      this.depth = grid?.blockedRun(this.target.x, this.target.y, x, y) ?? 0;
      return self.radius + combat.attack.reach;
    }
    if (grid !== undefined && this.isInsideFort(other.position)) {
      this.depth = grid.blockedRun(this.target.x, this.target.y, x, y);
    }
    return self.radius + other.radius + combat.attack.reach;
  }

  /**
   * Whether `point` lies in a fort box (`PathingWorld.forts`: a lane tower's fort, the palace,
   * DEC-217 (16)).
   */
  private isInsideFort({ x, y }: Vec2): boolean {
    return this.forts.some(
      (box) => x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height,
    );
  }

  /**
   * Steers one mob for the next tick: toward the unit it attacks, stopping at reach, else toward
   * `this.target` (its slot or post), which the caller has set. The one rule horde members and
   * guards share.
   */
  private steer(
    state: SystemContext['state'],
    id: string,
    index: number,
    movement: Movement,
    strategy: MovementStrategy,
    context: { flow: FlowQuery | null } & Omit<MovementContext, 'flow'>,
  ): void {
    const reach = this.chase(state, id);
    context.arrivalRadius = reach ?? this.slotArrivalRadius;
    context.isChasing = reach !== undefined;
    context.targetBlockedDepth = this.depth;
    movement.steer(strategy.desiredVelocity(index, context));
  }

  /**
   * Steers a mob that spawned inside its structure straight to its exit (DEC-133), with no lane
   * field and no ground check, since it starts on blocked ground. Returns `true`, steering
   * nothing, once its body stands wholly on walkable ground or it is at its exit, whichever is
   * first, so neither a unit on the exit nor blocked ground past the opening holds it.
   *
   * @remarks ponytail: the body test checks its bounding box's corners, exact while a body is no
   * wider than a nav cell; test every cell under the box when bodies grow past that.
   */
  private steerOut(
    { exit }: Deploying,
    { position: { x, y }, radius }: Transform,
    grid: WorldMap | undefined,
    index: number,
    strategy: MovementStrategy,
    context: { flow: FlowQuery | null } & Omit<MovementContext, 'flow'>,
  ): boolean {
    const isClear =
      grid !== undefined &&
      grid.isWalkableAt(x - radius, y - radius) &&
      grid.isWalkableAt(x + radius, y - radius) &&
      grid.isWalkableAt(x - radius, y + radius) &&
      grid.isWalkableAt(x + radius, y + radius);
    const dx = exit.x - x;
    const dy = exit.y - y;
    if (isClear || dx * dx + dy * dy <= this.slotArrivalRadius * this.slotArrivalRadius) {
      return true;
    }
    this.target.x = exit.x;
    this.target.y = exit.y;
    context.arrivalRadius = this.slotArrivalRadius;
    context.isChasing = false;
    context.targetBlockedDepth = 0;
    const { flow } = context;
    context.flow = null;
    // The strategy writes the heading into `this.out`, which the caller hands to the mob.
    strategy.desiredVelocity(index, context);
    context.flow = flow;
    return false;
  }

  /** Rebuilds dirty flow fields, then steers every horde member for the next tick. */
  public update({ state }: SystemContext): void {
    this.flowFields?.rebuildDirty(state.config.map.flowFieldCellBudget);
    const routes = state.world?.routes;
    const grid = state.world?.grid;
    const { space } = state;
    if (
      routes === undefined ||
      space === null ||
      (state.hordes.size === 0 && state.guards.size === 0)
    ) {
      return;
    }
    if (this.found.length < space.count) {
      this.found = new Int32Array(Math.max(space.count, 2 * this.found.length));
    }
    // One context per tick; each horde sets its own lane's field, so nothing is built per horde.
    const context: { flow: FlowQuery | null } & Omit<MovementContext, 'flow'> = {
      flow: null,
      positions: space.positions,
      neighbours: space,
      found: this.found,
      target: this.target,
      arrivalRadius: this.slotArrivalRadius,
      isChasing: false,
      out: this.out,
    };
    state.hordes.forEach((horde) => {
      const formation = this.formations[horde.formationId];
      if (formation === undefined) {
        return;
      }
      context.flow = this.flowFields?.field(horde.lane, horde.team) ?? null;
      routes.pose(horde.lane, horde.team, horde.progress, this.anchor, this.forward);
      let follower = 0;
      for (const memberId of horde.memberIds) {
        // Count every follower, moving or not, so a skipped member never shifts the slots behind
        // it (`followerIndex`, 18 §5.1).
        const isLeader = memberId === horde.leaderId;
        const slot = isLeader ? -1 : follower;
        follower += isLeader ? 0 : 1;
        const index = space.indexOf(memberId);
        const entity = state.entities.get(memberId);
        const movement = entity?.findComponent(Movement);
        const strategyId = movement?.strategyId;
        const strategy = strategyId === undefined ? undefined : this.strategies[strategyId];
        if (
          entity === undefined ||
          index === undefined ||
          movement === undefined ||
          strategy === undefined
        ) {
          continue;
        }
        const deploying = entity.findComponent(Deploying);
        if (deploying !== undefined) {
          const body = entity.getComponent(Transform);
          if (!this.steerOut(deploying, body, grid, index, strategy, context)) {
            movement.steer(this.out);
            continue;
          }
          entity.removeComponent(Deploying);
        }
        formationSlot(this.anchor, this.forward, slot, formation, this.target);
        this.steer(state, memberId, index, movement, strategy, context);
      }
    });
    // Guards (18 §7): the unit they chase, or their post; never a lane field.
    context.flow = null;
    state.guards.forEach(({ guardId, postX, postY }) => {
      const index = guardId === null ? undefined : space.indexOf(guardId);
      const movement =
        guardId === null ? undefined : state.entities.get(guardId)?.findComponent(Movement);
      const strategyId = movement?.strategyId;
      const strategy = strategyId === undefined ? undefined : this.strategies[strategyId];
      if (
        guardId === null ||
        index === undefined ||
        movement === undefined ||
        strategy === undefined
      ) {
        return;
      }
      this.target.x = postX;
      this.target.y = postY;
      this.steer(state, guardId, index, movement, strategy, context);
    });
  }
}

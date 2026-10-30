import { Combat } from '../components/Combat';
import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import type { FormationDefinition } from '../content/mobs/formations/formations.types';
import type { StrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import type { FlowQuery, MovementContext } from '../entities/strategies/MovementStrategy.types';
import type { LaneFlowFields } from '../map/LaneFlowFields';
import { formationSlot } from '../state/formationSlot';
import type { MutableVec2 } from '../utils/vec2.types';
import type { System, SystemContext } from './System.types';

/**
 * Sets next tick's heading of every horde member (architecture 10 §9, 18 §5): it lays each
 * horde's formation out around its anchor (a member with an attack target chases it instead,
 * stopping at attack reach) and asks each mob's `MovementStrategy` how to reach its
 * slot, with neighbours from `state.space`. Runs after `SpaceSystem`, so it reads this tick's
 * positions. Allocates nothing per unit once its scratch has grown to the crowd.
 *
 * Slots are `formationSlot`'s (18 §5.1), counting every follower in `memberIds` order.
 *
 * @remarks ponytail: every formation is laid out as ranks; a slot function per shape arrives
 * with the second shape.
 */
export class PathingSystem implements System {
  public readonly name = 'pathing';
  private readonly target: MutableVec2 = { x: 0, y: 0 };
  private readonly out: MutableVec2 = { x: 0, y: 0 };
  private readonly forward: MutableVec2 = { x: 0, y: 0 };
  private readonly anchor: MutableVec2 = { x: 0, y: 0 };
  private found = new Int32Array(0);

  /**
   * @param strategies - Every movement strategy by id; a mob's `Movement.strategyId` picks one.
   * @param formations - Every formation, by id.
   * @param slotArrivalRadius - A mob this close to its formation slot is there.
   * @param flowFields - The lane flow fields (06 §6), which this system also rebuilds within
   *   `config.map.flowFieldCellBudget` each tick; without them mobs steer straight to their slots.
   */
  public constructor(
    private readonly strategies: StrategyRegistry['movement'],
    private readonly formations: Readonly<Record<string, FormationDefinition>>,
    private readonly slotArrivalRadius: number,
    private readonly flowFields: LaneFlowFields | null = null,
  ) {}

  /**
   * Points `target` at the unit `memberId` attacks (18 §5.2, engaging) and returns the distance
   * between centres at which it is in reach; `undefined` when it attacks nothing.
   */
  private chase(state: SystemContext['state'], memberId: string): number | undefined {
    const attacker = state.entities.get(memberId);
    const combat = attacker?.findComponent(Combat);
    const targetId = combat?.targetId;
    const self = attacker?.findComponent(Transform);
    const other =
      targetId == null ? undefined : state.entities.get(targetId)?.findComponent(Transform);
    if (combat === undefined || self === undefined || other === undefined) {
      return undefined;
    }
    this.target.x = other.position.x;
    this.target.y = other.position.y;
    return self.radius + other.radius + combat.attack.reach;
  }

  /** Rebuilds dirty flow fields, then steers every horde member for the next tick. */
  public update({ state }: SystemContext): void {
    this.flowFields?.rebuildDirty(state.config.map.flowFieldCellBudget);
    const { routes, space } = state;
    if (routes === null || space === null || state.hordes.size === 0) {
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
        const movement = state.entities.get(memberId)?.findComponent(Movement);
        const strategyId = movement?.strategyId;
        const strategy = strategyId === undefined ? undefined : this.strategies[strategyId];
        if (index === undefined || movement === undefined || strategy === undefined) {
          continue;
        }
        formationSlot(this.anchor, this.forward, slot, formation, this.target);
        context.arrivalRadius = this.chase(state, memberId) ?? this.slotArrivalRadius;
        movement.steer(strategy.desiredVelocity(index, context));
      }
    });
  }
}

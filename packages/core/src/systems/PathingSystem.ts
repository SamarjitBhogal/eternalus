import { Movement } from '../components/Movement';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { FormationDefinition } from '../content/mobs/formations/formations.types';
import type { FlowQuery, MovementContext } from '../entities/strategies/MovementStrategy.types';
import type { StrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import type { LaneFlowFields } from '../map/LaneFlowFields';
import { SpatialHash } from '../physics/SpatialHash';
import type { EntityId } from '../state/EntityStore.types';
import type { MutableVec2 } from '../utils/vec2.types';
import type { PathingBuffers } from './PathingSystem.types';
import type { System, SystemContext } from './System.types';

/**
 * Sets next tick's heading of every horde member (architecture 10 §9, 18 §5): it puts every unit
 * into a `SpatialHash`, lays each horde's formation out around its anchor and asks each mob's
 * `MovementStrategy` how to reach its slot. Runs after `MovementSystem`, so it reads this tick's
 * positions. Allocates nothing per unit once its buffers have grown.
 *
 * Slots (18 §5.1): the leader stands on the anchor; member `i` of the others in `memberIds`
 * order stands in rank `floor(i / ranksWidth) + 1` behind it and file
 * `i % ranksWidth − (ranksWidth − 1) / 2` across, `slotSpacing` apart.
 *
 * @remarks ponytail: every formation is laid out as ranks; a slot function per shape arrives
 * with the second shape.
 */
export class PathingSystem implements System {
  public readonly name = 'pathing';
  private readonly target: MutableVec2 = { x: 0, y: 0 };
  private readonly out: MutableVec2 = { x: 0, y: 0 };
  private readonly forward: MutableVec2 = { x: 0, y: 0 };
  private readonly indexOf = new Map<EntityId, number>();
  private buffers: PathingBuffers | null = null;

  /**
   * @param strategies - Every movement strategy by id; a mob's `Movement.strategyId` picks one.
   * @param formations - Every formation, by id.
   * @param cellSize - The neighbour grid's cell size: at least the largest neighbour radius.
   * @param flowFields - The lane flow fields (06 §6), which this system also rebuilds within
   *   `config.map.flowFieldCellBudget` each tick; without them mobs steer straight to their slots.
   */
  public constructor(
    private readonly strategies: StrategyRegistry['movement'],
    private readonly formations: Readonly<Record<string, FormationDefinition>>,
    private readonly cellSize: number,
    private readonly flowFields: LaneFlowFields | null = null,
  ) {}

  /** Rebuilds dirty flow fields, then steers every horde member for the next tick. */
  public update({ state }: SystemContext): void {
    this.flowFields?.rebuildDirty(state.config.map.flowFieldCellBudget);
    const { map, routes } = state;
    if (map === null || routes === null || state.hordes.size === 0) {
      return;
    }
    const buffers = this.fill(state, map.width, map.height);
    // One context per tick; each horde sets its own lane's field, so nothing is built per horde.
    const context: Omit<MovementContext, 'flow'> & { flow: FlowQuery | null } = {
      ...buffers,
      target: this.target,
      out: this.out,
      flow: null,
    };
    state.hordes.forEach((horde) => {
      const formation = this.formations[horde.formationId];
      if (formation === undefined) {
        return;
      }
      context.flow = this.flowFields?.field(horde.lane, horde.team) ?? null;
      routes.pose(horde.lane, horde.team, horde.progress, this.target, this.forward);
      const anchorX = this.target.x;
      const anchorY = this.target.y;
      let follower = 0;
      for (const memberId of horde.memberIds) {
        const index = this.indexOf.get(memberId);
        const movement = state.entities.get(memberId)?.findComponent(Movement);
        const strategyId = movement?.strategyId;
        const strategy = strategyId === undefined ? undefined : this.strategies[strategyId];
        if (index === undefined || movement === undefined || strategy === undefined) {
          continue;
        }
        let back = 0;
        let across = 0;
        if (memberId !== horde.leaderId) {
          back = (Math.floor(follower / formation.ranksWidth) + 1) * formation.slotSpacing;
          across =
            ((follower % formation.ranksWidth) - (formation.ranksWidth - 1) / 2) *
            formation.slotSpacing;
          follower += 1;
        }
        // `right` is `forward` turned a quarter: (-forward.y, forward.x).
        this.target.x = anchorX - this.forward.x * back - this.forward.y * across;
        this.target.y = anchorY - this.forward.y * back + this.forward.x * across;
        movement.steer(strategy.desiredVelocity(index, context));
      }
    });
  }

  /** Puts every unit with a position and a team into the buffers, growing them if needed. */
  private fill(state: SystemContext['state'], width: number, height: number): PathingBuffers {
    const size = state.entities.size;
    let buffers = this.buffers;
    if (buffers === null || buffers.xs.length < size) {
      const capacity = Math.max(size, (buffers?.xs.length ?? 0) * 2, 1);
      buffers = {
        neighbours: buffers?.neighbours ?? new SpatialHash(width, height, this.cellSize),
        xs: new Float64Array(capacity),
        ys: new Float64Array(capacity),
        found: new Int32Array(capacity),
      };
      this.buffers = buffers;
    }
    const filled = buffers;
    filled.neighbours.clear();
    this.indexOf.clear();
    let index = 0;
    state.entities.forEach((entity) => {
      const position = entity.findComponent(Transform)?.position;
      if (position === undefined || entity.findComponent(TeamMembership) === undefined) {
        return;
      }
      filled.xs[index] = position.x;
      filled.ys[index] = position.y;
      filled.neighbours.insert(index, position.x, position.y);
      this.indexOf.set(entity.id, index);
      index += 1;
    });
    return filled;
  }
}

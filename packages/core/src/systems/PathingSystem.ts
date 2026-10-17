import { Movement } from '../components/Movement';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { FormationDefinition } from '../content/mobs/formations/formations.types';
import type { LaneFollowMovementStrategy } from '../entities/strategies/LaneFollowMovementStrategy';
import type { Crowd } from '../entities/strategies/LaneFollowMovementStrategy.types';
import { SpatialHash } from '../physics/SpatialHash';
import type { EntityId } from '../state/EntityStore.types';
import type { MutableVec2 } from '../utils/vec2.types';
import type { System, SystemContext } from './System.types';

/**
 * Sets next tick's heading of every horde member (architecture 10 §9, 18 §5): it puts every unit
 * into a `SpatialHash`, lays each horde's formation out around its anchor and asks
 * `LaneFollowMovementStrategy` how each mob reaches its slot. Runs after `MovementSystem`, so it
 * reads this tick's positions. Allocates nothing per unit once its buffers have grown.
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
  private readonly steer: MutableVec2 = { x: 0, y: 0 };
  private readonly anchor: MutableVec2 = { x: 0, y: 0 };
  private readonly forward: MutableVec2 = { x: 0, y: 0 };
  private readonly slot: MutableVec2 = { x: 0, y: 0 };
  private readonly indexOf = new Map<EntityId, number>();
  private crowd: Crowd | null = null;

  /**
   * @param strategy - How horde members steer.
   * @param formations - Every formation, by id.
   */
  public constructor(
    private readonly strategy: LaneFollowMovementStrategy,
    private readonly formations: Readonly<Record<string, FormationDefinition>>,
  ) {}

  /** Steers every horde member for the next tick. */
  public update({ state }: SystemContext): void {
    const { map, routes } = state;
    if (map === null || routes === null || state.hordes.size === 0) {
      return;
    }
    const crowd = this.fill(state, map.width, map.height);
    state.hordes.forEach((horde) => {
      const formation = this.formations[horde.formationId];
      if (formation === undefined) {
        return;
      }
      routes.pose(horde.lane, horde.team, horde.progress, this.anchor, this.forward);
      let follower = 0;
      for (const memberId of horde.memberIds) {
        const index = this.indexOf.get(memberId);
        const movement = state.entities.get(memberId)?.findComponent(Movement);
        if (index === undefined || movement === undefined) {
          continue;
        }
        if (memberId === horde.leaderId) {
          this.slot.x = this.anchor.x;
          this.slot.y = this.anchor.y;
        } else {
          const back = (Math.floor(follower / formation.ranksWidth) + 1) * formation.slotSpacing;
          const across =
            ((follower % formation.ranksWidth) - (formation.ranksWidth - 1) / 2) *
            formation.slotSpacing;
          // `right` is `forward` turned a quarter: (-forward.y, forward.x).
          this.slot.x = this.anchor.x - this.forward.x * back - this.forward.y * across;
          this.slot.y = this.anchor.y - this.forward.y * back + this.forward.x * across;
          follower += 1;
        }
        this.strategy.steer(this.steer, crowd, index, this.slot);
        movement.steer(this.steer);
      }
    });
  }

  /** Puts every unit with a position and a team into the crowd, growing the buffers if needed. */
  private fill(state: SystemContext['state'], width: number, height: number): Crowd {
    const size = state.entities.size;
    let crowd = this.crowd;
    if (crowd === null || crowd.xs.length < size) {
      const capacity = Math.max(size, (crowd?.xs.length ?? 0) * 2, 1);
      crowd = {
        hash: crowd?.hash ?? new SpatialHash(width, height, this.strategy.neighbourRadius),
        xs: new Float64Array(capacity),
        ys: new Float64Array(capacity),
      };
      this.crowd = crowd;
    }
    const filled = crowd;
    filled.hash.clear();
    this.indexOf.clear();
    let index = 0;
    state.entities.forEach((entity) => {
      const position = entity.findComponent(Transform)?.position;
      if (position === undefined || entity.findComponent(TeamMembership) === undefined) {
        return;
      }
      filled.xs[index] = position.x;
      filled.ys[index] = position.y;
      filled.hash.insert(index, position.x, position.y);
      this.indexOf.set(entity.id, index);
      index += 1;
    });
    return filled;
  }
}

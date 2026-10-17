import { Movement } from '../components/Movement';
import type { FormationDefinition } from '../content/mobs/formations/formations.types';
import type { StrategyRegistry } from '../entities/strategies/defaultStrategyRegistry';
import type { MutableVec2 } from '../utils/vec2.types';
import type { System, SystemContext } from './System.types';

/**
 * Sets next tick's heading of every horde member (architecture 10 §9, 18 §5): it lays each
 * horde's formation out around its anchor and asks each mob's `MovementStrategy` how to reach its
 * slot, with neighbours from `state.space`. Runs after `SpaceSystem`, so it reads this tick's
 * positions. Allocates nothing per unit once its scratch has grown to the crowd.
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
  private found = new Int32Array(0);

  /**
   * @param strategies - Every movement strategy by id; a mob's `Movement.strategyId` picks one.
   * @param formations - Every formation, by id.
   */
  public constructor(
    private readonly strategies: StrategyRegistry['movement'],
    private readonly formations: Readonly<Record<string, FormationDefinition>>,
  ) {}

  /** Steers every horde member for the next tick. */
  public update({ state }: SystemContext): void {
    const { routes, space } = state;
    if (routes === null || space === null || state.hordes.size === 0) {
      return;
    }
    if (this.found.length < space.count) {
      this.found = new Int32Array(Math.max(space.count, 2 * this.found.length));
    }
    const context = {
      positions: space.positions,
      neighbours: space,
      found: this.found,
      target: this.target,
      out: this.out,
    };
    state.hordes.forEach((horde) => {
      const formation = this.formations[horde.formationId];
      if (formation === undefined) {
        return;
      }
      routes.pose(horde.lane, horde.team, horde.progress, this.target, this.forward);
      const anchorX = this.target.x;
      const anchorY = this.target.y;
      let follower = 0;
      for (const memberId of horde.memberIds) {
        const index = space.indexOf(memberId);
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
}

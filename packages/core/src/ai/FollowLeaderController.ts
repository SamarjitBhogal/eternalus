import type { Command } from '../commands/Command.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { Vec2 } from '../utils/geometry.types';
import type { Controller } from './Controller.types';
import type { FollowLeaderProfile } from './FollowLeaderController.types';

/**
 * Prototype decision (2026-10-08, demo): a follower walks to the nearest Legend of its team and
 * keeps a little space from that Legend and from other followers. Phase 3's `MinionController` (lane marching, aggro)
 * replaces it; nothing else depends on it.
 *
 * @remarks ponytail: scans every entity per decision, O(n²) per tick. Doc 11 §3 wants
 * `Perception` over `SpatialHash`; swap the scan once `SpatialHash` exists.
 */
export class FollowLeaderController implements Controller {
  public readonly id = 'follow-leader';

  /** @param profile - Distances and weights; the controller holds no numbers of its own. */
  public constructor(private readonly profile: FollowLeaderProfile) {}

  /** Steers toward the nearest allied Legend, or stops when close enough or leaderless. */
  public decide(state: GameState, entityId: EntityId): readonly Command[] {
    const store = state.entities;
    const self = store.positionOf(entityId);
    const team = store.teamOf(entityId);
    if (self === undefined || team === undefined) {
      return [];
    }
    const { followDistance, separationRadius, separationWeight, minSteer } = this.profile;
    let leader: Vec2 | undefined;
    let leaderDistance = Infinity;
    let pushX = 0;
    let pushY = 0;
    store.forEach((other) => {
      const at = other.id === entityId ? undefined : store.positionOf(other.id);
      if (at === undefined || store.teamOf(other.id) !== team) {
        return;
      }
      const dx = at.x - self.x;
      const dy = at.y - self.y;
      const distance = Math.hypot(dx, dy);
      const isLegend = other.family === 'legend';
      if (isLegend && distance < leaderDistance) {
        leader = at;
        leaderDistance = distance;
      }
      if (
        distance > 0 &&
        distance < separationRadius &&
        (isLegend || store.controllerOf(other.id) === this.id)
      ) {
        // Away from the neighbour, stronger the closer it is (full weight at contact, 0 at the radius).
        const strength = (separationWeight * (separationRadius - distance)) / separationRadius;
        pushX -= (dx / distance) * strength;
        pushY -= (dy / distance) * strength;
      }
    });
    const stop: Command = { type: 'stop', actorId: entityId };
    if (leader === undefined) {
      return [stop];
    }
    let x = pushX;
    let y = pushY;
    if (leaderDistance > followDistance) {
      x += (leader.x - self.x) / leaderDistance;
      y += (leader.y - self.y) / leaderDistance;
    }
    return Math.hypot(x, y) < minSteer
      ? [stop]
      : [{ type: 'move', actorId: entityId, direction: { x, y } }];
  }
}

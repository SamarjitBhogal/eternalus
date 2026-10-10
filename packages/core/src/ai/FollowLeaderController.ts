import type { Command } from '../commands/Command.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import { distance } from '../utils/geometry';
import type { Vec2 } from '../utils/geometry.types';
import { length } from '../utils/vec2';
import type { Controller } from './Controller.types';
import type { FollowLeaderProfile } from './FollowLeaderController.types';

/**
 * PROTOTYPE(PROTO-01) TEMPORARY: demo code. Delete this file, its `.types.ts` and tests, and
 * `content/ai/followLeaderProfile.ts` when Phase 3's `MinionController` (sprint 3.3) lands.
 *
 * Prototype decision (2026-10-08, demo): a follower walks to the nearest Legend of its team and
 * keeps a little space from that Legend and from other followers. Phase 3's `MinionController`
 * (lane marching, aggro) replaces it; nothing else depends on it. It sends a command only when
 * something changes: a `move` while it has somewhere to go, one `stop` when it arrives.
 *
 * @remarks ponytail: scans every entity per decision, O(n²) per tick. Doc 11 §3 wants
 * `Perception` over `SpatialHash`; swap the scan once `SpatialHash` exists.
 */
export class FollowLeaderController implements Controller {
  public readonly id = 'follow-leader';

  /** @param profile - Distances and weights; the controller holds no numbers of its own. */
  public constructor(private readonly profile: FollowLeaderProfile) {}

  /** The profile's decision cadence. */
  public get cadenceTicks(): number {
    return this.profile.decideEveryTicks;
  }

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
      const gap = distance(at, self);
      const isLegend = other.family === 'legend';
      if (isLegend && gap < leaderDistance) {
        leader = at;
        leaderDistance = gap;
      }
      if (
        gap > 0 &&
        gap < separationRadius &&
        (isLegend || store.controllerOf(other.id) === this.id)
      ) {
        // Away from the neighbour: full weight at contact, nothing at the radius.
        const strength = (separationWeight * (separationRadius - gap)) / separationRadius;
        pushX -= (dx / gap) * strength;
        pushY -= (dy / gap) * strength;
      }
    });
    // A stop only when the follower is still steering, so a settled escort sends nothing.
    const stop: readonly Command[] = store.isSteering(entityId)
      ? [{ type: 'stop', actorId: entityId }]
      : [];
    if (leader === undefined) {
      return stop;
    }
    if (leaderDistance > followDistance) {
      pushX += (leader.x - self.x) / leaderDistance;
      pushY += (leader.y - self.y) / leaderDistance;
    }
    return length({ x: pushX, y: pushY }) < minSteer
      ? stop
      : [{ type: 'move', actorId: entityId, direction: { x: pushX, y: pushY } }];
  }
}

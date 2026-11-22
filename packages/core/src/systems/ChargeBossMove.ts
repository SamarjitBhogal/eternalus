import { Movement } from '../components/Movement';
import type { BossMoveOf } from '../content/ai/ai.types';
import { sqrt } from '../utils/deterministicMath';
import type { BossMoveEffect, BossMoveLanding } from './BossMoveSystem.types';
import { unitsAlong } from './unitsAlong';

/**
 * The `charge` boss move: the boss dashes `length` metres along its facing, cut short where its
 * zone (its guard post's circle) ends, and every unit on that path takes `damage`. The dash is
 * `Movement.pushBy` on the boss, so it moves on the next movement step and stops at walls; the
 * hits are taken along the whole uncut path inside the zone.
 */
export class ChargeBossMove implements BossMoveEffect<'charge'> {
  /** Hits every unit on the path, in id order, then pushes the boss along it. */
  public land(move: BossMoveOf<'charge'>, landing: BossMoveLanding): void {
    const length = ChargeBossMove.reach(landing, move.length);
    for (const id of unitsAlong(landing, length, move.width)) landing.strike(id, move.damage);
    const { facing } = landing;
    landing.state.entities
      .get(landing.bossId)
      ?.findComponent(Movement)
      ?.pushBy({ x: facing.x * length, y: facing.y * length });
  }

  /** `length`, cut to where the boss's line along its facing leaves its zone (none off a post). */
  private static reach({ state, bossId, at, facing }: BossMoveLanding, length: number): number {
    const post = state.guards.slotOf(bossId);
    if (post === undefined) return length;
    const radius = post.homeRadius + post.leashRadius;
    const ox = at.x - post.homeX;
    const oy = at.y - post.homeY;
    // |at + t·facing − home| = radius: t = −b + √(b² − c), with b = o·facing and c = |o|² − r².
    const b = ox * facing.x + oy * facing.y;
    const c = ox * ox + oy * oy - radius * radius;
    const edge = -b + sqrt(Math.max(0, b * b - c));
    return Math.max(0, Math.min(length, edge));
  }
}

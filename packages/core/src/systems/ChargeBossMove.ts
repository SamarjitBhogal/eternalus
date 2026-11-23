import { Movement } from '../components/Movement';
import type { BossMoveOf } from '../content/ai/ai.types';
import type { BossMoveEffect, BossMoveLanding } from './BossMoveSystem.types';
import { reachInZone, unitsAlong } from './unitsAlong';

/**
 * The `charge` boss move: the boss dashes `length` metres along its facing, cut short where its
 * zone (its guard post's circle) ends, and every unit on that path takes `damage`. The dash is
 * `Movement.pushBy` on the boss, so it moves on the next movement step and stops at walls; the
 * hits are taken along the whole uncut path inside the zone.
 */
export class ChargeBossMove implements BossMoveEffect<'charge'> {
  /** Hits every unit on the path, in id order, then pushes the boss along it. */
  public land(move: BossMoveOf<'charge'>, landing: BossMoveLanding): void {
    const length = reachInZone(landing, move.length);
    for (const id of unitsAlong(landing, length, move.width)) landing.strike(id, move.damage);
    const { facing } = landing;
    landing.state.entities
      .get(landing.bossId)
      ?.findComponent(Movement)
      ?.pushBy({ x: facing.x * length, y: facing.y * length });
  }
}

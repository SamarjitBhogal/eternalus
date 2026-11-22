import { Movement } from '../components/Movement';
import { Transform } from '../components/Transform';
import type { BossMoveOf } from '../content/ai/ai.types';
import { cos, sqrt } from '../utils/deterministicMath';
import type { BossMoveEffect, BossMoveLanding } from './BossMoveSystem.types';

/**
 * The `cone` boss move (the sweeps): every unit within `radius` of the boss and within
 * `halfAngleDegrees` of its facing takes `damage` and is pushed `knockback` metres straight away
 * from the boss (along the facing when it stands on the boss's centre). The push is
 * `Movement.pushBy`, so it lands on the next movement step and stops at walls.
 */
export class ConeBossMove implements BossMoveEffect<'cone'> {
  /** Hits and pushes every unit inside the cone, in id order. */
  public land(move: BossMoveOf<'cone'>, landing: BossMoveLanding): void {
    const { state, at, facing, unitsWithin, strike } = landing;
    const minCos = cos((move.halfAngleDegrees * Math.PI) / 180);
    for (const id of unitsWithin(move.radius)) {
      const target = state.entities.get(id);
      const position = target?.findComponent(Transform)?.position;
      if (target === undefined || position === undefined) continue;
      const dx = position.x - at.x;
      const dy = position.y - at.y;
      const gap = sqrt(dx * dx + dy * dy);
      if (gap > 0 && dx * facing.x + dy * facing.y < gap * minCos) continue;
      strike(id, move.damage);
      const away = gap === 0 ? facing : { x: dx / gap, y: dy / gap };
      target.findComponent(Movement)?.pushBy({
        x: away.x * move.knockback,
        y: away.y * move.knockback,
      });
    }
  }
}

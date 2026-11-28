import type { BossMoveOf } from '../content/ai/ai.types';
import type { BossMoveEffect, BossMoveLanding } from './BossMoveSystem.types';

/** The `area` boss move (the slam): every unit within `radius` of the boss takes `damage`. */
export class AreaBossMove implements BossMoveEffect<'area'> {
  /** Hits every unit inside the circle, in id order. */
  public land(move: BossMoveOf<'area'>, { unitsWithin, strike }: BossMoveLanding): void {
    for (const id of unitsWithin(move.radius)) strike(id, move.damage);
  }
}

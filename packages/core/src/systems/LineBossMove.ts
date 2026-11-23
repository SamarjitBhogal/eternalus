import type { BossMoveOf } from '../content/ai/ai.types';
import type { BossMoveEffect, BossMoveLanding } from './BossMoveSystem.types';
import { reachInZone, unitsAlong } from './unitsAlong';

/**
 * The `line` boss move (the beam): every unit whose centre lies on the line from the boss along
 * its facing, `length` long (cut where the boss's zone ends, as the charge) and `width` wide,
 * takes `damage`. Walls do not stop it (nothing in
 * core traces a line against them yet; `INBOX.md`, the beam item).
 */
export class LineBossMove implements BossMoveEffect<'line'> {
  /** Hits every unit on the line, in id order. */
  public land(move: BossMoveOf<'line'>, landing: BossMoveLanding): void {
    for (const id of unitsAlong(landing, reachInZone(landing, move.length), move.width)) {
      landing.strike(id, move.damage);
    }
  }
}

import type { BossMoveEffect } from './BossMoveSystem.types';

/**
 * The `roar` boss move: it lands with no gameplay effect, so only `BossMoveSystem`'s
 * `boss-move-executed` marks it. balancing.md gives the GreaterBoss's roar no effect (the
 * MiniBoss's is a "concussion aura"); `INBOX.md` asks for one.
 */
export class RoarBossMove implements BossMoveEffect<'roar'> {
  /** Does nothing: the roar has no effect yet. */
  public land(): void {
    // No effect: `BossMoveSystem` emits `boss-move-executed` for it.
  }
}

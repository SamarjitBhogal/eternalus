import type { BossCast } from './BossCombat.types';

/** Replayable state for a boss's special attack cycle. */
export class BossCombat {
  public cast: BossCast | null = null;
  public nextMove = 0;
  public readyAt = 0;
  public readonly hit = new Set<string>();
}

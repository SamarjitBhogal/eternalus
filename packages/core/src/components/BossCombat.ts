import type { BossCast } from './BossCombat.types';
import type { BossMoveDefinition } from '../content/mobs/bossMoves.types';

/** Replayable state for a boss's special attack cycle. */
export class BossCombat {
  public cast: BossCast | null = null;
  public nextMove = 0;
  public readyAt = 0;
  public readonly hit = new Set<string>();
  public readonly usedMoves = new Set<number>();

  /** Keeps the immutable moves supplied by the unit definition. */
  public constructor(public readonly moves: readonly BossMoveDefinition[]) {}
}

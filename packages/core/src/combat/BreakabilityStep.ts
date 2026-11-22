import type { GameState } from '../state/GameState';
import type { DamageHit, DamageStep } from './DamageStep.types';

/**
 * Blocks every hit on an unbreakable target (architecture 07 §3): a wall or gate whose
 * breakability rule has not passed takes no damage, from anyone.
 */
export class BreakabilityStep implements DamageStep {
  public readonly name = 'breakability';

  /** Returns 0 when the target takes no damage now (`EntityStore.takesNoDamage`), the amount otherwise. */
  public adjust({ targetId, amount }: DamageHit, state: GameState): number {
    return state.entities.takesNoDamage(targetId) ? 0 : amount;
  }
}

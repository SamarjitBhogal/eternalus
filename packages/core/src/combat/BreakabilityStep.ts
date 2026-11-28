import { Collider } from '../components/Collider';
import type { GameState } from '../state/GameState';
import type { DamageHit, DamageStep } from './DamageStep.types';

/**
 * Blocks every hit on an unbreakable target (architecture 07 §3): a wall or gate whose
 * breakability rule has not passed takes no damage, from anyone.
 */
export class BreakabilityStep implements DamageStep {
  public readonly name = 'breakability';

  /** Returns 0 when the target's collider is unbreakable, the amount otherwise. */
  public adjust({ targetId, amount }: DamageHit, state: GameState): number {
    return state.entities.get(targetId)?.findComponent(Collider)?.isUnbreakable === true
      ? 0
      : amount;
  }
}

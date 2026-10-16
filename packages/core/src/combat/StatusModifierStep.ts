import { StatusEffects } from '../components/StatusEffects';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { DamageHit, DamageStep } from './DamageStep.types';

/**
 * Applies statuses to a hit: a blinded attacker's basic attacks miss, then the attacker's
 * `damageDealt` and the target's `damageTaken` multipliers scale what is left (enraged, sundered).
 */
export class StatusModifierStep implements DamageStep {
  public readonly name = 'status-modifiers';

  /** Returns the amount after the attacker's and the target's statuses. */
  public adjust({ targetId, amount, source }: DamageHit, state: GameState): number {
    const attacker =
      source.attackerId === null
        ? undefined
        : StatusModifierStep.statusesOf(source.attackerId, state);
    if (source.kind === 'weapon' && attacker?.has('attacks-miss') === true) {
      return 0;
    }
    const dealt = attacker?.multiplier('damageDealt') ?? 1;
    const taken = StatusModifierStep.statusesOf(targetId, state)?.multiplier('damageTaken') ?? 1;
    return amount * dealt * taken;
  }

  private static statusesOf(id: EntityId, state: GameState): StatusEffects | undefined {
    return state.entities.get(id)?.findComponent(StatusEffects);
  }
}

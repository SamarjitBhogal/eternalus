import { StatusEffects } from '../components/StatusEffects';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { DamageHit, DamageStep } from './DamageStep.types';

/**
 * Scales a hit by the attacker's `damageDealt` and the target's `damageTaken` multipliers (enraged,
 * sundered, marked). Blind is not a multiplier: its misses come from aim wobble (DEC-42).
 */
export class StatusModifierStep implements DamageStep {
  public readonly name = 'status-modifiers';

  /** Returns the amount after the attacker's and the target's statuses. */
  public adjust({ targetId, amount, source }: DamageHit, state: GameState): number {
    const dealt =
      source.attackerId === null
        ? 1
        : (StatusModifierStep.statusesOf(source.attackerId, state)?.multiplier('damageDealt') ?? 1);
    const taken = StatusModifierStep.statusesOf(targetId, state)?.multiplier('damageTaken') ?? 1;
    return amount * dealt * taken;
  }

  private static statusesOf(id: EntityId, state: GameState): StatusEffects | undefined {
    return state.entities.get(id)?.findComponent(StatusEffects);
  }
}

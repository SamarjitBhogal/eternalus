import { Health } from '../components/Health';
import { StatusEffects } from '../components/StatusEffects';
import type { StatusStat } from '../content/status-effects/statusEffects.types';
import type { EntityId } from '../state/EntityStore.types';
import type { GameState } from '../state/GameState';
import type { DamageHit, DamageStep } from './DamageStep.types';

/**
 * Scales a hit by the attacker's `damageDealt` and the target's `damageTaken` multipliers (enraged,
 * sundered, marked). Each side's own health, shields not counted, scales a modifier that grows as
 * its holder is hurt (Necromancy, DEC-330). Blind is not a multiplier: its misses come from aim
 * wobble (DEC-42).
 */
export class StatusModifierStep implements DamageStep {
  public readonly name = 'status-modifiers';

  /** Returns the amount after the attacker's and the target's statuses. */
  public adjust({ targetId, amount, source }: DamageHit, state: GameState): number {
    const dealt =
      source.attackerId === null
        ? 1
        : StatusModifierStep.multiplierOf(source.attackerId, 'damageDealt', state);
    const taken = StatusModifierStep.multiplierOf(targetId, 'damageTaken', state);
    return amount * dealt * taken;
  }

  /** `stat` of `id`'s statuses at its own health; 1 for an entity with none. */
  private static multiplierOf(id: EntityId, stat: StatusStat, state: GameState): number {
    const entity = state.entities.get(id);
    const statuses = entity?.findComponent(StatusEffects);
    if (statuses === undefined) {
      return 1;
    }
    const health = entity?.findComponent(Health);
    return statuses.multiplier(stat, health === undefined ? 1 : health.current / health.max);
  }
}

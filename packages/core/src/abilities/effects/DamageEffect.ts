import type { DamageSpec } from '../../content/abilities/AbilityDefinition.types';
import { isUnitFamily } from '../../entities/unitFamilies';
import type { DamageSource } from '../../state/GameEvents.types';
import type { AbilityEffect, CastContext } from '../AbilityEffect.types';

/**
 * Damages every enemy in the step's shape through the match's one `DamagePipeline` (architecture
 * 05 §3). The hit is the content `amount` grown by the caster's level (`CastContext.scaled`: +4%
 * per level, `balancing.md`), times the step's `structureMultiplier` against anything that is not a
 * unit: structures, obstacles and map objects (`balancing.md` "Structure damage multipliers",
 * DEC-209 (1)). Friendly fire, breakability and status modifiers stay the pipeline's steps.
 */
export class DamageEffect implements AbilityEffect<DamageSpec> {
  public readonly kind = 'damage';

  /** Deals the step's damage to every enemy in its shape, in id order. */
  public apply(spec: DamageSpec, cast: CastContext): void {
    const { state } = cast;
    const amount = cast.scaled('amount', spec.amount);
    const source: DamageSource = {
      attackerId: cast.casterId,
      kind: 'ability',
      definitionId: cast.abilityId,
    };
    for (const targetId of cast.targets(spec.shape, { team: 'enemies' })) {
      const family = state.entities.get(targetId)?.family ?? 'unit';
      const multiplier = isUnitFamily(family) ? 1 : (spec.structureMultiplier ?? 1);
      cast.damage.apply(state, targetId, amount * multiplier, source);
    }
  }
}

import { Progression } from '../components/Progression';
import type { ContentCatalogue } from '../content/ContentCatalogue';
import type { EntityDefinitionBase } from '../content/EntityDefinition.types';
import { LEGEND_KINDS } from '../content/legends/legendKinds';
import type { GameState } from '../state/GameState';
import type { DamageHit, DamageStep } from './DamageStep.types';

/**
 * A Legend's weapon hits grow with its level (DEC-380 (2), architecture 05 §13): the hit is
 * multiplied by the attacker's `Progression.potency` at its class's `basicAttackPerLevel`. Only
 * `weapon` hits scale here: an ability's amount is already scaled at cast (05 §13), and a status
 * tick, a structure or the environment has no level. A mob, or an attacker no longer in the store,
 * deals its hit unchanged.
 *
 * @remarks ponytail: the level is read when the hit lands, so a projectile that lands after its
 * shooter died deals ×1, and one that lands after a level-up uses the new level. Carry the level
 * on `DamageSource` (or `DamageHit`) at fire time if ranged weapons need it exact.
 */
export class BasicAttackLevelStep implements DamageStep {
  public readonly name = 'basic-attack-level';

  /**
   * @param units - The match's unit definitions (the same source as `ProgressionSystem`); a Legend
   * class's `levelScaling.basicAttackPerLevel` is read from it.
   */
  public constructor(
    private readonly units: Pick<ContentCatalogue<EntityDefinitionBase>, 'has' | 'get'>,
  ) {}

  /** Returns a Legend's weapon hit × its basic-attack potency, any other hit unchanged. */
  public adjust({ amount, source }: DamageHit, state: GameState): number {
    if (source.kind !== 'weapon' || source.attackerId === null) {
      return amount;
    }
    const attacker = state.entities.get(source.attackerId);
    const progression = attacker?.findComponent(Progression);
    if (
      attacker === undefined ||
      progression === undefined ||
      !this.units.has(attacker.definitionId)
    ) {
      return amount;
    }
    const definition = this.units.get(attacker.definitionId);
    if (!LEGEND_KINDS.has(definition)) {
      return amount;
    }
    return amount * progression.potency({ perLevel: definition.levelScaling.basicAttackPerLevel });
  }
}

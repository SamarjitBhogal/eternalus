import type { ExecuteSpec, WithoutTimes } from '../../content/abilities/AbilityDefinition.types';
import type { AbilityDisplayStep } from '../../content/loadDisplayContent';
import { UNIT_FAMILIES } from '../../entities/unitFamilies';
import type { DamageSource } from '../../state/GameEvents.types';
import type { AbilityEffect, CastContext } from '../AbilityEffect.types';
import { mustBeFraction } from '../specChecks';

/**
 * Kills every enemy unit in the step's shape whose health is at or below `atOrBelow` of its maximum,
 * read when the step runs (Rip & Tear, DEC-204: "enemies at or below 10% health die"). The kill goes
 * through the match's one `DamagePipeline` (`DamagePipeline.execute`): nothing reduces it (not
 * `damageTaken`, not a shield), but a damage step that blocks the hit fully (an unbreakable
 * structure, a body that takes no damage) spares the target. It is announced as a killing hit of the
 * caster's ability, so the kill, the XP, the assists and the ultimate meter follow as for any other
 * kill.
 */
export class ExecuteEffect implements AbilityEffect<ExecuteSpec> {
  public readonly kind = 'execute';

  /** An execute needs a threshold above 0 and at most 1, a fraction of max health. */
  public validate({ atOrBelow }: ExecuteSpec): readonly string[] {
    return atOrBelow > 0
      ? mustBeFraction(atOrBelow, 'execute atOrBelow')
      : ['execute atOrBelow must be above 0'];
  }

  /** Its area. */
  public describe({ kind, shape }: WithoutTimes<ExecuteSpec>): readonly AbilityDisplayStep[] {
    return [{ kind, shape }];
  }

  /** Kills every enemy unit in its shape at or below the threshold, in id order. */
  public apply(spec: ExecuteSpec, cast: CastContext): void {
    const { state } = cast;
    const source: DamageSource = {
      attackerId: cast.casterId,
      kind: 'ability',
      definitionId: cast.abilityId,
    };
    // TUNE: reading, owner card PR6 R6: an execute kills units only (Legends, minions, camp mobs,
    // bosses), never a structure or a map object, though DEC-206 (1) says "every enemy in the fan".
    for (const targetId of cast.targets(spec.shape, { team: 'enemies', families: UNIT_FAMILIES })) {
      const fraction = state.entities.healthFractionOf(targetId);
      if (fraction !== undefined && fraction <= spec.atOrBelow) {
        cast.damage.execute(state, targetId, source);
      }
    }
  }
}

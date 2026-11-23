import type { DebuffSpec, WithoutTimes } from '../../content/abilities/AbilityDefinition.types';
import type { AbilityDisplayStep } from '../../content/loadDisplayContent';
import type { AbilityEffect, CastContext } from '../AbilityEffect.types';
import { healthConditionProblems, mustBePositive } from '../specChecks';

/**
 * Applies a negative status to every enemy in the step's shape through the match's one
 * `StatusEffectApplier` (architecture 05 §3, §8), credited to the caster. A step's
 * `durationTicks` overrides the status's own duration for this application (Blade Runner's 0.5 s
 * stun against the 2 s default); without it the status lasts its own time. A step's `stacks`
 * applies the status that many times to each target (Hamstring's 2 bleed stacks, DEC-269); an
 * intensity status gains a stack each time, up to its `maxStacks`.
 */
export class DebuffEffect implements AbilityEffect<DebuffSpec> {
  public readonly kind = 'debuff';

  /** @param statuses - The statuses a debuff may name (`content/status-effects/`). */
  public constructor(private readonly statuses: { has(id: string): boolean }) {}

  /**
   * A debuff names a known status, a duration override, when set, of at least one tick, a stack
   * count, when set, that is a positive whole number, and health bounds, when set, from 0 to 1.
   */
  public validate(spec: DebuffSpec): readonly string[] {
    return [
      ...(this.statuses.has(spec.statusId) ? [] : [`debuff status "${spec.statusId}" is unknown`]),
      ...(spec.durationTicks === undefined
        ? []
        : mustBePositive(spec.durationTicks, 'debuff duration')),
      ...(spec.stacks === undefined || (Number.isInteger(spec.stacks) && spec.stacks > 0)
        ? []
        : ['debuff stacks must be a positive whole number']),
      ...healthConditionProblems(spec.health),
    ];
  }

  /** Its area. */
  public describe({ kind, shape }: WithoutTimes<DebuffSpec>): readonly AbilityDisplayStep[] {
    return [{ kind, shape }];
  }

  /**
   * Applies the step's status `stacks` times (once when absent) to every enemy in its shape, in id
   * order.
   */
  public apply(spec: DebuffSpec, cast: CastContext): void {
    const times = spec.stacks ?? 1;
    for (const targetId of cast.targets(spec.shape, { team: 'enemies', health: spec.health })) {
      for (let stack = 0; stack < times; stack += 1) {
        cast.statuses.apply(cast.state, targetId, spec.statusId, cast.casterId, spec.durationTicks);
      }
    }
  }
}

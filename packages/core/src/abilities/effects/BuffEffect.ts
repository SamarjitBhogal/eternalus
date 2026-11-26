import type { BuffSpec } from '../../content/abilities/AbilityDefinition.types';
import type { AbilityDisplayStep } from '../../content/loadDisplayContent';
import type { AbilityEffect, CastContext } from '../AbilityEffect.types';
import { mustBePositive } from '../specChecks';

/**
 * Applies a status to the caster itself through `CastContext.applyStatus` (architecture 05 §3,
 * §8), credited to the caster: Fury's `fury`, a passive's status. A step's `durationTicks`
 * overrides the status's own duration for this application; without it the status lasts its own
 * time. Either way the cast's `stretch` (the caster's `abilityDuration`, Erudition) lengthens it,
 * unless the status has `hasFixedDuration` (`StatusEffectApplier.durationFor`); a status
 * that lasts until removed stays so. It has no area (every buff built so far is on self), so the
 * aim overlay draws nothing for it.
 */
export class BuffEffect implements AbilityEffect<BuffSpec> {
  public readonly kind = 'buff';

  /** @param statuses - The statuses a buff may name (`content/status-effects/`). */
  public constructor(private readonly statuses: { has(id: string): boolean }) {}

  /** A buff names a known status, and a duration override, when set, of at least one tick. */
  public validate(spec: BuffSpec): readonly string[] {
    return [
      ...(this.statuses.has(spec.statusId) ? [] : [`buff status "${spec.statusId}" is unknown`]),
      ...(spec.durationTicks === undefined
        ? []
        : mustBePositive(spec.durationTicks, 'buff duration')),
    ];
  }

  /** Nothing: a buff on self has no area to draw. */
  public describe(): readonly AbilityDisplayStep[] {
    return [];
  }

  /** Applies the step's status to the caster. */
  public apply(spec: BuffSpec, cast: CastContext): void {
    cast.applyStatus(cast.casterId, spec);
  }
}

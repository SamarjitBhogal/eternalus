import type { UnitDefinition } from '../units/units.types';
import type { UnitDefinitionRule } from './ContentValidator.types';

/**
 * A unit with momentum (the Sentinel's Wrecking Run, DEC-307) must reach `walkSpeed` before its
 * top speed: the slow ramp runs from `walkSpeed` up to `maxSpeed`. `Momentum` checks the same at
 * spawn; this rule catches bad content when it loads.
 */
export class MomentumWalkSpeedRule implements UnitDefinitionRule {
  /** Flags a `momentum.walkSpeed` at or above the unit's `maxSpeed`. Units without momentum pass. */
  public check(definition: UnitDefinition): readonly string[] {
    const { momentum, maxSpeed } = definition.movementProfile;
    return momentum && momentum.walkSpeed >= maxSpeed
      ? ['momentum.walkSpeed must be below maxSpeed']
      : [];
  }
}

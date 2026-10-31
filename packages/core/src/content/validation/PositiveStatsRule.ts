import type { UnitDefinition } from '../units/units.types';
import type { UnitDefinitionRule } from './ContentValidator.types';

/** Health, footprint, every movement value and every attack number must be positive finite numbers. */
export class PositiveStatsRule implements UnitDefinitionRule {
  /** Flags each stat that is zero, negative, infinite or not a number. */
  public check(definition: UnitDefinition): readonly string[] {
    const stats = {
      baseHealth: definition.baseHealth,
      footprintRadius: definition.footprintRadius,
      ...definition.movementProfile,
      ...(definition.attack && {
        'attack.damage': definition.attack.damage,
        'attack.reach': definition.attack.reach,
        'attack.interval': definition.attack.interval,
      }),
    };

    return Object.entries(stats)
      .filter(([, value]) => !(Number.isFinite(value) && value > 0))
      .map(([field]) => `${field} must be a positive finite number`);
  }
}

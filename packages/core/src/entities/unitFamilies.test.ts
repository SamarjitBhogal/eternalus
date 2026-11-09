import { describe, expect, it } from 'vitest';

import { Legend } from './Legend';
import { Mob } from './Mob';
import { Unit } from './Unit';
import { isUnitFamily, UNIT_FAMILIES } from './unitFamilies';

class ConcreteUnit extends Unit {
  public readonly kind = 'concrete-unit';
}
class ConcreteLegend extends Legend {
  public readonly kind = 'concrete-legend';
}
class ConcreteMob extends Mob {
  public readonly kind = 'concrete-mob';
}

describe('unit families', () => {
  it('counts the family of every concrete unit class, plus boss', () => {
    const families = [ConcreteUnit, ConcreteLegend, ConcreteMob].map(
      (UnitClass) => new UnitClass('id', 'definition').family,
    );
    expect(families).toEqual(['unit', 'legend', 'mob']);
    expect(families.every(isUnitFamily)).toBe(true);
    expect(isUnitFamily('boss')).toBe(true);
    expect(UNIT_FAMILIES).toEqual(['unit', 'legend', 'mob', 'boss']);
  });

  it('does not count structures, zones, obstacles or projectiles', () => {
    for (const family of ['structure', 'zone', 'obstacle', 'projectile', '']) {
      expect(isUnitFamily(family)).toBe(false);
    }
  });
});

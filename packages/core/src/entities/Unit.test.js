import { describe, expect, it } from 'vitest';

import { Legend } from './Legend.js';
import { Mob } from './Mob.js';
import { Unit } from './Unit.js';

class ConcreteLegend extends Legend {
  get kind() {
    return 'concrete-legend';
  }

  installComponents() {}
}

class ConcreteMob extends Mob {
  get kind() {
    return 'concrete-mob';
  }

  installComponents() {}
}

describe('Unit family hierarchy', () => {
  it('treats Unit, Legend, and Mob as abstract-by-convention', () => {
    expect(() => new Unit('unit-1', 'unit-definition')).toThrow(
      'Unit is abstract and cannot be instantiated directly.',
    );
    expect(() => new Legend('legend-1', 'legend-definition')).toThrow(
      'Legend is abstract and cannot be instantiated directly.',
    );
    expect(() => new Mob('mob-1', 'mob-definition')).toThrow(
      'Mob is abstract and cannot be instantiated directly.',
    );
  });

  it('assigns expected family values to concrete subclasses', () => {
    const legend = new ConcreteLegend('legend-2', 'legend-definition');
    const mob = new ConcreteMob('mob-2', 'mob-definition');

    expect(legend.family).toBe('legend');
    expect(mob.family).toBe('mob');
  });
});

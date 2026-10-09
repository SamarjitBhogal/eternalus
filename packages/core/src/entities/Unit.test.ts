import { describe, expect, it } from 'vitest';

import { Legend } from './Legend';
import { Mob } from './Mob';
import { Unit } from './Unit';

class Marker {
  public readonly tag = 'marker';
}

class ConcreteUnit extends Unit {
  public readonly kind = 'concrete-unit';

  protected override installComponents(): void {
    this.addComponent(new Marker());
  }
}

class ConcreteLegend extends Legend {
  public readonly kind = 'concrete-legend';

  protected override installComponents(): void {
    this.addComponent(new Marker());
  }
}

class ConcreteMob extends Mob {
  public readonly kind = 'concrete-mob';

  protected override installComponents(): void {
    this.addComponent(new Marker());
  }
}

describe('Unit family hierarchy', () => {
  it('treats Unit, Legend, and Mob as abstract', () => {
    expect(() => {
      Reflect.construct(Unit, ['unit-1', 'unit-definition']);
    }).toThrow('Unit is abstract and cannot be instantiated directly.');
    expect(() => {
      Reflect.construct(Legend, ['legend-1', 'legend-definition']);
    }).toThrow('Legend is abstract and cannot be instantiated directly.');
    expect(() => {
      Reflect.construct(Mob, ['mob-1', 'mob-definition']);
    }).toThrow('Mob is abstract and cannot be instantiated directly.');
  });

  it('assigns expected family values to concrete subclasses', () => {
    const unit = new ConcreteUnit('unit-2', 'unit-definition');
    const legend = new ConcreteLegend('legend-2', 'legend-definition');
    const mob = new ConcreteMob('mob-2', 'mob-definition');

    expect(unit.family).toBe('unit');
    expect(legend.family).toBe('legend');
    expect(mob.family).toBe('mob');
    expect(legend).toBeInstanceOf(Unit);
    expect(mob).toBeInstanceOf(Unit);
  });
});

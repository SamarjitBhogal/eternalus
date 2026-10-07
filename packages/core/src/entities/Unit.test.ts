import { describe, expect, it } from 'vitest';

import { Collider } from '../components/Collider';
import { Health } from '../components/Health';
import { Movement } from '../components/Movement';
import { TeamMembership } from '../components/TeamMembership';
import { Transform } from '../components/Transform';
import type { UnitDefinition } from '../content/units/units.types';
import { Legend } from './Legend';
import { Mob } from './Mob';
import { Unit } from './Unit';

class ConcreteUnit extends Unit {
  public readonly kind = 'concrete-unit';

  public readonly family = 'obstacle';
}

class ConcreteLegend extends Legend {
  public readonly kind = 'warrior';
}

class ConcreteMob extends Mob {
  public readonly kind = 'light-mob';
}

const DEFINITION: UnitDefinition = {
  id: 'concrete-definition',
  kind: 'concrete-unit',
  displayName: 'Concrete Unit',
  baseHealth: 50,
  footprintRadius: 0.5,
  movement: { maxSpeed: 0.2, acceleration: 0.05, mass: 1 },
};

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

  it('assigns the family from the family class', () => {
    const legend = new ConcreteLegend('legend-2', 'warrior');
    const mob = new ConcreteMob('mob-2', 'light-mob');

    expect(legend.family).toBe('legend');
    expect(mob.family).toBe('mob');
    expect(legend).toBeInstanceOf(Unit);
    expect(mob).toBeInstanceOf(Unit);
  });

  it('installs the unit components from its definition', () => {
    const unit = new ConcreteUnit('unit-3', 'concrete-definition');

    unit.spawn({ definition: DEFINITION, position: { x: 3, y: 4 }, team: 'dark' });

    expect(unit.get(Transform).position).toEqual({ x: 3, y: 4 });
    expect(unit.get(Transform).radius).toBe(0.5);
    expect(unit.get(Health).base).toBe(50);
    expect(unit.get(Movement).maxSpeed).toBe(0.2);
    expect(unit.get(TeamMembership).team).toBe('dark');
    expect(unit.get(Collider).shape).toEqual({ kind: 'circle', radius: 0.5 });
    expect(unit.get(Collider).layer).toBe('unit');
  });

  it('rejects a definition that is not its own', () => {
    const unit = new ConcreteUnit('unit-4', 'concrete-definition');
    const spawnWith = (definition: UnitDefinition): void => {
      unit.spawn({ definition, position: { x: 0, y: 0 }, team: 'light' });
    };

    expect(() => {
      spawnWith({ ...DEFINITION, id: 'other-definition' });
    }).toThrow('got definition "other-definition" (concrete-unit)');
    expect(() => {
      spawnWith({ ...DEFINITION, kind: 'other-kind' });
    }).toThrow('got definition "concrete-definition" (other-kind)');
    expect(unit.has(Transform)).toBe(false);
  });

  it('accepts any context like Entity does, and rejects one that is not a UnitSpawnContext', () => {
    const position = { x: 0, y: 0 };
    const notContexts: unknown[] = [
      undefined,
      'warrior',
      {},
      { definition: null, position, team: 'light' },
      { definition: DEFINITION, position: null, team: 'light' },
      { definition: DEFINITION, position, team: 'purple' },
    ];

    for (const context of notContexts) {
      expect(() => {
        new ConcreteUnit('unit-5', 'concrete-definition').spawn(context);
      }).toThrow('needs a UnitSpawnContext (definition, position, team)');
    }
  });
});

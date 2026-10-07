import { describe, expect, it } from 'vitest';

import { Collider } from '../../components/Collider';
import { Health } from '../../components/Health';
import { Movement } from '../../components/Movement';
import { UNIT_DEFINITIONS } from '../../content/units/unitDefinitions';
import { Mob } from '../Mob';
import { Unit } from '../Unit';
import { MediumMob } from './MediumMob';

describe('MediumMob', () => {
  it('is a concrete mob of kind "medium-mob"', () => {
    const entity = new MediumMob('entity-1', 'medium-mob');

    expect(entity.kind).toBe('medium-mob');
    expect(entity.family).toBe('mob');
    expect(entity).toBeInstanceOf(Mob);
    expect(entity).toBeInstanceOf(Unit);
  });

  it('spawns with the stats of its definition', () => {
    const definition = UNIT_DEFINITIONS.get('medium-mob');
    const entity = new MediumMob('entity-1', 'medium-mob');

    entity.spawn({ definition, position: { x: 0, y: 0 }, team: 'light' });

    expect(entity.get(Health).base).toBe(definition.baseHealth);
    expect(entity.get(Movement).maxSpeed).toBe(definition.movement.maxSpeed);
    expect(entity.get(Collider).shape.radius).toBe(definition.footprintRadius);
  });

  it('refuses another class definition', () => {
    const entity = new MediumMob('entity-1', 'light-mob');

    expect(() => {
      entity.spawn({
        definition: UNIT_DEFINITIONS.get('light-mob'),
        position: { x: 0, y: 0 },
        team: 'light',
      });
    }).toThrow('got definition "light-mob"');
  });
});

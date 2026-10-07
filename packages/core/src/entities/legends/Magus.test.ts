import { describe, expect, it } from 'vitest';

import { Collider } from '../../components/Collider';
import { Health } from '../../components/Health';
import { Movement } from '../../components/Movement';
import { UNIT_DEFINITIONS } from '../../content/units/unitDefinitions';
import { Legend } from '../Legend';
import { Unit } from '../Unit';
import { Magus } from './Magus';

describe('Magus', () => {
  it('is a concrete legend of kind "magus"', () => {
    const entity = new Magus('entity-1', 'magus');

    expect(entity.kind).toBe('magus');
    expect(entity.family).toBe('legend');
    expect(entity).toBeInstanceOf(Legend);
    expect(entity).toBeInstanceOf(Unit);
  });

  it('spawns with the stats of its definition', () => {
    const definition = UNIT_DEFINITIONS.get('magus');
    const entity = new Magus('entity-1', 'magus');

    entity.spawn({ definition, position: { x: 0, y: 0 }, team: 'light' });

    expect(entity.get(Health).base).toBe(definition.baseHealth);
    expect(entity.get(Movement).maxSpeed).toBe(definition.movement.maxSpeed);
    expect(entity.get(Collider).shape.radius).toBe(definition.footprintRadius);
  });

  it('refuses another class definition', () => {
    const entity = new Magus('entity-1', 'warrior');

    expect(() => {
      entity.spawn({
        definition: UNIT_DEFINITIONS.get('warrior'),
        position: { x: 0, y: 0 },
        team: 'light',
      });
    }).toThrow('got definition "warrior"');
  });
});

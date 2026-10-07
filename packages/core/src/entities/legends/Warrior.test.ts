import { describe, expect, it } from 'vitest';

import { Collider } from '../../components/Collider';
import { Health } from '../../components/Health';
import { Movement } from '../../components/Movement';
import { UNIT_DEFINITIONS } from '../../content/units/unitDefinitions';
import { Legend } from '../Legend';
import { Unit } from '../Unit';
import { Warrior } from './Warrior';

describe('Warrior', () => {
  it('is a concrete legend of kind "warrior"', () => {
    const entity = new Warrior('entity-1', 'warrior');

    expect(entity.kind).toBe('warrior');
    expect(entity.family).toBe('legend');
    expect(entity).toBeInstanceOf(Legend);
    expect(entity).toBeInstanceOf(Unit);
  });

  it('spawns with the stats of its definition', () => {
    const definition = UNIT_DEFINITIONS.get('warrior');
    const entity = new Warrior('entity-1', 'warrior');

    entity.spawn({ definition, position: { x: 0, y: 0 }, team: 'light' });

    expect(entity.get(Health).base).toBe(definition.baseHealth);
    expect(entity.get(Movement).maxSpeed).toBe(definition.movement.maxSpeed);
    expect(entity.get(Collider).shape.radius).toBe(definition.footprintRadius);
  });

  it('refuses another class definition', () => {
    const entity = new Warrior('entity-1', 'sentinel');

    expect(() => {
      entity.spawn({
        definition: UNIT_DEFINITIONS.get('sentinel'),
        position: { x: 0, y: 0 },
        team: 'light',
      });
    }).toThrow('got definition "sentinel"');
  });
});

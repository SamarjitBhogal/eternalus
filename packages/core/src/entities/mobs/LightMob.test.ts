import { describe, expect, it } from 'vitest';

import { Collider } from '../../components/Collider';
import { Health } from '../../components/Health';
import { Movement } from '../../components/Movement';
import { UNIT_DEFINITIONS } from '../../content/units/unitDefinitions';
import { Mob } from '../Mob';
import { Unit } from '../Unit';
import { LightMob } from './LightMob';

describe('LightMob', () => {
  it('is a concrete mob of kind "light-mob"', () => {
    const entity = new LightMob('entity-1', 'light-mob');

    expect(entity.kind).toBe('light-mob');
    expect(entity.family).toBe('mob');
    expect(entity).toBeInstanceOf(Mob);
    expect(entity).toBeInstanceOf(Unit);
  });

  it('spawns with the stats of its definition', () => {
    const definition = UNIT_DEFINITIONS.get('light-mob');
    const entity = new LightMob('entity-1', 'light-mob');

    entity.spawn({ definition, position: { x: 0, y: 0 }, team: 'light' });

    expect(entity.get(Health).base).toBe(definition.baseHealth);
    expect(entity.get(Movement).maxSpeed).toBe(definition.movement.maxSpeed);
    expect(entity.get(Collider).shape.radius).toBe(definition.footprintRadius);
  });

  it('refuses another class definition', () => {
    const entity = new LightMob('entity-1', 'heavy-mob');

    expect(() => {
      entity.spawn({
        definition: UNIT_DEFINITIONS.get('heavy-mob'),
        position: { x: 0, y: 0 },
        team: 'light',
      });
    }).toThrow('got definition "heavy-mob"');
  });
});

describe('LightMob as the training dummy', () => {
  it('builds the training-dummy definition too', () => {
    const dummy = new LightMob('entity-2', 'training-dummy');

    dummy.spawn({
      definition: UNIT_DEFINITIONS.get('training-dummy'),
      position: { x: 0, y: 0 },
      team: 'neutral',
    });

    expect(dummy.definitionId).toBe('training-dummy');
    expect(dummy.get(Health).base).toBe(UNIT_DEFINITIONS.get('training-dummy').baseHealth);
  });
});

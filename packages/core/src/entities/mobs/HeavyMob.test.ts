import { describe, expect, it } from 'vitest';

import { Collider } from '../../components/Collider';
import { Health } from '../../components/Health';
import { Movement } from '../../components/Movement';
import { UNIT_DEFINITIONS } from '../../content/units/unitDefinitions';
import { Mob } from '../Mob';
import { Unit } from '../Unit';
import { HeavyMob } from './HeavyMob';

describe('HeavyMob', () => {
  it('is a concrete mob of kind "heavy-mob"', () => {
    const entity = new HeavyMob('entity-1', 'heavy-mob');

    expect(entity.kind).toBe('heavy-mob');
    expect(entity.family).toBe('mob');
    expect(entity).toBeInstanceOf(Mob);
    expect(entity).toBeInstanceOf(Unit);
  });

  it('spawns with the stats of its definition', () => {
    const definition = UNIT_DEFINITIONS.get('heavy-mob');
    const entity = new HeavyMob('entity-1', 'heavy-mob');

    entity.spawn({ definition, position: { x: 0, y: 0 }, team: 'light' });

    expect(entity.get(Health).base).toBe(definition.baseHealth);
    expect(entity.get(Movement).maxSpeed).toBe(definition.movement.maxSpeed);
    expect(entity.get(Collider).shape.radius).toBe(definition.footprintRadius);
  });

  it('refuses another class definition', () => {
    const entity = new HeavyMob('entity-1', 'medium-mob');

    expect(() => {
      entity.spawn({
        definition: UNIT_DEFINITIONS.get('medium-mob'),
        position: { x: 0, y: 0 },
        team: 'light',
      });
    }).toThrow('got definition "medium-mob"');
  });
});

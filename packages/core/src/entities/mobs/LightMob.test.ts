import { describe, expect, it } from 'vitest';

import { Collider } from '../../components/Collider';
import { Health } from '../../components/Health';
import { Movement } from '../../components/Movement';
import { Vision } from '../../components/Vision';
import { UNIT_DEFINITIONS } from '../../content/units/unitDefinitions';
import { Mob } from '../Mob';
import { Unit } from '../Unit';
import { LightMob } from './LightMob';

describe('LightMob', () => {
  it('is a concrete mob of kind "light-mob"', () => {
    const entity = new LightMob('entity-1', 'training-dummy');

    expect(entity.kind).toBe('light-mob');
    expect(entity.family).toBe('mob');
    expect(entity).toBeInstanceOf(Mob);
    expect(entity).toBeInstanceOf(Unit);
  });

  it('builds the training dummy with the stats of its definition', () => {
    const definition = UNIT_DEFINITIONS.get('training-dummy');
    const dummy = new LightMob('entity-1', 'training-dummy');

    dummy.spawn({ definition, position: { x: 0, y: 0 }, team: 'neutral' });

    expect(dummy.getComponent(Health).current).toBe(definition.baseHealth);
    expect(dummy.getComponent(Movement).maxSpeed).toBe(definition.movement.maxSpeed);
    expect(dummy.getComponent(Collider).shape.radius).toBe(definition.footprintRadius);
    expect(dummy.getComponent(Vision).radius).toBe(definition.visionRadius);
  });

  it('refuses a Legend definition', () => {
    const entity = new LightMob('entity-1', 'warrior');

    expect(() => {
      entity.spawn({
        definition: UNIT_DEFINITIONS.get('warrior'),
        position: { x: 0, y: 0 },
        team: 'light',
      });
    }).toThrow('got definition "warrior" (warrior)');
  });
});

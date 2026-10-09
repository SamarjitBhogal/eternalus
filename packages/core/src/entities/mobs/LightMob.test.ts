import { describe, expect, it } from 'vitest';

import { Brain } from '../../components/Brain';
import { Collider } from '../../components/Collider';
import { Health } from '../../components/Health';
import { Movement } from '../../components/Movement';
import { Vision } from '../../components/Vision';
import { MOB_DEFINITIONS } from '../../content/mobs/mobCatalogue';
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
    const definition = MOB_DEFINITIONS.get('training-dummy');
    const dummy = new LightMob('entity-1', 'training-dummy');

    dummy.spawn({ definition, position: { x: 0, y: 0 }, team: 'neutral' });

    expect(dummy.getComponent(Health).current).toBe(definition.baseHealth);
    expect(dummy.getComponent(Movement).maxSpeed).toBe(definition.movement.maxSpeed);
    expect(dummy.getComponent(Collider).shape.radius).toBe(definition.footprintRadius);
    expect(dummy.getComponent(Vision).radius).toBe(definition.visionRadius);
  });

  it('gets a Brain only when its definition names a controller', () => {
    const minion = new LightMob('entity-1', 'light-minion');
    const dummy = new LightMob('entity-2', 'training-dummy');

    minion.spawn({
      definition: MOB_DEFINITIONS.get('light-minion'),
      position: { x: 0, y: 0 },
      team: 'light',
    });
    dummy.spawn({
      definition: MOB_DEFINITIONS.get('training-dummy'),
      position: { x: 0, y: 0 },
      team: 'light',
    });

    expect(minion.getComponent(Brain).controllerId).toBe('follow-leader');
    expect(dummy.hasComponent(Brain)).toBe(false);
  });
});

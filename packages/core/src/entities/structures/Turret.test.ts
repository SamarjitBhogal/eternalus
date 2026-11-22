import { describe, expect, it } from 'vitest';

import { Collider } from '../../components/Collider';
import { ControllerBinding } from '../../components/ControllerBinding';
import { Health } from '../../components/Health';
import { Transform } from '../../components/Transform';
import { MAP_FEATURE_DEFINITIONS } from '../../content/maps/mapFeatureDefinitions';
import { STRUCTURE_DEFINITIONS } from '../../content/structures/structureCatalogue';
import { createDefaultEntityRegistry } from '../defaultEntityRegistry';
import { EntityFactory } from '../EntityFactory';
import { Turret } from './Turret';

describe('Turret', () => {
  it('is built from the shipped turret definition: 600 health, the map pylon radius, unbreakable at first, driven by the turret controller', () => {
    const factory = new EntityFactory(createDefaultEntityRegistry(), STRUCTURE_DEFINITIONS);

    const turret = factory.create('turret', 'turret', {
      position: { x: 10, y: 20 },
      team: 'light',
      mapFeatureId: 'light-turret-0',
    });

    expect(turret).toBeInstanceOf(Turret);
    expect(turret.kind).toBe('turret');
    expect(turret.family).toBe('structure');
    expect(turret.getComponent(Health).max).toBe(600);
    expect(turret.getComponent(Transform).radius).toBe(
      MAP_FEATURE_DEFINITIONS.turret?.footprintRadius,
    );
    expect(turret.getComponent(Collider).isUnbreakable).toBe(true);
    expect(turret.getComponent(ControllerBinding)).toMatchObject({
      controllerId: 'turret',
      profileId: 'wall-turret',
    });
  });
});

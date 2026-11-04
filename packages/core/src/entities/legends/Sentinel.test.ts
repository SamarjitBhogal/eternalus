import { describe, expect, it } from 'vitest';

import { Collider } from '../../components/Collider';
import { Health } from '../../components/Health';
import { Movement } from '../../components/Movement';
import { LEGEND_CLASSES } from '../../content/legends/legendCatalogue';
import { Legend } from '../Legend';
import { Unit } from '../Unit';
import { Sentinel } from './Sentinel';
import { loadWeapons } from '../../content/weapons/loadWeapons';

describe('Sentinel', () => {
  it('is a concrete legend of kind "sentinel"', () => {
    const entity = new Sentinel('entity-1', 'sentinel');

    expect(entity.kind).toBe('sentinel');
    expect(entity.family).toBe('legend');
    expect(entity).toBeInstanceOf(Legend);
    expect(entity).toBeInstanceOf(Unit);
  });

  it('spawns with the stats of its definition', () => {
    const definition = LEGEND_CLASSES.get('sentinel');
    const entity = new Sentinel('entity-1', 'sentinel');

    entity.spawn({ definition, position: { x: 0, y: 0 }, team: 'light', weapons: loadWeapons(30) });

    expect(entity.getComponent(Health).current).toBe(definition.baseHealth);
    expect(entity.getComponent(Movement).maxSpeed).toBe(definition.movementProfile.maxSpeed);
    expect(entity.getComponent(Collider).shape.radius).toBe(definition.footprintRadius);
  });
});

import { describe, expect, it } from 'vitest';

import { Aether } from '../../components/Aether';
import { Progression } from '../../components/Progression';
import { Collider } from '../../components/Collider';
import { Health } from '../../components/Health';
import { Movement } from '../../components/Movement';
import { LEGEND_CLASSES } from '../../content/legends/legendCatalogue';
import { Legend } from '../Legend';
import { Unit } from '../Unit';
import { Magus } from './Magus';
import { loadWeapons } from '../../content/weapons/loadWeapons';

describe('Magus', () => {
  it('is a concrete legend of kind "magus"', () => {
    const entity = new Magus('entity-1', 'magus');

    expect(entity.kind).toBe('magus');
    expect(entity.family).toBe('legend');
    expect(entity).toBeInstanceOf(Legend);
    expect(entity).toBeInstanceOf(Unit);
  });

  it('spawns with the stats of its definition', () => {
    const definition = LEGEND_CLASSES.get('magus');
    const entity = new Magus('entity-1', 'magus');

    entity.spawn({ definition, position: { x: 0, y: 0 }, team: 'light', weapons: loadWeapons(30) });

    expect(entity.getComponent(Health).current).toBe(definition.baseHealth);
    expect(entity.getComponent(Movement).maxSpeed).toBe(definition.movement.maxSpeed);
    expect(entity.getComponent(Collider).shape.radius).toBe(definition.footprintRadius);
    expect(entity.getComponent(Aether).max).toBe(definition.baseAether);
    expect(entity.getComponent(Progression).curveId).toBe(definition.levelCurveId);
  });
});

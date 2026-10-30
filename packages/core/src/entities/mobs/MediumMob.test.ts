import { describe, expect, it } from 'vitest';

import { Health } from '../../components/Health';
import { Movement } from '../../components/Movement';
import { MOB_DEFINITIONS } from '../../content/mobs/mobCatalogue';
import { Mob } from '../Mob';
import { MediumMob } from './MediumMob';

describe('MediumMob', () => {
  it('is a concrete mob of kind "medium-mob" built from the medium minion', () => {
    const definition = MOB_DEFINITIONS.get('medium-minion');
    const minion = new MediumMob('entity-1', 'medium-minion');

    minion.spawn({ definition, position: { x: 0, y: 0 }, team: 'dark' });

    expect(minion.kind).toBe('medium-mob');
    expect(minion).toBeInstanceOf(Mob);
    expect(minion.getComponent(Health).current).toBe(definition.baseHealth);
    expect(minion.getComponent(Movement).maxSpeed).toBe(definition.movementProfile.maxSpeed);
  });
});

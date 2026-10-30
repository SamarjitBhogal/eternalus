import { describe, expect, it } from 'vitest';

import { Health } from '../../components/Health';
import { Movement } from '../../components/Movement';
import { MOB_DEFINITIONS } from '../../content/mobs/mobCatalogue';
import { Mob } from '../Mob';
import { HeavyMob } from './HeavyMob';

describe('HeavyMob', () => {
  it('is a concrete mob of kind "heavy-mob" built from the heavy minion', () => {
    const definition = MOB_DEFINITIONS.get('heavy-minion');
    const minion = new HeavyMob('entity-1', 'heavy-minion');

    minion.spawn({ definition, position: { x: 0, y: 0 }, team: 'dark' });

    expect(minion.kind).toBe('heavy-mob');
    expect(minion).toBeInstanceOf(Mob);
    expect(minion.getComponent(Health).current).toBe(definition.baseHealth);
    expect(minion.getComponent(Movement).maxSpeed).toBe(definition.movement.maxSpeed);
  });
});

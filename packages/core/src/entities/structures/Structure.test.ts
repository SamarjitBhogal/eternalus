import { describe, expect, it } from 'vitest';

import { Collider } from '../../components/Collider';
import { Health } from '../../components/Health';
import { TeamMembership } from '../../components/TeamMembership';
import { Transform } from '../../components/Transform';
import type { StructureDefinition } from '../../content/structures/structures.types';
import { Structure } from './Structure';

class FakeTower extends Structure {
  public readonly kind = 'buff-tower';
}

const DEFINITION: StructureDefinition = {
  id: 'fake-buff-tower',
  kind: 'buff-tower',
  displayName: 'Fake Buff Tower',
  baseHealth: 1000,
  footprintRadius: 14,
};

describe('Structure', () => {
  it('is abstract and belongs to the structure family', () => {
    expect(() => {
      Reflect.construct(Structure, ['entity-1', 'fake-buff-tower']);
    }).toThrow('Structure is abstract and cannot be instantiated directly.');
    expect(new FakeTower('entity-1', 'fake-buff-tower').family).toBe('structure');
  });

  it('installs health, team and a static structure collider from its definition', () => {
    const tower = new FakeTower('entity-1', 'fake-buff-tower');

    tower.spawn({ definition: DEFINITION, position: { x: 300, y: 450 }, team: 'light' });

    expect(tower.get(Transform).position).toEqual({ x: 300, y: 450 });
    expect(tower.get(Health).base).toBe(1000);
    expect(tower.get(TeamMembership).team).toBe('light');
    expect(tower.get(Collider).layer).toBe('structure');
    expect(tower.get(Collider).isStatic).toBe(true);
  });

  it('takes layered shields on its health, as buff towers will grant them', () => {
    const tower = new FakeTower('entity-1', 'fake-buff-tower');
    tower.spawn({ definition: DEFINITION, position: { x: 0, y: 0 }, team: 'dark' });

    tower.get(Health).addShield('buff-tower-2', 1500);

    expect(tower.get(Health).total).toBe(2500);
  });

  it('needs a team', () => {
    const tower = new FakeTower('entity-1', 'fake-buff-tower');

    expect(() => {
      tower.spawn({ definition: DEFINITION, position: { x: 0, y: 0 } });
    }).toThrow('needs a spawn context with a team');
  });
});

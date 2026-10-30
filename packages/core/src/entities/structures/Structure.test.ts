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
  breakability: { kind: 'always' },
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

    expect(tower.getComponent(Transform).position).toEqual({ x: 300, y: 450 });
    expect(tower.getComponent(Health).current).toBe(1000);
    expect(tower.getComponent(TeamMembership).team).toBe('light');
    expect(tower.getComponent(Collider).layer).toBe('structure');
    expect(tower.getComponent(Collider).isStatic).toBe(true);
  });

  it('takes layered shields on its health, as buff towers will grant them', () => {
    const tower = new FakeTower('entity-1', 'fake-buff-tower');
    tower.spawn({ definition: DEFINITION, position: { x: 0, y: 0 }, team: 'dark' });

    tower.getComponent(Health).addShield('buff-tower-2', 1500);

    expect(tower.getComponent(Health).total).toBe(2500);
  });

  it('keeps the lane it was placed on, and starts unbreakable unless its rule is `always`', () => {
    const tower = new FakeTower('entity-1', 'fake-buff-tower');
    const gate = new FakeTower('entity-2', 'fake-gate');

    tower.spawn({
      definition: DEFINITION,
      position: { x: 0, y: 0 },
      team: 'dark',
      laneId: 'lane-2',
    });
    gate.spawn({
      definition: { ...DEFINITION, breakability: { kind: 'never' } },
      position: { x: 0, y: 0 },
      team: 'dark',
    });

    expect(tower.laneId).toBe('lane-2');
    expect(gate.laneId).toBeNull();
    expect(tower.getComponent(Collider).isUnbreakable).toBe(false);
    expect(gate.getComponent(Collider).isUnbreakable).toBe(true);
  });

  it('needs a team', () => {
    const tower = new FakeTower('entity-1', 'fake-buff-tower');

    expect(() => {
      tower.spawn({ definition: DEFINITION, position: { x: 0, y: 0 } });
    }).toThrow('needs a spawn context with a team');
  });
});

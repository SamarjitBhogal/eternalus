import { describe, expect, it } from 'vitest';

import { Collider } from '../../components/Collider';
import { ControllerBinding } from '../../components/ControllerBinding';
import { Combat } from '../../components/Combat';
import { Health } from '../../components/Health';
import { TeamMembership } from '../../components/TeamMembership';
import { Transform } from '../../components/Transform';
import { TurretState } from '../../components/TurretState';
import { loadTurrets } from '../../content/structures/loadTurrets';
import type { StructureDefinition } from '../../content/structures/structures.types';
import { BuffTower } from './BuffTower';
import { SpawnerTower } from './SpawnerTower';
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

  it("gives its collider the definition's canShotsFlyOver, and none without it (a forest camp, HC-Q105)", () => {
    const camp = new FakeTower('entity-1', 'fake-camp');
    const tower = new FakeTower('entity-2', 'fake-buff-tower');

    camp.spawn({
      definition: { ...DEFINITION, canShotsFlyOver: true },
      position: { x: 0, y: 0 },
      team: 'neutral',
    });
    tower.spawn({ definition: DEFINITION, position: { x: 0, y: 0 }, team: 'dark' });

    expect(camp.getComponent(Collider).canShotsFlyOver).toBe(true);
    expect(tower.getComponent(Collider).canShotsFlyOver).toBe(false);
  });

  it('keeps the map feature it was built from, and none without one', () => {
    const tower = new FakeTower('entity-1', 'fake-buff-tower');
    const spawned = new FakeTower('entity-2', 'fake-buff-tower');

    tower.spawn({
      definition: DEFINITION,
      position: { x: 0, y: 0 },
      team: 'dark',
      mapFeatureId: 'dark-buff-tower-lane-2',
    });
    spawned.spawn({ definition: DEFINITION, position: { x: 0, y: 0 }, team: 'dark' });

    expect(tower.mapFeatureId).toBe('dark-buff-tower-lane-2');
    expect(spawned.mapFeatureId).toBeNull();
  });

  it('binds the controller its definition names, with the profile or the controller id, and none without one', () => {
    const turret = new FakeTower('entity-1', 'fake-turret');
    const profiled = new FakeTower('entity-2', 'fake-turret');
    const tower = new FakeTower('entity-3', 'fake-buff-tower');

    turret.spawn({
      definition: { ...DEFINITION, controller: 'turret' },
      position: { x: 0, y: 0 },
      team: 'dark',
    });
    profiled.spawn({
      definition: { ...DEFINITION, controller: 'turret', aiProfile: 'wall-turret' },
      position: { x: 0, y: 0 },
      team: 'dark',
    });
    tower.spawn({ definition: DEFINITION, position: { x: 0, y: 0 }, team: 'dark' });

    expect(turret.getComponent(ControllerBinding)).toMatchObject({
      controllerId: 'turret',
      profileId: 'turret',
    });
    expect(profiled.getComponent(ControllerBinding).profileId).toBe('wall-turret');
    expect(tower.hasComponent(ControllerBinding)).toBe(false);
  });

  it('needs a team', () => {
    const tower = new FakeTower('entity-1', 'fake-buff-tower');

    expect(() => {
      tower.spawn({ definition: DEFINITION, position: { x: 0, y: 0 } });
    }).toThrow('needs a spawn context with a team');
  });

  describe('carrying ammo (a lane tower shoots as a wall turret does, DEC-302)', () => {
    const AMMO = loadTurrets(30).ammo;
    const armed = { ...DEFINITION, ammo: ['tower-orb'] } as const;
    const context = (definition: StructureDefinition, ammo: unknown = AMMO) => ({
      definition,
      position: { x: 0, y: 0 },
      team: 'light',
      ammo,
    });

    it.each([
      ['spawner tower', SpawnerTower],
      ['buff tower', BuffTower],
    ])(
      'installs a TurretState and a weaponless Combat on a %s whose definition names ammo',
      (_name, TowerClass) => {
        const tower = new TowerClass('entity-1', 'fake-buff-tower');
        tower.spawn(context(armed));

        expect(tower.getComponent(TurretState).loadedId).toBe('tower-orb');
        const combat = tower.getComponent(Combat);
        expect(combat.attack).toBe(AMMO.get('tower-orb').attack);
        expect(combat.weaponId).toBeNull();
      },
    );

    it('installs neither without ammo in its definition, and fails at spawn when the ammo is missing', () => {
      const unarmed = new FakeTower('entity-1', 'fake-buff-tower');
      unarmed.spawn(context(DEFINITION));

      expect(unarmed.findComponent(TurretState)).toBeUndefined();
      expect(unarmed.findComponent(Combat)).toBeUndefined();
      expect(() => {
        new FakeTower('entity-2', 'fake-buff-tower').spawn(context(armed, null));
      }).toThrow('Structure "entity-2" needs an ammo source to load its ammo.');
      expect(() => {
        new FakeTower('entity-3', 'fake-buff-tower').spawn(
          context({ ...DEFINITION, ammo: ['no-such-orb'] }),
        );
      }).toThrow('Structure "entity-3": unknown ammo "no-such-orb".');
    });
  });
});

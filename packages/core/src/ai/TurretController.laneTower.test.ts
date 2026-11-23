import { describe, expect, it } from 'vitest';

import { LANE_TOWER } from '../content/ai/turret';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { AT, setUp } from './__fixtures__/turretControllerSetup';

/** The owner's number (HC-Q96, Owner Calls v70, option A): 26 m from the tower's centre. */
const OWNER_REACH = 26;

/** A light spawner tower: `setUp` places the lane tower at `AT`, units by their distance east of it. */
const towerSetUp = () => setUp(undefined, undefined, 'spawner-tower');

describe('TurretController on a lane tower (DEC-302, DEC-342)', () => {
  it('takes an enemy unit inside 26 m of its centre and none outside (HC-Q96)', () => {
    const inside = towerSetUp();
    const near = inside.add('dark', OWNER_REACH - 0.1);
    const outside = towerSetUp();
    outside.add('dark', OWNER_REACH + 0.1);

    expect(inside.decide().memory.targetId).toBe(near);
    expect(outside.decide()).toMatchObject({ memory: { targetId: null }, commands: [] });
    expect(LANE_TOWER.range + STRUCTURE_DEFINITIONS.get('spawner-tower').footprintRadius).toBe(
      OWNER_REACH,
    );
  });

  it('aims an orb at the point ahead of its target without switching ammo', () => {
    const { turret, add, decide } = towerSetUp();
    add('dark', 20);

    const { commands } = decide();

    expect(commands).toHaveLength(1);
    expect(commands[0]).toMatchObject({ type: 'attack-aim', actorId: turret.id });
    expect(commands[0]).toMatchObject({ aim: { y: AT.y } });
  });

  it('takes no ally and no structure', () => {
    const { structures, state, add, decide } = towerSetUp();
    add('light', 10);
    state.entities.add(
      structures.create('buff-tower', 'buff-tower', {
        team: 'dark',
        position: { x: AT.x + 20, y: AT.y },
      }),
    );

    expect(decide()).toMatchObject({ memory: { targetId: null }, commands: [] });
  });

  it('leaves its target at once for an enemy Legend that hurt an allied Legend (the defend-ally override)', () => {
    const { add, decide, hit } = towerSetUp();
    const first = add('dark', 8);
    const { memory } = decide();
    const hurter = add('dark', 22, 'warrior', 'warrior');
    const ally = add('light', -20, 'warrior', 'warrior');

    expect(decide(memory).memory.targetId).toBe(first);

    hit(hurter, ally);

    expect(decide(memory).memory.targetId).toBe(hurter);
  });
});

import { describe, expect, it } from 'vitest';

import { Movement } from '../components/Movement';
import { LANE_TOWER } from '../content/ai/turret';
import { LEGEND_CLASSES } from '../content/legends/legendCatalogue';
import { STRUCTURE_DEFINITIONS } from '../content/structures/structureCatalogue';
import { distance } from '../utils/geometry';
import { AT, PROJECTILES, setUp } from './__fixtures__/turretControllerSetup';

/** The owner's number (DEC-366): 30 m from the tower's centre. */
const OWNER_REACH = 30;

/** A light spawner tower: `setUp` places the lane tower at `AT`, units by their distance east of it. */
const towerSetUp = () => setUp(undefined, undefined, 'spawner-tower');

describe('TurretController on a lane tower (DEC-302, DEC-342)', () => {
  it('takes an enemy unit inside 30 m of its centre and none outside (DEC-366)', () => {
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

  it('aims inside the orb range cap at the fastest Legend running away at full speed from the edge of its reach (the lead margin)', () => {
    const fastest = LEGEND_CLASSES.all().reduce((best, legend) =>
      legend.movementProfile.maxSpeed > best.movementProfile.maxSpeed ? legend : best,
    );
    const { state, add, decide } = towerSetUp();
    const target = add('dark', OWNER_REACH - 0.1, fastest.id, fastest.id);
    const movement = state.entities.get(target)?.getComponent(Movement);
    const topSpeed = fastest.movementProfile.maxSpeed / 30;
    movement?.steer({ x: 1, y: 0 });
    // A Legend reaches its top speed only after many seconds (the Sentinel after 50 s).
    for (let tick = 0; tick < 10_000 && (movement?.speed ?? topSpeed) < topSpeed; tick += 1) {
      movement?.advance();
    }

    const [command] = decide().commands;
    const aim = command?.type === 'attack-aim' ? command.aim : null;

    expect(movement?.speed).toBeCloseTo(topSpeed);
    expect(aim).not.toBeNull();
    expect(distance(AT, aim ?? AT)).toBeLessThanOrEqual(PROJECTILES.get('tower-orb').range);
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

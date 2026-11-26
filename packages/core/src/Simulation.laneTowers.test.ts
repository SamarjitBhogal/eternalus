import { describe, expect, it } from 'vitest';

import { Health } from './components/Health';
import { loadTurrets } from './content/structures/loadTurrets';
import { StateHasher } from './state/StateHasher';
import { doesDiscReachPolygon } from './utils/circlePolygon';
import type { Vec2 } from './utils/geometry.types';
import { MARCHING_ONLY } from './__fixtures__/hordeMatches';
import { config, COUNTDOWN, MAP, setUp, spawnDark } from './__fixtures__/turretMatch';

/** The owner's number (DEC-366): 30 m from the tower's centre. */
const OWNER_REACH = 30;
const ORB = loadTurrets(config.tickRate).ammo.get('tower-orb').attack;
const TOWER = MAP.features.find(({ kind, team }) => kind === 'spawner-tower' && team === 'light');
if (TOWER === undefined) throw new Error('The generated map has no light spawner tower.');

/** A point `distance` metres from the tower's centre, along the map's x axis. */
const awayFrom = (distance: number): Vec2 => ({
  x: TOWER.position.x + distance,
  y: TOWER.position.y,
});

/** A running match with the id of the light tower and a log of the damage the tower deals. */
const withTower = (options: Parameters<typeof setUp>[0] = {}) => {
  const context = setUp(options);
  const towerId =
    context.simulation.snapshot().entities.find(({ mapFeatureId }) => mapFeatureId === TOWER.id)
      ?.id ?? '';
  const dealt = new Map<string, number>();
  context.state.events.on('damage-applied', ({ targetId, amount, source }) => {
    if (source.attackerId === towerId) dealt.set(targetId, (dealt.get(targetId) ?? 0) + amount);
  });
  return { ...context, towerId, dealt };
};

const healthOf = (state: ReturnType<typeof setUp>['state'], id: string): number | undefined =>
  state.entities.get(id)?.findComponent(Health)?.current;

describe('Simulation lane towers (DEC-302, DEC-342)', () => {
  it('kills an enemy light minion that stands near it, with orbs', () => {
    const context = withTower({ content: MARCHING_ONLY });
    // Minions without a controller stand still (a horde-only unit is refused by `dev-spawn` else).
    const minionId = spawnDark(context, 'light-mob', 'light-minion', awayFrom(20));
    context.run(COUNTDOWN + config.tickRate * 8);

    expect(minionId).not.toBe('');
    expect(context.dealt.get(minionId)).toBeGreaterThanOrEqual(ORB.damage);
    expect(context.state.entities.get(minionId)).toBeUndefined();
  });

  it('shoots an enemy inside 30 m of its centre (also one at 28 m) and not one outside (DEC-366)', () => {
    const context = withTower();
    const inside = spawnDark(context, 'light-mob', 'training-dummy', awayFrom(OWNER_REACH - 1));
    const farInside = spawnDark(context, 'light-mob', 'training-dummy', awayFrom(OWNER_REACH - 2));
    const outside = spawnDark(context, 'light-mob', 'training-dummy', awayFrom(OWNER_REACH + 4));
    context.run(COUNTDOWN + config.tickRate * 6);

    expect(context.dealt.has(inside)).toBe(true);
    expect(context.dealt.has(farInside)).toBe(true);
    expect(context.dealt.has(outside)).toBe(false);
  });

  it('splashes: two enemy dummies near each other both take damage; an ally and the tower, both inside the blast, take none', () => {
    const context = withTower();
    // 12 m from the tower's centre to the south-east, in the fort's yard: the blast (3 m) reaches
    // the fort's corner, which is the tower's outline, and the orb crosses no wall on the way.
    const yard = (dx: number, dy = 0): Vec2 => ({
      x: TOWER.position.x + 8.5 + dx,
      y: TOWER.position.y - 8.5 - dy,
    });
    const first = spawnDark(context, 'light-mob', 'training-dummy', yard(0));
    const second = spawnDark(context, 'light-mob', 'training-dummy', yard(1.5));
    const ally = spawnLight(context, yard(0, 1.5));
    const landing = { ...(context.state.entities.placeOf(first)?.position ?? yard(0)) };
    const blast = ORB.projectile.splash?.radius ?? 0;
    const fort = context.state.entities.outlineOf(context.towerId)?.polygons ?? [];
    context.run(COUNTDOWN + config.tickRate * 3);

    expect(fort.some((polygon) => doesDiscReachPolygon(landing, blast, polygon))).toBe(true);
    expect(context.dealt.get(first)).toBeGreaterThan(0);
    expect(context.dealt.get(second)).toBeGreaterThan(0);
    expect(context.dealt.has(ally)).toBe(false);
    expect(healthOf(context.state, ally)).toBe(100);
    expect(healthOf(context.state, context.towerId)).toBe(
      context.simulation.snapshot().entities.find(({ id }) => id === context.towerId)?.health?.max,
    );
  });

  it('plays the same match twice from the same seed: same damage, same state hash', () => {
    const play = () => {
      // A standing heavy minion (1,200 health) takes every orb of the run, so a changed number shows.
      const context = withTower({ content: MARCHING_ONLY });
      const target = spawnDark(context, 'heavy-mob', 'heavy-minion', awayFrom(18));
      context.run(COUNTDOWN + config.tickRate * 5);
      return { dealt: context.dealt.get(target), hash: new StateHasher().hash(context.state) };
    };

    const [first, second] = [play(), play()];

    expect(first.dealt).toBeGreaterThanOrEqual(2 * ORB.damage);
    expect(second).toEqual(first);
  });
});

/** Spawns one light training dummy at `at`; returns its id. */
function spawnLight({ simulation, state, run }: ReturnType<typeof setUp>, at: Vec2): string {
  let id = '';
  const stop = state.events.on('entity-spawned', (spawned) => {
    if (
      id === '' &&
      spawned.team === 'light' &&
      state.entities.get(spawned.entityId)?.definitionId === 'training-dummy'
    ) {
      id = spawned.entityId;
    }
  });
  simulation.enqueueCommand({
    type: 'dev-spawn',
    kind: 'light-mob',
    definitionId: 'training-dummy',
    team: 'light',
    at,
    count: 1,
  });
  run(1);
  stop();
  return id;
}

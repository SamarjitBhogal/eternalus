import { describe, expect, it } from 'vitest';

import { isMinion, MARCHING_ONLY, STRONGHOLDS_ONLY } from '../../__fixtures__/hordeMatches';
import type { EntitySnapshot } from '../../state/Snapshot.types';
import { TWO_LANE_MAP } from '../../state/__fixtures__/twoLaneMap';
import { doesCircleOverlapPolygon } from '../../utils/circlePolygon';
import type { Vec2 } from '../../utils/geometry.types';
import { abilityMatch, type ScenarioSpawn } from '../__fixtures__/abilityMatch';

/**
 * Shield Wall (DEC-330 (7), reading R4, balancing.md:188): a 4 m by 1 m wall, square to the aim,
 * its middle 3 m in front of the Sentinel's centre, with 800 health. It blocks walking and shots
 * for both teams and any attack damages it. A Sentinel keeps at most 2: a 3rd removes the oldest,
 * and a destroyed one frees its place. It stays when the Sentinel is gone. 40 aether, 18 s.
 * The Sentinel stands at (110, 54), between the two-lane map's lane-1 (y 40) and its edge (y 60),
 * away from towers; minions only march (`MARCHING_ONLY`). Aimed east, its wall covers x 112.5 to
 * 113.5 and y 52 to 56.
 */
const SENTINEL: ScenarioSpawn = { kind: 'sentinel', team: 'light', at: { x: 110, y: 54 } };
const EAST = { x: 130, y: 54 };
/** Ticks per second (`createDefaultGameConfig`). */
const SECOND = 30;
/** The wall's cooldown and a tick. */
const COOLDOWN = 18 * SECOND + 1;
/** How far short of a wall `CollisionSystem` keeps a unit, at most. */
const SLACK = 1e-6;

/** The Sentinel and `others` on the two-lane map with no map objects (its walls are terrain only). */
const wallMatch = (others: readonly ScenarioSpawn[] = []) => {
  const match = abilityMatch([SENTINEL, ...others], {
    content: MARCHING_ONLY,
    world: { map: TWO_LANE_MAP, mapObjects: [] },
  });
  const removed: string[] = [];
  match.sim.on('entity-removed', ({ entityId, cause }) => removed.push(`${entityId} ${cause}`));
  const sentinel = match.ids[0] ?? '';
  /** The walls standing now, oldest first. */
  const walls = (): EntitySnapshot[] =>
    match.sim.snapshot().entities.filter((e) => e.definitionId === 'shield-wall-barrier');
  /** Casts Shield Wall (`ability-3`) aimed at `point`, then steps once. */
  const raise = (point: Vec2): void => {
    match.cast(sentinel, 'ability-3', point);
    match.run(1);
  };
  /** Queues Hamstring (`ability-3`) of `actorId` aimed at `point`. */
  const hamstring = (actorId: string, point: Vec2): void => {
    match.sim.enqueueCommand({
      type: 'cast-ability',
      actorId,
      slot: 'ability-3',
      aim: { point, targetId: null },
    });
  };
  return { ...match, sentinel, removed, walls, raise, hamstring };
};

describe('Shield Wall (scenario)', () => {
  it('raises a 4 m by 1 m wall with 800 health and no team, square to the aim, its middle 3 m ahead', () => {
    const { walls, raise, log, sentinel } = wallMatch();

    raise(EAST);

    expect(log).toContain(`1 cast ${sentinel} shield-wall`);
    const [wall] = walls();
    expect(wall?.transform).toMatchObject({ x: 113, y: 54 });
    expect(wall?.health).toEqual({ current: 800, max: 800 });
    expect(wall?.team).toBeNull();
    expect(wall?.outline).toEqual([
      [
        { x: 112.5, y: 52 },
        { x: 113.5, y: 52 },
        { x: 113.5, y: 56 },
        { x: 112.5, y: 56 },
      ],
    ]);
  });

  it('costs 40 aether and waits 18 s', () => {
    const { raise, run, log, sentinel, entity, walls } = wallMatch();
    const before = entity(sentinel)?.aether?.current ?? Number.NaN;

    raise(EAST);
    expect(before - (entity(sentinel)?.aether?.current ?? Number.NaN)).toBeCloseTo(40, 0);
    raise({ x: 110, y: 70 });
    expect(log).toContain(`2 rejected ${sentinel} on-cooldown`);
    run(COOLDOWN - 2);
    raise({ x: 110, y: 70 });
    expect(walls()).toHaveLength(2);
  });

  it('is refused, spending nothing, where it would overlap a wall', () => {
    const { raise, run, log, sentinel, entity, walls } = wallMatch();
    raise(EAST);
    run(COOLDOWN);
    const aether = entity(sentinel)?.aether?.current ?? Number.NaN;

    raise({ x: 112, y: 54.1 });

    expect(log.at(-1)).toBe(`${String(COOLDOWN + 2)} rejected ${sentinel} no-target`);
    expect(walls()).toHaveLength(1);
    expect(entity(sentinel)?.aether?.current).toBeGreaterThanOrEqual(aether);
  });

  it('is refused where it would reach past the map edge', () => {
    const { ids, cast, run, log } = abilityMatch(
      [{ kind: 'sentinel', team: 'light', at: { x: 2, y: 55 } }],
      { content: MARCHING_ONLY, world: { map: TWO_LANE_MAP, mapObjects: [] } },
    );

    cast(ids[0] ?? '', 'ability-3', { x: -10, y: 55 });
    run(1);

    expect(log).toEqual([`1 rejected ${ids[0] ?? ''} no-target`]);
  });

  it('stops a walker of each team at its face', () => {
    const { sim, ids, raise, run, at } = wallMatch([
      { kind: 'warrior', team: 'light', at: { x: 111, y: 52.5 } },
      { kind: 'warrior', team: 'dark', at: { x: 116, y: 54 } },
    ]);
    const [, light = '', dark = ''] = ids;
    raise(EAST);

    sim.enqueueCommand({ type: 'move', actorId: light, direction: { x: 1, y: 0 } });
    sim.enqueueCommand({ type: 'move', actorId: dark, direction: { x: -1, y: 0 } });
    run(3 * SECOND);

    expect(at(light).x).toBeLessThan(112.5 - 0.5 + SLACK);
    expect(at(light).x).toBeGreaterThan(111.5);
    expect(at(dark).x).toBeGreaterThan(113.5 + 0.5 - SLACK);
    expect(at(dark).x).toBeLessThan(115);
  });

  it('stops a shot of each team and takes the hit itself, as a tree or a rock (80 x 0.3)', () => {
    const { ids, raise, run, lost, walls, hamstring } = wallMatch([
      { kind: 'warrior', team: 'light', at: { x: 111, y: 52.5 } },
      { kind: 'warrior', team: 'dark', at: { x: 116, y: 54 } },
    ]);
    const [sentinel = '', light = '', dark = ''] = ids;
    raise(EAST);

    hamstring(light, { x: 116, y: 52.5 });
    hamstring(dark, { x: 111, y: 54 });
    run(SECOND);

    expect([lost(sentinel), lost(light), lost(dark)]).toEqual([0, 0, 0]);
    expect(lost(walls()[0]?.id)).toBeCloseTo(2 * 80 * 0.3, 5);
  });

  it('takes the attacks of both teams and breaks when its 800 health are gone', () => {
    const { sim, ids, raise, run, walls, removed } = wallMatch([
      { kind: 'warrior', team: 'light', at: { x: 111.5, y: 53 } },
      { kind: 'warrior', team: 'dark', at: { x: 114.5, y: 54 } },
    ]);
    const [, light = '', dark = ''] = ids;
    raise(EAST);
    const wall = walls()[0]?.id ?? '';
    const attackers = new Set<string>();
    let dealt = 0;
    sim.on('damage-applied', ({ targetId, amount, source }) => {
      if (targetId !== wall) return;
      dealt += amount;
      if (source.attackerId !== null) attackers.add(source.attackerId);
    });

    sim.enqueueCommand({ type: 'attack-aim', actorId: light, aim: { x: 113, y: 53 } });
    sim.enqueueCommand({ type: 'attack-aim', actorId: dark, aim: { x: 113, y: 54 } });
    let dealtWhileStanding = 0;
    for (let tick = 0; tick < 120 * SECOND && walls().length > 0; tick += 1) {
      dealtWhileStanding = dealt;
      run(1);
    }

    expect([...attackers].sort()).toEqual([light, dark].sort());
    expect(removed).toContain(`${wall} died`);
    expect(dealtWhileStanding).toBeLessThan(800);
    expect(dealt).toBeGreaterThanOrEqual(800);
  });

  it('keeps 2 walls: a 3rd removes the oldest, and one that is destroyed frees its place', () => {
    const { sim, raise, run, walls, removed } = wallMatch();
    raise(EAST);
    const first = walls()[0]?.id ?? '';
    run(COOLDOWN);
    raise({ x: 110, y: 70 });
    run(COOLDOWN);
    raise({ x: 90, y: 54 });

    expect(removed).toEqual([`${first} despawned`]);
    const [second = '', third = ''] = walls().map(({ id }) => id);
    expect(walls()).toHaveLength(2);

    sim.enqueueCommand({ type: 'dev-remove-entity', entityId: second });
    run(COOLDOWN);
    raise(EAST);

    expect(removed).toEqual([`${first} despawned`, `${second} dev-removed`]);
    expect(walls().map(({ id }) => id)).toEqual([third, expect.any(String)]);
  });

  it('lets a walker through where a wall was broken', () => {
    const { sim, ids, raise, run, at, walls } = wallMatch([
      { kind: 'warrior', team: 'dark', at: { x: 116, y: 54 } },
    ]);
    const dark = ids[1] ?? '';
    raise(EAST);

    sim.enqueueCommand({ type: 'dev-remove-entity', entityId: walls()[0]?.id ?? '' });
    sim.enqueueCommand({ type: 'move', actorId: dark, direction: { x: -1, y: 0 } });
    run(3 * SECOND);

    expect(at(dark).x).toBeLessThan(112.5);
  });

  it('stays when the Sentinel leaves the match', () => {
    const { sim, sentinel, raise, run, walls } = wallMatch();
    raise(EAST);

    sim.enqueueCommand({ type: 'dev-remove-entity', entityId: sentinel });
    run(10 * SECOND);

    expect(walls()).toHaveLength(1);
  });

  it('turns a marching lane minion around it: none ever stands in it, every one gets past', () => {
    const { sim, ids, cast, run } = abilityMatch(
      [{ kind: 'sentinel', team: 'light', at: { x: 57, y: 40 } }],
      { content: MARCHING_ONLY, world: { map: STRONGHOLDS_ONLY, mapObjects: [] } },
    );
    cast(ids[0] ?? '', 'ability-3', { x: 70, y: 40 });
    run(1);
    const wall = sim.snapshot().entities.find((e) => e.definitionId === 'shield-wall-barrier');
    const outline = wall?.outline?.[0] ?? [];
    let inside = 0;
    for (let tick = 0; tick < 40 * SECOND; tick += 1) {
      run(1);
      for (const { definitionId, transform } of sim.snapshot().entities) {
        if (
          transform !== null &&
          isMinion({ definitionId }) &&
          doesCircleOverlapPolygon(transform, transform.radius, outline)
        )
          inside += 1;
      }
    }
    const lightOnLane1 = sim
      .snapshot()
      .entities.filter((e) => isMinion(e) && e.team === 'light' && (e.transform?.y ?? 0) > 30);

    expect(outline).toHaveLength(4);
    expect(inside).toBe(0);
    expect(lightOnLane1.length).toBeGreaterThan(0);
    expect(lightOnLane1.every(({ transform }) => (transform?.x ?? 0) > 61)).toBe(true);
  });

  it('gives the same hash for the same seed and commands', () => {
    const play = (): number => {
      const { sim, raise, run } = wallMatch([
        { kind: 'warrior', team: 'dark', at: { x: 116, y: 54 } },
      ]);
      raise(EAST);
      run(COOLDOWN);
      raise({ x: 110, y: 70 });
      run(COOLDOWN);
      raise({ x: 90, y: 54 });
      return sim.hash();
    };

    expect(play()).toBe(play());
  });
});

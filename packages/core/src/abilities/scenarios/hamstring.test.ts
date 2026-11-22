import { describe, expect, it } from 'vitest';

import type { MapObject } from '../../content/maps/mapObjects.types';
import { TEST_DEBUG_CONFIG } from '../../diagnostics/InvariantRunner.constants';
import { TWO_LANE_MAP } from '../../state/__fixtures__/twoLaneMap';
import type { Vec2 } from '../../utils/geometry.types';
import { abilityMatch, type ScenarioSpawn } from '../__fixtures__/abilityMatch';

/**
 * Hamstring (DEC-268, DEC-269, balancing.md:184): a blade thrown along the aim at 30 m/s (1 m a
 * tick), 0.3 m wide, 12 m far. The first enemy body it touches takes it: a unit 80 damage and 2
 * bleed stacks, a structure or map object 80 x 0.3 = 24 and no bleed. It passes allies; walls
 * stop it. 25 aether, 9 s cooldown. The Warrior stands at (50, 50) and throws east.
 */
const CASTER: ScenarioSpawn = { kind: 'warrior', team: 'light', at: { x: 50, y: 50 } };
const EAST = { x: 70, y: 50 };

/** A square map object `kind` filling x = `west` to `west` + 1, y = 49 to 51, across the throw. */
const blockAt = (id: string, kind: MapObject['kind'], west: number): MapObject => ({
  id,
  kind,
  isBlocking: true,
  footprints: [
    [
      { x: west, y: 49 },
      { x: west + 1, y: 49 },
      { x: west + 1, y: 51 },
      { x: west, y: 51 },
    ],
  ],
});

/**
 * A house with two walls, one across the throw (x = 55 to 56) and one 10 m north: its position,
 * the average of its corners, is (55.5, 55), on neither wall, as a fort's lies in its open court.
 */
const TWO_WALL_HOUSE: MapObject = {
  ...blockAt('house-1', 'house', 55),
  footprints: [
    blockAt('house-1', 'house', 55).footprints[0] ?? [],
    [
      { x: 55, y: 59 },
      { x: 56, y: 59 },
      { x: 56, y: 61 },
      { x: 55, y: 61 },
    ],
  ],
};

/** The Warrior and `others`, Hamstring thrown at `aim` in tick 1, then `ticks` steps. */
const throwAt = (
  others: readonly ScenarioSpawn[],
  {
    ticks = 20,
    aim = EAST,
    mapObjects,
  }: { ticks?: number; aim?: Vec2; mapObjects?: MapObject[] } = {},
) => {
  const match = abilityMatch(
    [CASTER, ...others],
    mapObjects === undefined ? {} : { world: { map: TWO_LANE_MAP, mapObjects } },
  );
  /** Every body Hamstring's hit damaged, in order (a map's guards also deal damage). */
  const struck: string[] = [];
  match.sim.on('damage-applied', ({ targetId, source }) => {
    if (source.definitionId === 'hamstring') struck.push(targetId);
  });
  match.cast(match.ids[0] ?? '', 'ability-3', aim);
  match.run(ticks);
  return { ...match, struck };
};

const bleedLines = (log: readonly string[]) => log.filter((line) => line.includes('bleed'));

describe('Hamstring (scenario)', () => {
  it('deals 80 to the first enemy unit on the line and puts 2 bleed stacks on it', () => {
    const { ids, lost, log } = throwAt([{ kind: 'warrior', team: 'dark', at: { x: 56, y: 50 } }]);
    const enemy = ids[1] ?? '';

    expect(lost(enemy)).toBe(80);
    const bleed = bleedLines(log);
    expect(bleed).toHaveLength(2);
    expect(bleed.every((line) => line.endsWith(`bleed on ${enemy}`))).toBe(true);
  });

  it('then bleeds it 2 stacks x 6 a second for 4 s', () => {
    const { ids, lost } = throwAt([{ kind: 'warrior', team: 'dark', at: { x: 56, y: 50 } }], {
      ticks: 200,
    });

    expect(lost(ids[1])).toBe(80 + 2 * 6 * 4);
  });

  it('stops at the first enemy only: one behind it takes nothing', () => {
    const { ids, lost } = throwAt([
      { kind: 'warrior', team: 'dark', at: { x: 54, y: 50 } },
      { kind: 'warrior', team: 'dark', at: { x: 57, y: 50 } },
    ]);

    expect([ids[1], ids[2]].map(lost)).toEqual([80, 0]);
  });

  it('passes an ally on the line and hits the enemy behind it', () => {
    const { ids, lost } = throwAt([
      { kind: 'warrior', team: 'light', at: { x: 53, y: 50 } },
      { kind: 'warrior', team: 'dark', at: { x: 57, y: 50 } },
    ]);

    expect([ids[1], ids[2]].map(lost)).toEqual([0, 80]);
  });

  it('deals 80 x 0.3 to a structure, with no bleed', () => {
    const { ids, lost, log } = throwAt([
      { kind: 'spawner-tower', team: 'dark', at: { x: 58, y: 50 } },
    ]);

    expect(lost(ids[1])).toBeCloseTo(24, 9);
    expect(bleedLines(log)).toEqual([]);
  });

  it('deals 80 x 0.3 to a map object it strikes, though its position is on neither of its walls', () => {
    const { sim, run, cast, ids } = abilityMatch([CASTER], {
      world: { map: TWO_LANE_MAP, mapObjects: [TWO_WALL_HOUSE] },
    });
    const houseHealth = () =>
      sim.snapshot().mapObjects?.find(({ id }) => id === TWO_WALL_HOUSE.id)?.health?.current;
    const before = houseHealth();

    cast(ids[0] ?? '', 'ability-3', EAST);
    run(20);

    expect(before).toBe(100);
    expect(houseHealth()).toBeCloseTo(100 - 24, 9);
  });

  it('hits only the body it strikes: an enemy on the struck house’s position takes nothing', () => {
    const { sim, ids, lost } = throwAt(
      [{ kind: 'warrior', team: 'dark', at: { x: 55.5, y: 55 } }],
      {
        mapObjects: [TWO_WALL_HOUSE],
      },
    );
    const house = sim.snapshot().mapObjects?.find(({ id }) => id === TWO_WALL_HOUSE.id);

    expect(house?.health?.current).toBeCloseTo(100 - 24, 9);
    expect(lost(ids[1])).toBe(0);
  });

  it('is stopped by a wall: the enemy behind it takes nothing from it', () => {
    const { ids, log, struck } = throwAt(
      [{ kind: 'warrior', team: 'dark', at: { x: 57, y: 50 } }],
      { mapObjects: [blockAt('rift-1', 'terrain', 53)] },
    );

    expect(log).toContain(`1 cast ${ids[0] ?? ''} hamstring`);
    expect(struck).toEqual([]);
  });

  it('flies 30 m/s (DEC-268), 1 m a tick from its cast tick: an enemy 6 m away is hit in tick 6, one 9 m away in tick 9', () => {
    const hitTick = (x: number) =>
      bleedLines(throwAt([{ kind: 'warrior', team: 'dark', at: { x, y: 50 } }]).log)[0]?.split(
        ' ',
      )[0];

    expect([hitTick(56), hitTick(59)]).toEqual(['6', '9']);
  });

  it('moves exactly 1 m a tick in open ground (30 m/s, DEC-268), from its cast tick on', () => {
    const { ids, cast, run, at } = abilityMatch([CASTER]);

    cast(ids[0] ?? '', 'ability-3', EAST);
    const blade = [1, 2, 3, 4].map(() => {
      run(1);
      return at(ids[1]);
    });

    expect(blade).toEqual([51, 52, 53, 54].map((x) => ({ x, y: 50 })));
  });

  it('flies 12 m: an enemy inside the range is hit, one past it is not', () => {
    // 25 ticks: past the 12 m flight (12 ticks), before the first bleed tick (30).
    const near = throwAt([{ kind: 'warrior', team: 'dark', at: { x: 61, y: 50 } }], { ticks: 25 });
    const far = throwAt([{ kind: 'warrior', team: 'dark', at: { x: 63.5, y: 50 } }], { ticks: 25 });

    expect(near.lost(near.ids[1])).toBe(80);
    expect(far.lost(far.ids[1])).toBe(0);
  });

  it('flies along the aim, not toward the nearest enemy', () => {
    const { ids, lost } = throwAt(
      [
        { kind: 'warrior', team: 'dark', at: { x: 54, y: 50 } },
        { kind: 'warrior', team: 'dark', at: { x: 50, y: 56 } },
      ],
      { aim: { x: 50, y: 70 } },
    );

    expect([ids[1], ids[2]].map(lost)).toEqual([0, 80]);
  });

  it('spends 25 aether, then refuses the slot until the 9 s cooldown is over', () => {
    const { ids, cast, run, entity, log } = abilityMatch([CASTER]);
    const id = ids[0] ?? '';

    cast(id, 'ability-3', EAST);
    run(1);
    const afterCast = entity(id)?.aether?.current ?? 0;
    run(268);
    cast(id, 'ability-3', EAST); // tick 270: one tick short of 9 s
    run(1);
    cast(id, 'ability-3', EAST); // tick 271 = cast tick 1 + 270
    run(1);

    expect(afterCast).toBeCloseTo(100 - 25 + 4 / 30, 4); // DEC-201: 4/s at base, this tick's share
    expect(log.filter((line) => line.includes(' cast ') || line.includes('rejected'))).toEqual([
      `1 cast ${id} hamstring`,
      `270 rejected ${id} on-cooldown`,
      `271 cast ${id} hamstring`,
    ]);
  });

  it('is deterministic: the same throw gives the same hash, no throw a different one', () => {
    const enemy: ScenarioSpawn = { kind: 'warrior', team: 'dark', at: { x: 56, y: 50 } };
    const first = throwAt([enemy]);
    const second = throwAt([enemy]);
    const idle = abilityMatch([CASTER, enemy]);
    idle.run(20);

    expect(second.sim.hash()).toBe(first.sim.hash());
    expect(idle.sim.hash()).not.toBe(first.sim.hash());
  });
});

/**
 * Hamstring and Veil (DEC-266, DEC-327): the blade's hit ends Veil on the thrower and on the one
 * it strikes, and it strikes a Veiled enemy on its line, as an area does. Veil (`ability-2`) is
 * cast in tick 1, the blade in tick 2: the enemy 6 m east is hit in tick 7, and Veil stops at
 * that hit (HC-B19 (4)). It is removed (`invisible off`) in the status pass of tick 8
 * (`ProjectileSystem` runs after `StatusEffectSystem`). Every invariant runs each tick and throws.
 */
describe('Hamstring and Veil (scenario)', () => {
  const ENEMY_AT = { x: 56, y: 50 };

  const veilMatch = () => {
    const scenario = abilityMatch([CASTER, { kind: 'warrior', team: 'dark', at: ENEMY_AT }], {
      debug: TEST_DEBUG_CONFIG,
    });
    const [thrower = '', enemy = ''] = scenario.ids;
    /** Veil on `id` in tick 1, the blade thrown east in tick 2, then 18 more ticks. */
    const veilThenThrow = (id: string, at: Vec2): void => {
      scenario.cast(id, 'ability-2', at);
      scenario.run(1);
      scenario.cast(thrower, 'ability-3', EAST);
      scenario.run(19);
    };
    const veilLog = () => scenario.log.filter((line) => line.includes('invisible'));
    return { ...scenario, thrower, enemy, veilThenThrow, veilLog };
  };

  it('a Veiled Warrior’s blade hits the enemy for 80, and its own Veil ends', () => {
    const { thrower, enemy, lost, veilThenThrow, veilLog } = veilMatch();

    veilThenThrow(thrower, CASTER.at);

    expect(lost(enemy)).toBe(80);
    expect(lost(thrower)).toBe(0);
    expect(veilLog()).toEqual([`1 invisible on ${thrower}`, `8 invisible off ${thrower}`]);
  });

  it('the blade hits a Veiled enemy on its line for 80, and that Veil ends', () => {
    const { enemy, lost, veilThenThrow, veilLog } = veilMatch();

    veilThenThrow(enemy, ENEMY_AT);

    expect(lost(enemy)).toBe(80);
    expect(veilLog()).toEqual([`1 invisible on ${enemy}`, `8 invisible off ${enemy}`]);
  });
});

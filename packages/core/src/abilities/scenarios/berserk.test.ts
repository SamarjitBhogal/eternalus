import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../../config/defaultGameConfig';
import { loadDefaultContent } from '../../content/loadDefaultContent';
import type { MapObject } from '../../content/maps/mapObjects.types';
import type { MapDefinition } from '../../content/maps/maps.types';
import { TEST_DEBUG_CONFIG } from '../../diagnostics/InvariantRunner.constants';
import type { DefinitionSource } from '../../entities/EntityFactory.types';
import { MapGenerator } from '../../map/MapGenerator';
import { MapObjectBuilder } from '../../map/MapObjectBuilder';
import { MapPresentationBuilder } from '../../map/MapPresentationBuilder';
import { TWO_LANE_MAP } from '../../state/__fixtures__/twoLaneMap';
import { findUnitAt } from '../../state/findUnitAt';
import { doesCircleOverlapPolygon } from '../../utils/circlePolygon';
import type { Vec2 } from '../../utils/geometry.types';
import { abilityMatch } from '../__fixtures__/abilityMatch';
import type { ScenarioSpawn } from '../__fixtures__/abilityMatch';
import { unitsWithWarriorKit } from '../__fixtures__/casterState';

/**
 * Berserk (balancing.md:189, DEC-199): for 12 s (360 ticks) the Sentinel's body is 1.3× as wide,
 * it deals 1.5× and takes 0.7× damage, and its top speed is 20% higher with the same speed-up
 * rate (reading R5). The Sentinel (radius 1.25, DEC-06; reach 4 + Wuuthrad's 2 = 6 m from its
 * edge, DEC-305) stands at (50, 50) and fills its meter by killing four one-health enemy Magi
 * 3 m west (a Legend kill gives 25, DEC-272). A dark Vanguard (radius 0.5) stands 8 m east: 6.25 m
 * from edge to edge, out of reach, and 5.875 m once the Sentinel is 1.625 wide, in reach. Every
 * invariant runs each tick and throws.
 */
const SELF = { x: 50, y: 50 };
const FOE = { x: 58, y: 50 };
const NEAR_FOE = { x: 54, y: 50 };
/** The four Magi, 3 m west of the Sentinel's centre and inside one sweep (160°, DEC-304). */
const MAGI: readonly Vec2[] = [
  { x: 47, y: 50 },
  { x: 47.4, y: 51.5 },
  { x: 47.4, y: 48.5 },
  { x: 48.5, y: 52.6 },
];
/** A point 1.5 m north of the Sentinel's centre: off its body at 1.25, on it at 1.625. */
const OFF_EDGE = { x: 50, y: 51.5 };
const BERSERK_TICKS = 360;
const TOP_SPEED = 9 / 30; // sentinel.ts maxSpeed, metres per tick

const shipped = unitsWithWarriorKit();
const SENTINEL = loadDefaultContent(30).get('sentinel');
/**
 * The shipped content with one-health Magi (one hit kills one) and, when `isQuick`, a Sentinel
 * that reaches its top speed in one tick, so its top speed shows at once.
 */
const contentWith = (isQuick: boolean): DefinitionSource => ({
  has: (id) => shipped.has(id),
  get: (id) => {
    if (id === 'magus') return { ...shipped.get(id), baseHealth: 1 };
    if (id === 'sentinel' && isQuick) {
      return { ...SENTINEL, movementProfile: { ...SENTINEL.movementProfile, acceleration: 1 } };
    }
    return shipped.get(id);
  },
});

/**
 * The match: the Sentinel at `at` with the Magi and the foe placed around it as around `SELF`, on
 * no map or on `world`'s; `foeAt` moves the foe.
 */
const match = ({
  isQuick = false,
  world,
  at = SELF,
  foeAt,
}: {
  readonly isQuick?: boolean;
  readonly world?: { readonly map: MapDefinition; readonly mapObjects: readonly MapObject[] };
  readonly at?: Vec2;
  readonly foeAt?: Vec2;
} = {}) => {
  const near = (point: Vec2): Vec2 => ({ x: point.x - SELF.x + at.x, y: point.y - SELF.y + at.y });
  const spawns: ScenarioSpawn[] = [
    { kind: 'sentinel', team: 'light', at },
    { kind: 'warrior', team: 'dark', at: foeAt ?? near(FOE) },
    ...MAGI.map((point) => ({ kind: 'magus', team: 'dark' as const, at: near(point) })),
  ];
  const scenario = abilityMatch(spawns, {
    content: contentWith(isQuick),
    debug: TEST_DEBUG_CONFIG,
    ...(world === undefined ? {} : { world }),
  });
  // On a map, guards and waves spawn later: only the first ids are this match's own.
  const [sentinel = '', foe = '', ...magi] = scenario.ids.slice(0, spawns.length);
  const hits: string[] = [];
  scenario.sim.on('damage-applied', ({ targetId, amount, source }) => {
    hits.push(
      `${String(scenario.sim.tick)} ${String(source.attackerId)} ${targetId} ${String(amount)}`,
    );
  });
  /** Queues an attack of `actorId` on `targetId`, applied in the next step. */
  const attack = (actorId: string, targetId: string): void => {
    scenario.sim.enqueueCommand({ type: 'attack-target', actorId, targetId });
  };
  /** Queues a stop of `actorId`, applied in the next step. */
  const stop = (actorId: string): void => {
    scenario.sim.enqueueCommand({ type: 'stop', actorId });
  };
  /** Queues a walk of the Sentinel along `direction`, applied in the next step. */
  const walk = (direction: Vec2): void => {
    scenario.sim.enqueueCommand({ type: 'move', actorId: sentinel, direction });
  };
  /** Kills the four Magi; the meter is then full and the attack ready again (1.2 s, Wuuthrad). */
  const fillMeter = (): void => {
    for (const magus of magi) {
      if (scenario.entity(magus) === undefined) continue;
      attack(sentinel, magus);
      scenario.run(40);
    }
  };
  /** Fills the meter and casts Berserk: the cast lands in the next step. */
  const startBerserk = (): void => {
    fillMeter();
    scenario.cast(sentinel, 'ability-4', at);
    scenario.run(1);
  };
  /** The amounts `attackerId` dealt `targetId`, in order. */
  const dealt = (attackerId: string, targetId: string): number[] =>
    hits
      .map((line) => line.split(' '))
      .filter(([, attacker, target]) => attacker === attackerId && target === targetId)
      .map(([, , , amount]) => Number(amount));
  /** The Sentinel's snapshot radius now. */
  const radius = (): number => scenario.entity(sentinel)?.transform?.radius ?? Number.NaN;
  /** The unit a click of the foe's player at `point` picks (`findUnitAt`, the client's rule). */
  const clicked = (point: Vec2) => findUnitAt(scenario.sim.snapshot().entities, foe, point);
  return {
    ...scenario,
    sentinel,
    foe,
    attack,
    stop,
    walk,
    fillMeter,
    startBerserk,
    dealt,
    radius,
    clicked,
  };
};

describe('Berserk (scenario)', () => {
  it('casts once the meter is full, empties it, and lasts 12 s', () => {
    const { sentinel, log, cast, run, fillMeter } = match();

    cast(sentinel, 'ability-4', SELF);
    run(1);
    fillMeter();
    cast(sentinel, 'ability-4', SELF);
    run(1);
    cast(sentinel, 'ability-4', SELF); // the cast emptied the meter
    run(1);
    const castTick = Number(log.find((line) => line.endsWith('berserk'))?.split(' ')[0]);
    run(BERSERK_TICKS);

    expect(log.filter((line) => line.includes('berserk') || line.includes('rejected'))).toEqual([
      `1 rejected ${sentinel} not-charged`,
      `${String(castTick)} cast ${sentinel} berserk`,
      `${String(castTick)} berserk on ${sentinel}`,
      `${String(castTick + 1)} rejected ${sentinel} not-charged`,
      `${String(castTick + BERSERK_TICKS)} berserk off ${sentinel}`,
    ]);
  });

  it('grows the body 1.3×, so the click area and the reach grow, and shrinks it back after 12 s', () => {
    const { sentinel, foe, attack, stop, run, radius, clicked, dealt, fillMeter, cast } = match();
    fillMeter();
    const before = { radius: radius(), clicked: clicked(OFF_EDGE) };
    attack(sentinel, foe); // 0.25 m out of reach: no hit (no map, so no path to walk it)
    run(1);
    stop(sentinel);
    const hitsBefore = dealt(sentinel, foe).length;

    cast(sentinel, 'ability-4', SELF);
    run(1);
    const during = { radius: radius(), clicked: clicked(OFF_EDGE) };
    attack(sentinel, foe); // in reach now: the hit lands at once
    run(1);
    stop(sentinel);
    const hitsDuring = dealt(sentinel, foe).length;
    run(BERSERK_TICKS);
    const after = { radius: radius(), clicked: clicked(OFF_EDGE) };
    attack(sentinel, foe);
    run(1);

    expect(before).toEqual({ radius: 1.25, clicked: null });
    expect(hitsBefore).toBe(0);
    expect(during.radius).toBeCloseTo(1.25 * 1.3, 12);
    expect(during.clicked).toBe(sentinel);
    expect(hitsDuring).toBe(1);
    expect(after).toEqual({ radius: 1.25, clicked: null });
    expect(dealt(sentinel, foe)).toHaveLength(1);
  });

  it('deals 1.5× and takes 0.7× damage while it lasts', () => {
    // The foe 4 m east: in the Sentinel's reach and in its own (2 + Raptor Talons' 1 = 3 m).
    const berserk = match({ foeAt: NEAR_FOE });
    berserk.startBerserk();
    berserk.attack(berserk.sentinel, berserk.foe);
    berserk.attack(berserk.foe, berserk.sentinel);
    berserk.run(150);

    const normal = match({ foeAt: NEAR_FOE });
    normal.fillMeter();
    normal.attack(normal.sentinel, normal.foe);
    normal.attack(normal.foe, normal.sentinel);
    normal.run(150);

    const first = (scenario: ReturnType<typeof match>, from: string, to: string) =>
      scenario.dealt(from, to)[0] ?? Number.NaN;
    expect(first(normal, normal.sentinel, normal.foe)).toBe(90); // wuuthrad.ts
    expect(first(berserk, berserk.sentinel, berserk.foe)).toBeCloseTo(90 * 1.5, 9);
    expect(first(normal, normal.foe, normal.sentinel)).toBeGreaterThan(0);
    expect(first(berserk, berserk.foe, berserk.sentinel)).toBeCloseTo(
      first(normal, normal.foe, normal.sentinel) * 0.7,
      9,
    );
  });

  it('raises the top speed by 20% and keeps the speed-up rate (reading R5), back after 12 s', () => {
    /** Metres walked north in `ticks` ticks from where the Sentinel stands; it then stops. */
    const walked = (scenario: ReturnType<typeof match>, ticks: number): number => {
      const from = scenario.at(scenario.sentinel).y;
      scenario.walk({ x: 0, y: 1 });
      scenario.run(ticks);
      const to = scenario.at(scenario.sentinel).y;
      scenario.stop(scenario.sentinel);
      scenario.run(1);
      return to - from;
    };
    const quick = match({ isQuick: true });
    quick.startBerserk();
    const berserkTop = walked(quick, 30) / 30; // at top speed from its first tick
    quick.run(BERSERK_TICKS);
    const afterTop = walked(quick, 30) / 30;
    const normalQuick = match({ isQuick: true });
    normalQuick.fillMeter();
    const normalTop = walked(normalQuick, 30) / 30;

    const slow = match();
    slow.startBerserk();
    const normalSlow = match();
    normalSlow.fillMeter();

    expect(normalTop).toBeCloseTo(TOP_SPEED, 9);
    expect(berserkTop).toBeCloseTo(TOP_SPEED * 1.2, 9);
    expect(afterTop).toBeCloseTo(TOP_SPEED, 9);
    // From a standstill the shipped Sentinel speeds up 0.18 m/s² either way (sentinel.ts).
    const fromRest = walked(normalSlow, 10);
    expect(fromRest).toBeCloseTo((0.18 / 900) * 55, 12);
    expect(walked(slow, 10)).toBeCloseTo(fromRest, 12);
  });

  it('gives the same hash for the same seed', () => {
    const [first, second] = [match(), match()];
    for (const scenario of [first, second]) {
      scenario.startBerserk();
      scenario.attack(scenario.sentinel, scenario.foe);
      scenario.run(60);
    }

    expect(first.log.filter((line) => line.includes(' cast '))).toHaveLength(1);
    expect(first.radius()).toBeCloseTo(1.25 * 1.3, 12);
    expect(second.sim.hash()).toBe(first.sim.hash());
  });
});

describe('Berserk in a gap narrower than the grown body', () => {
  /** Two rocks 2.6 m apart: the Sentinel (2.5 m wide) fits between them, 3.25 m does not. */
  const rock = (id: string, y: number, height: number): MapObject => ({
    id,
    kind: 'rock',
    isBlocking: true,
    footprints: [
      [
        { x: 109.6, y },
        { x: 113, y },
        { x: 113, y: y + height },
        { x: 109.6, y: y + height },
      ],
    ],
  });
  const ROCKS = [rock('rock-north', 55.3, 1.7), rock('rock-south', 50, 2.7)];
  const overlapsRock = (point: Vec2, radius: number): boolean =>
    ROCKS.some(({ footprints }) =>
      footprints.some((footprint) => doesCircleOverlapPolygon(point, radius, footprint)),
    );

  it('keeps the body small in the gap and grows it once it walked out, every invariant holding', () => {
    const scenario = match({
      world: { map: TWO_LANE_MAP, mapObjects: ROCKS },
      at: { x: 110, y: 54 },
      isQuick: true,
    });

    scenario.startBerserk();
    scenario.run(30);
    const inGap = { radius: scenario.radius(), at: scenario.at(scenario.sentinel) };
    scenario.walk({ x: -1, y: 0 });
    scenario.run(20); // 0.36 m each tick: 7.2 m west
    const outside = scenario.at(scenario.sentinel);

    expect(scenario.log.some((line) => line.endsWith(`berserk on ${scenario.sentinel}`))).toBe(
      true,
    );
    expect(inGap).toEqual({ radius: 1.25, at: { x: 110, y: 54 } });
    expect(outside.x).toBeLessThan(108);
    expect(scenario.radius()).toBeCloseTo(1.625, 12);
    expect(overlapsRock(outside, 1.625)).toBe(false);
  });
});

describe('Berserk beside a wall (the generated map, seed 1)', () => {
  const config = createDefaultGameConfig();
  const map = new MapGenerator().generate(config, 1);
  const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
  const walls = mapObjects.filter(({ isBlocking }) => isBlocking).flatMap((o) => o.footprints);
  const touchesWall = (point: Vec2, radius: number): boolean =>
    walls.some((footprint) => doesCircleOverlapPolygon(point, radius, footprint));
  const tower = map.features.find(({ id }) => id === 'light-spawner-tower-lane-1-0');
  /** The first point west of the tower's centre whose 1.25 m circle is 0.1 m clear of every wall. */
  const besideWall = (): Vec2 => {
    const centre = tower?.position ?? { x: Number.NaN, y: Number.NaN };
    let offset = 0;
    while (touchesWall({ x: centre.x - offset, y: centre.y }, 1.35)) offset += 0.01;
    return { x: centre.x - offset, y: centre.y };
  };

  it('pushes the grown body the shortest way out of the tower wall it stood beside, every invariant holding', () => {
    const spot = besideWall();
    // The Magi 3 m west, away from the tower; the foe 20 m west, clear of it.
    const scenario = match({
      world: { map, mapObjects },
      at: spot,
      foeAt: { x: spot.x - 20, y: spot.y },
    });

    scenario.startBerserk();
    const grown = scenario.at(scenario.sentinel);
    const moved = Math.hypot(grown.x - spot.x, grown.y - spot.y);

    expect(scenario.log.some((line) => line.endsWith(`berserk on ${scenario.sentinel}`))).toBe(
      true,
    );
    expect(scenario.radius()).toBeCloseTo(1.625, 12);
    expect(touchesWall(spot, 1.625)).toBe(true);
    expect(touchesWall(grown, 1.625)).toBe(false);
    expect(grown.x).toBeLessThan(spot.x); // away from the tower
    expect(moved).toBeGreaterThan(0.26); // 1.625 - 1.35 (± the 0.01 search step), the overlap
    expect(moved).toBeLessThan(0.28);
  });
});

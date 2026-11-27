import { describe, expect, it } from 'vitest';

import type { Command } from './commands/Command.types';
import { Footprint } from './components/Footprint';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import type { MapObject } from './content/maps/mapObjects.types';
import { STRUCTURE_DEFINITIONS } from './content/structures/structureCatalogue';
import { NullLogger } from './diagnostics/NullLogger';
import { MapGenerationError } from './map/MapGenerationError';
import { MapGenerator } from './map/MapGenerator';
import { MapObjectBuilder } from './map/MapObjectBuilder';
import { MapPresentationBuilder } from './map/MapPresentationBuilder';
import { Simulation } from './Simulation';
import { AreaHitQuery } from './state/AreaHitQuery';
import type { AreaAim, HitArea } from './state/AreaHitQuery.types';
import type { GameState } from './state/GameState';
import { ReachQuery } from './state/ReachQuery';
import { isPointInAnyPolygon, nearestPointOnPolygons } from './utils/geometry';
import type { Polygon, Rect, Vec2 } from './utils/geometry.types';

/** The match these scenarios play on: seed 1's map, no countdown, no roster. */
const config = createDefaultGameConfig({ match: { countdownSeconds: 0 } });
const map = new MapGenerator().generate(config, 1);
const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
const STRONGHOLD = 'dark-stronghold';
const OUTER_WALL = `${STRONGHOLD}-outer-boundary-0`;
const THRONE = 'dark-palace-interior-throne';
const INNER_WALL = `${STRONGHOLD}-palace-boundary-0`;
const ROOM_WALL = 'dark-palace-interior-council-wall-south';
/** Two Raptor Talons swings (0.7 s apart) and a little more. */
const TWO_SWINGS = 30;
/**
 * Long enough for four Warriors to break a 2,000-health wall: 45 a swing every 0.7 s each
 * (balancing.md), so about 8 s, plus their walk.
 */
const BREAK_TICKS = 12 * config.tickRate;

const objectOf = (id: string): MapObject => {
  const object = mapObjects.find((candidate) => candidate.id === id);
  if (object === undefined) throw new Error(`No map object ${id}`);
  return object;
};

/** The middle of an object's first footprint: a point on it. */
const middleOf = (id: string): Vec2 => {
  const points = objectOf(id).footprints[0] ?? [];
  return {
    x: points.reduce((sum, { x }) => sum + x, 0) / points.length,
    y: points.reduce((sum, { y }) => sum + y, 0) / points.length,
  };
};

/**
 * A spot `metres` east of the east edge of an object's box, level with the middle of its first
 * footprint: the scenarios' spots follow the map's geometry, not fixed coordinates.
 */
const eastOf = (id: string, metres: number): Vec2 => ({
  x:
    Math.max(
      ...objectOf(id)
        .footprints.flat()
        .map(({ x }) => x),
    ) + metres,
  y: middleOf(id).y,
});

/** The palace floor: the footprints of the palace map object, which has its own health. */
const FLOOR = objectOf(STRONGHOLD).footprints;

/** The polygons of the Stronghold's body: its outer walls and its throne (`partOf`). */
const PARTS = mapObjects
  .filter(({ partOf }) => partOf === STRONGHOLD)
  .flatMap(({ footprints }) => footprints);

/** The box round some polygons. */
const boxOf = (polygons: readonly Polygon[]): Rect => {
  const xs = polygons.flat().map(({ x }) => x);
  const ys = polygons.flat().map(({ y }) => y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
};

/** The simulation's state, for the queries a test asks directly. */
const stateOf = (simulation: Simulation): GameState =>
  (simulation as unknown as { readonly state: GameState }).state;

/** A new match on the scenarios' map. */
const start = (): Simulation =>
  new Simulation({ config, seed: 1, logger: new NullLogger(), map, mapObjects });

/**
 * Light Legends of `legend` (a Warrior unless told) spawned at `spots` each get the order
 * `orderFor` gives them, then the match runs `ticks` ticks.
 */
const play = (
  spots: readonly Vec2[],
  orderFor: (actorId: string, simulation: Simulation) => Command,
  ticks: number,
  legend = 'warrior',
): Simulation => {
  const simulation = start();
  for (const at of spots) {
    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: legend,
      definitionId: legend,
      team: 'light',
      at,
      count: 1,
    });
  }
  simulation.step();
  for (const { id, kind } of simulation.snapshot().entities) {
    if (kind === legend) simulation.enqueueCommand(orderFor(id, simulation));
  }
  for (let tick = 0; tick < ticks; tick += 1) simulation.step();
  return simulation;
};

/**
 * An aimed attack (`attack-aim`) with no lock at the middle of `id`: nothing names the Stronghold,
 * so only the object itself makes a hit on it a hit on the Stronghold (DEC-386 (1)).
 */
const aimAt =
  (id: string) =>
  (actorId: string): Command => ({ type: 'attack-aim', actorId, aim: middleOf(id) });

const recordOf = (simulation: Simulation, id: string) =>
  simulation.snapshot().mapObjects?.find((record) => record.id === id);

/** A locked attack on the map object's own entity. */
const lockOn =
  (id: string) =>
  (actorId: string, simulation: Simulation): Command => {
    const targetId = recordOf(simulation, id)?.entityId;
    if (targetId == null) throw new Error(`${id} has no entity`);
    return { type: 'attack-target', actorId, targetId };
  };

const strongholdOf = (simulation: Simulation) => {
  const stronghold = simulation.snapshot().entities.find((e) => e.mapFeatureId === STRONGHOLD);
  if (stronghold?.health === undefined || stronghold.health === null) {
    throw new Error('No Stronghold');
  }
  return { id: stronghold.id, health: stronghold.health };
};

/** Four spots one metre around `at`. */
const around = ({ x, y }: Vec2): readonly Vec2[] => [
  { x, y: y - 1 },
  { x, y: y + 1 },
  { x: x - 1, y },
  { x: x + 1, y },
];

describe('Simulation: the Stronghold outer walls and throne are its body (HC-Q104, DEC-386 (1))', () => {
  it('takes the Stronghold health for a hit on an outer wall, which has no health of its own', () => {
    // East of the wall, outside the palace, aiming west at it.
    const simulation = play([eastOf(OUTER_WALL, 2.5)], aimAt(OUTER_WALL), TWO_SWINGS);
    const { id, health } = strongholdOf(simulation);

    expect(health.current).toBeLessThan(health.max);
    expect(recordOf(simulation, OUTER_WALL)).toEqual({
      id: OUTER_WALL,
      entityId: id,
      health: { current: health.current, max: health.max },
      isDestroyed: false,
    });
  });

  it("takes the Stronghold health for a Magus's bolt aimed at an outer wall, not at the Stronghold", () => {
    // About 10 m east of the wall: the bolt flies west and lands on the wall.
    const simulation = play([eastOf(OUTER_WALL, 9.5)], aimAt(OUTER_WALL), TWO_SWINGS, 'magus');
    const { id, health } = strongholdOf(simulation);

    expect(health.current).toBeLessThan(health.max);
    expect(recordOf(simulation, OUTER_WALL)?.entityId).toBe(id);
  });

  it('takes the Stronghold health for a hit on the throne from inside the palace', () => {
    // On the palace floor east of the throne: the floor is not aimed at from there (rule 1).
    const simulation = play([eastOf(THRONE, 3.2)], aimAt(THRONE), TWO_SWINGS);
    const { id, health } = strongholdOf(simulation);

    expect(health.current).toBeLessThan(health.max);
    expect(recordOf(simulation, THRONE)).toEqual({
      id: THRONE,
      entityId: id,
      health: { current: health.current, max: health.max },
      isDestroyed: false,
    });
  });

  it('takes the Stronghold health for a locked attack from outside, which lands on an outer wall (Q104-4)', () => {
    const lockOnStronghold = (actorId: string, simulation: Simulation): Command => ({
      type: 'attack-target',
      actorId,
      targetId: strongholdOf(simulation).id,
    });
    const at = eastOf(OUTER_WALL, 2.5);
    const simulation = play([at], lockOnStronghold, TWO_SWINGS);
    const { health } = strongholdOf(simulation);
    const legend = simulation.snapshot().entities.find(({ kind }) => kind === 'warrior');

    expect(health.current).toBeLessThan(health.max);
    // It stayed outside the outer ring: it hit the Stronghold at the wall, 60 m from its centre.
    expect(legend?.transform?.x).toBeGreaterThan(boxOf(PARTS).x + boxOf(PARTS).width);
  });

  it.each([
    // In the court between the two rings, west of the outer wall.
    ['an inner-ring wall', INNER_WALL, eastOf(INNER_WALL, 2.7)],
    // Inside the palace, east of the council room.
    ['a room wall', ROOM_WALL, eastOf(ROOM_WALL, 2.5)],
  ])('lowers only the health of %s, which breaks on its own', (_name, wall, at) => {
    const hit = play(around(at), lockOn(wall), TWO_SWINGS);
    const record = recordOf(hit, wall);

    expect(record?.entityId).not.toBe(strongholdOf(hit).id);
    expect(record?.health?.current).toBeLessThan(record?.health?.max ?? 0);
    expect(strongholdOf(hit).health.current).toBe(strongholdOf(hit).health.max);

    const broken = play(around(at), lockOn(wall), BREAK_TICKS);
    expect(recordOf(broken, wall)).toMatchObject({ isDestroyed: true });
    expect(strongholdOf(broken).health.current).toBe(strongholdOf(broken).health.max);
  });

  it('rejects a map object that is part of no structure when the match is built (Q104-13)', () => {
    const stray = mapObjects.map((object) =>
      object.id === ROOM_WALL ? { ...object, partOf: 'no-such-feature' } : object,
    );

    expect(
      () => new Simulation({ config, seed: 1, logger: new NullLogger(), map, mapObjects: stray }),
    ).toThrow(MapGenerationError);
  });

  it('is deterministic: the same seed and commands give the same hash', () => {
    const hashOf = (): number =>
      play([eastOf(OUTER_WALL, 2.5)], aimAt(OUTER_WALL), TWO_SWINGS).hash();

    expect(hashOf()).toBe(hashOf());
  });
});

describe('Simulation: a hit on the palace floor never takes the Stronghold health (DEC-344 (4), Q104-7)', () => {
  it('has its outer walls and throne as its whole outline, and the box round them as its fort box (Q104-3)', () => {
    const simulation = start();
    const stronghold = stateOf(simulation).entities.get(strongholdOf(simulation).id);
    const footprint = stronghold?.findComponent(Footprint);
    const outer = boxOf(PARTS);
    const floor = boxOf(FLOOR);

    expect(footprint?.walkOn).toEqual([]);
    expect(footprint?.polygons).toEqual(PARTS);
    // The fort box of the chase rule (DEC-217 (16)) is the box round its body, as for a tower's
    // fort: the outer ring's box, which holds the palace floor's box.
    expect(STRUCTURE_DEFINITIONS.get(stronghold?.definitionId ?? '').hasFortBox).toBe(true);
    expect(footprint?.bounds).toEqual(outer);
    expect(outer.x).toBeLessThan(floor.x);
    expect(outer.y).toBeLessThan(floor.y);
    expect(outer.x + outer.width).toBeGreaterThan(floor.x + floor.width);
    expect(outer.y + outer.height).toBeGreaterThan(floor.y + floor.height);
  });

  it('puts no point of the palace floor in reach: a locked attack there aims at the throne or an outer wall', () => {
    const simulation = start();
    const onFloor = { x: boxOf(FLOOR).x + 20, y: middleOf(STRONGHOLD).y };
    const aim = { x: 0, y: 0 };
    const id = strongholdOf(simulation).id;

    expect(isPointInAnyPolygon(onFloor, FLOOR)).toBe(true);
    expect(new ReachQuery().aimPointOf(stateOf(simulation).entities, id, onFloor, aim)).toBe(
      'outline',
    );
    expect(nearestPointOnPolygons(aim, PARTS, { x: 0, y: 0 })).toBeCloseTo(0);
  });

  it('gives a hit on the floor from outside to the palace object, aimed at the floor or locked on the Stronghold', () => {
    const simulation = start();
    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: 'warrior',
      definitionId: 'warrior',
      team: 'light',
      at: eastOf(INNER_WALL, 2.7),
      count: 1,
    });
    simulation.step();
    const { entities } = stateOf(simulation);
    const legend = simulation.snapshot().entities.find(({ kind }) => kind === 'warrior')?.id ?? '';
    const stronghold = strongholdOf(simulation).id;
    const palace = recordOf(simulation, STRONGHOLD)?.entityId;
    const onFloor = middleOf(STRONGHOLD);
    const floorOnly: HitArea = {
      overlapsBody: () => false,
      overlapsOutline: (polygon) => FLOOR.includes(polygon),
    };
    const query = new AreaHitQuery();
    const hits = (aim: AreaAim) =>
      query.find(entities, legend, floorOnly, aim, { team: 'enemies' });

    expect(palace).toBeDefined();
    expect(palace).not.toBe(stronghold);
    expect(query.aimedBodyOf(entities, legend, onFloor)).toBe(palace);
    expect(hits({ targetId: null, point: onFloor })).toEqual([palace]);
    expect(hits({ targetId: stronghold, point: null })).toEqual([]);
  });
});

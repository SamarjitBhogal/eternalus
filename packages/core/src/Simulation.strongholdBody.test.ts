import { describe, expect, it } from 'vitest';

import type { Command } from './commands/Command.types';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import type { MapObject } from './content/maps/mapObjects.types';
import { NullLogger } from './diagnostics/NullLogger';
import { MapGenerator } from './map/MapGenerator';
import { MapObjectBuilder } from './map/MapObjectBuilder';
import { MapPresentationBuilder } from './map/MapPresentationBuilder';
import { Simulation } from './Simulation';
import type { Vec2 } from './utils/geometry.types';

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
 * Light Legends of `legend` (a Warrior unless told) spawned at `spots` each get the order
 * `orderFor` gives them, then the match runs `ticks` ticks.
 */
const play = (
  spots: readonly Vec2[],
  orderFor: (actorId: string, simulation: Simulation) => Command,
  ticks: number,
  legend = 'warrior',
): Simulation => {
  const simulation = new Simulation({ config, seed: 1, logger: new NullLogger(), map, mapObjects });
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
 * so only the object itself makes a hit on it a hit on the Stronghold (DEC-373 (1)).
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

describe('Simulation: the Stronghold outer walls and throne are its body (HC-Q104, DEC-373 (1))', () => {
  it('takes the Stronghold health for a hit on an outer wall, which has no health of its own', () => {
    // East of the wall, outside the palace, aiming west at it.
    const simulation = play([{ x: 1537, y: 453.5 }], aimAt(OUTER_WALL), TWO_SWINGS);
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
    // 10 m east of the wall: the bolt flies west and lands on the wall.
    const simulation = play([{ x: 1544, y: 453.5 }], aimAt(OUTER_WALL), TWO_SWINGS, 'magus');
    const { id, health } = strongholdOf(simulation);

    expect(health.current).toBeLessThan(health.max);
    expect(recordOf(simulation, OUTER_WALL)?.entityId).toBe(id);
  });

  it('takes the Stronghold health for a hit on the throne from inside the palace', () => {
    // On the palace floor east of the throne: the floor is not aimed at from there (rule 1).
    const simulation = play([{ x: 1515.5, y: 450 }], aimAt(THRONE), TWO_SWINGS);
    const { id, health } = strongholdOf(simulation);

    expect(health.current).toBeLessThan(health.max);
    expect(recordOf(simulation, THRONE)).toEqual({
      id: THRONE,
      entityId: id,
      health: { current: health.current, max: health.max },
      isDestroyed: false,
    });
  });

  it.each([
    // In the court between the two rings, west of the outer wall.
    ['an inner-ring wall', INNER_WALL, { x: 1525.5, y: 453 }],
    // Inside the palace, east of the council room.
    ['a room wall', ROOM_WALL, { x: 1484, y: 416 }],
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

  it('is deterministic: the same seed and commands give the same hash', () => {
    const hashOf = (): number =>
      play([{ x: 1537, y: 453.5 }], aimAt(OUTER_WALL), TWO_SWINGS).hash();

    expect(hashOf()).toBe(hashOf());
  });
});

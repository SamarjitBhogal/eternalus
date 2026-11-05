import { describe, expect, it } from 'vitest';

import { Deploying } from './components/Deploying';
import { Footprint } from './components/Footprint';
import { createDefaultGameConfig } from './config/defaultGameConfig';
import { DEFAULT_MAP_LAYOUT } from './content/maps/defaultMapLayout';
import type { MapObject } from './content/maps/mapObjects.types';
import type { MapDefinition, MapFeature } from './content/maps/maps.types';
import { SPAWN_WAVES } from './content/structures/spawnWaves';
import { TEST_DEBUG_CONFIG } from './diagnostics/InvariantRunner.constants';
import { NullLogger } from './diagnostics/NullLogger';
import { MapGenerator } from './map/MapGenerator';
import { MapObjectBuilder } from './map/MapObjectBuilder';
import { MapPresentationBuilder } from './map/MapPresentationBuilder';
import { DamagePipeline } from './combat/DamagePipeline';
import { Simulation } from './Simulation';
import type { RosterSlot } from './Simulation.types';
import type { GameState } from './state/GameState';
import { LaneRoutes } from './state/LaneRoutes';
import type { PlayableTeam } from './teams/teams.types';
import { isPointInPolygon } from './utils/geometry';
import type { Vec2 } from './utils/geometry.types';

/** Both teams' bots as the client composes them: laners plus a Rover that starts in its palace. */
const roster = (legendsPerTeam: number): RosterSlot[] =>
  (['light', 'dark'] as const).flatMap((team) => [
    ...Array.from({ length: legendsPerTeam - 1 }, () => ({
      team,
      definitionId: 'warrior',
      role: 'laner' as const,
      difficulty: 'normal',
    })),
    { team, definitionId: 'warrior', role: 'rover' as const, difficulty: 'rover' },
  ]);

/** A team's lane tower: a SpawnerTower or BuffTower on its own lane. */
type LaneTower = MapFeature & {
  readonly kind: 'spawner-tower' | 'buff-tower';
  readonly team: PlayableTeam;
  readonly laneId: string;
};

const laneTowers = (map: MapDefinition): LaneTower[] =>
  map.features.filter(
    (feature): feature is LaneTower =>
      (feature.kind === 'spawner-tower' || feature.kind === 'buff-tower') &&
      feature.team !== 'neutral' &&
      feature.laneId !== undefined,
  );

/** A tower's walls, as the box around its collider polygons: its hollow core and doorways. */
const wallBox = (mapObjects: readonly MapObject[], id: string) => {
  const points = mapObjects.find((object) => object.id === id)?.footprints.flat() ?? [];
  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  return {
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
    bottom: Math.max(...ys),
  };
};

/** The unit direction the tower's team marches its lane at the tower. */
const marchDirection = (routes: LaneRoutes, { laneId, team, position }: LaneTower): Vec2 => {
  const forward = { x: 0, y: 0 };
  routes.pose(laneId, team, routes.distanceAlong(laneId, team, position), { x: 0, y: 0 }, forward);
  return forward;
};

describe('Simulation with a roster and map objects (as the client builds a match)', () => {
  it.each([1, 2])(
    'every bot Legend leaves its Stronghold wall ring within 30 seconds (seed %i)',
    (seed) => {
      const config = createDefaultGameConfig();
      const map = new MapGenerator().generate(config, seed);
      const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
      const simulation = new Simulation({
        config,
        seed,
        logger: new NullLogger(),
        map,
        mapObjects,
        roster: roster(config.match.legendsPerTeam),
      });
      const strongholds = new Map(
        map.features
          .filter(({ kind }) => kind === 'stronghold')
          .map(({ team, position }) => [team, position]),
      );
      for (let tick = 0; tick < 30 * config.tickRate; tick += 1) {
        simulation.step();
      }

      const legends = simulation.snapshot().entities.filter(({ kind }) => kind === 'warrior');
      expect(legends).toHaveLength(2 * config.match.legendsPerTeam);
      const stillHome = legends.filter(({ team, transform }) => {
        const home = strongholds.get(team ?? 'neutral');
        const at = transform ?? { x: 0, y: 0 };
        return (
          home === undefined ||
          Math.hypot(at.x - home.x, at.y - home.y) <= DEFAULT_MAP_LAYOUT.wallRing.radius
        );
      });
      expect(stillHome).toEqual([]);
    },
  );

  // Seed 10 sets a buff tower's march direction diagonal beside a lake (critic round 3, M-A).
  it.each([1, 2, 10])(
    'walks every tower horde out of its tower and on up its lane within 10 seconds (DEC-133, seed %i)',
    (seed) => {
      const config = createDefaultGameConfig();
      const map = new MapGenerator().generate(config, seed);
      const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
      const simulation = new Simulation({
        config,
        seed,
        logger: new NullLogger(),
        map,
        mapObjects,
        roster: roster(config.match.legendsPerTeam),
      });
      const routes = new LaneRoutes(map);
      const towers = laneTowers(map);
      // The opening hordes leave at tick 0; every horde after it is one tower's.
      simulation.step();
      const sent: { readonly tower: LaneTower; readonly memberIds: readonly string[] }[] = [];
      simulation.on('horde-spawned', ({ memberIds }) => {
        const tower = towers[sent.length];
        if (tower !== undefined) sent.push({ tower, memberIds });
      });
      for (const tower of towers) {
        const [wave] = SPAWN_WAVES[tower.kind] ?? [];
        simulation.enqueueCommand({
          type: 'dev-spawn-mobs',
          team: tower.team,
          definitionId: wave?.mobId ?? '',
          count: config.match.hordeSizes[wave?.weightClass ?? 'light'],
          origin: { kind: 'structure', structureId: tower.id },
        });
      }
      for (let tick = 0; tick < 10 * config.tickRate; tick += 1) {
        simulation.step();
      }

      const { entities, world } = (simulation as unknown as { readonly state: GameState }).state;
      const stillDeploying = sent.flatMap(({ memberIds }) =>
        memberIds.filter((id) => entities.get(id)?.hasComponent(Deploying) === true),
      );
      const at = new Map(
        simulation.snapshot().entities.map(({ id, transform }) => [id, transform]),
      );
      const notOut = sent.flatMap(({ tower, memberIds }) => {
        const { left, right, top, bottom } = wallBox(mapObjects, tower.id);
        const forward = marchDirection(routes, tower);
        return memberIds.flatMap((id) => {
          const { x, y } = at.get(id) ?? tower.position;
          const isInside = x > left && x < right && y > top && y < bottom;
          const ahead = (x - tower.position.x) * forward.x + (y - tower.position.y) * forward.y;
          return isInside || ahead <= 0 || world?.grid.isWalkableAt(x, y) !== true
            ? [`${id} of ${tower.id} at ${x.toFixed(0)},${y.toFixed(0)}`]
            : [];
        });
      });
      expect(sent).toHaveLength(towers.length);
      expect(stillDeploying).toEqual([]);
      expect(notOut).toEqual([]);
    },
  );

  it("gives each lane tower its fort's footprint as its Footprint, the Stronghold its palace outline, and a gate its own outline (DEC-185, D; DEC-217 (17))", () => {
    const config = createDefaultGameConfig();
    const map = new MapGenerator().generate(config, 1);
    const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
    const simulation = new Simulation({
      config,
      seed: 1,
      logger: new NullLogger(),
      map,
      mapObjects,
    });
    const { entities } = (simulation as unknown as { readonly state: GameState }).state;
    const shapes = new Map<string, number>();
    entities.forEach((entity) => {
      if (entity.family === 'structure') {
        const polygons = entity.findComponent(Footprint)?.polygons.length ?? 0;
        shapes.set(entity.kind, Math.max(shapes.get(entity.kind) ?? 0, polygons));
      }
    });

    // A fort is 12 blocks: 4 walls cut by doorways into 7 wall objects, then the tower's own
    // object: 4 corner towers and the keep (DEC-217 (12)).
    const tower = mapObjects.find(({ kind }) => kind === 'spawner-tower');
    const fort = mapObjects
      .filter(({ id, partOf }) => id === tower?.id || partOf === tower?.id)
      .flatMap(({ footprints }) => footprints).length;
    expect(fort).toBe(12);
    expect(shapes.get('spawner-tower')).toBe(fort);
    expect(shapes.get('buff-tower')).toBe(fort);
    expect(shapes.get('stronghold')).toBe(
      mapObjects.find(({ kind }) => kind === 'stronghold')?.footprints.length,
    );
    expect(shapes.get('stronghold')).toBeGreaterThan(0);
    expect(shapes.get('gate')).toBe(
      mapObjects.find(({ kind }) => kind === 'gate')?.footprints.length,
    );
    expect(shapes.get('gate')).toBeGreaterThan(0);
  });

  it('puts a melee Legend at the far end of a gate in reach of the gate, past its 3 m circle (DEC-217 (17))', () => {
    const config = createDefaultGameConfig();
    const map = new MapGenerator().generate(config, 1);
    const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
    const simulation = new Simulation({
      config,
      seed: 1,
      logger: new NullLogger(),
      map,
      mapObjects,
    });
    const gate = map.features.find(({ kind, team }) => kind === 'gate' && team === 'light');
    const centre = gate?.position ?? { x: 0, y: 0 };
    const outline = mapObjects.find(({ id }) => id === gate?.id)?.footprints[0] ?? [];
    const gap = ({ x, y }: Vec2): number => Math.hypot(x - centre.x, y - centre.y);
    // The legend stands on the gate's corner farthest from its centre.
    const at = outline.reduce((far, point) => (gap(point) > gap(far) ? point : far));
    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: 'warrior',
      definitionId: 'warrior',
      team: 'dark',
      at,
      count: 1,
    });
    simulation.step();
    const { entities } = (simulation as unknown as { readonly state: GameState }).state;
    const ids = simulation.snapshot().entities;
    const legend = ids.find(({ definitionId }) => definitionId === 'warrior');
    const structure = ids.find(
      ({ kind, transform }) =>
        kind === 'gate' && transform?.x === centre.x && transform.y === centre.y,
    );
    const legendAt = legend?.transform ?? { x: 0, y: 0 };

    expect(structure).toBeDefined();
    expect(gap(legendAt)).toBeGreaterThan((structure?.transform?.radius ?? 0) + 5);
    expect(entities.isInReach(legend?.id ?? '', structure?.id ?? '')).toBe(true);
  });

  it('puts a melee Legend at the outside of the palace wall in reach of its Stronghold, past its 40 m circle (DEC-185 D)', () => {
    const config = createDefaultGameConfig();
    const map = new MapGenerator().generate(config, 1);
    const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
    const simulation = new Simulation({
      config,
      seed: 1,
      logger: new NullLogger(),
      map,
      mapObjects,
    });
    const centre = map.features.find(
      ({ kind, team }) => kind === 'stronghold' && team === 'light',
    )?.position;
    const outline = mapObjects.find(({ id }) => id === 'light-stronghold')?.footprints[0] ?? [];
    // The palace corner farthest from the centre, and a point 0.6 m out from it.
    const gap = ({ x, y }: Vec2): number => Math.hypot(x - (centre?.x ?? 0), y - (centre?.y ?? 0));
    const corner = outline.reduce((far, point) => (gap(point) > gap(far) ? point : far));
    const out = 0.6 / gap(corner);
    const at = {
      x: corner.x + (corner.x - (centre?.x ?? 0)) * out,
      y: corner.y + (corner.y - (centre?.y ?? 0)) * out,
    };
    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: 'warrior',
      definitionId: 'warrior',
      team: 'dark',
      at,
      count: 1,
    });
    simulation.step();
    const { entities } = (simulation as unknown as { readonly state: GameState }).state;
    const ids = simulation.snapshot().entities;
    const legend = ids.find(({ definitionId }) => definitionId === 'warrior')?.id ?? '';
    const stronghold = ids.find(({ kind, team }) => kind === 'stronghold' && team === 'light');

    expect(gap(at)).toBeGreaterThan((stronghold?.transform?.radius ?? 0) + 5);
    expect(entities.isInReach(legend, stronghold?.id ?? '')).toBe(true);
  });

  it("makes each lane tower's fort map object the tower's body: one health pool, no entity of its own (DEC-185 B)", () => {
    const config = createDefaultGameConfig();
    const map = new MapGenerator().generate(config, 1);
    const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
    const simulation = new Simulation({
      config,
      seed: 1,
      logger: new NullLogger(),
      map,
      mapObjects,
    });
    const snapshot = simulation.snapshot();
    const towers = laneTowers(map);
    const bodies = towers.map(({ id, position }) => {
      const tower = snapshot.entities.find(
        ({ family, transform }) =>
          family === 'structure' && transform?.x === position.x && transform.y === position.y,
      );
      const fort = snapshot.mapObjects?.find((object) => object.id === id);
      return { tower: tower?.id, health: tower?.health, fort };
    });

    expect(towers.length).toBeGreaterThan(0);
    for (const { tower, health, fort } of bodies) {
      expect(tower).toBeDefined();
      expect(fort).toMatchObject({ entityId: tower, isDestroyed: false });
      expect(fort?.health).toEqual({ current: health?.current, max: health?.max });
    }
    expect(
      snapshot.entities.filter(({ definitionId }) =>
        ['map-object-spawner-tower', 'map-object-buff-tower'].includes(definitionId),
      ),
    ).toEqual([]);
  });

  it("turns a dead tower's fort into ruins: the wall that took the killing hit falls and opens its cells, the others keep theirs blocked at half health (DEC-217 (12), DEC-219 (a))", () => {
    const config = createDefaultGameConfig();
    const map = new MapGenerator().generate(config, 1);
    const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
    const simulation = new Simulation({
      config,
      seed: 1,
      logger: new NullLogger(),
      map,
      mapObjects,
    });
    const { state } = simulation as unknown as { readonly state: GameState };
    const tower = laneTowers(map).find(({ team }) => team === 'light');
    const id = tower?.id ?? '';
    const centre = tower?.position ?? { x: 0, y: 0 };
    const middle = (objectId: string): Vec2 => {
      const points = mapObjects.find((object) => object.id === objectId)?.footprints[0] ?? [];
      return {
        x: points.reduce((sum, { x }) => sum + x, 0) / points.length,
        y: points.reduce((sum, { y }) => sum + y, 0) / points.length,
      };
    };
    const grid = state.world?.grid;
    const top = middle(`${id}-fort-wall-top`);
    const standing = [
      `${id}-fort-wall-left`,
      `${id}-fort-wall-right-lower`,
      `${id}-fort-wall-bottom-left`,
    ];
    simulation.enqueueCommand({
      type: 'dev-spawn',
      kind: 'warrior',
      definitionId: 'warrior',
      team: 'dark',
      at: { x: centre.x, y: top.y - 3 },
      count: 1,
    });
    simulation.step();
    const towerId =
      simulation
        .snapshot()
        .entities.find(
          ({ family, transform }) =>
            family === 'structure' && transform?.x === centre.x && transform.y === centre.y,
        )?.id ?? '';
    const warrior =
      simulation.snapshot().entities.find(({ definitionId }) => definitionId === 'warrior')?.id ??
      null;
    // The warrior stands north of the top wall, nearer it than any other part of the fort.
    expect(top.y).toBeLessThan(centre.y);
    expect(grid?.isWalkableAt(top.x, top.y)).toBe(false);
    expect(grid?.isWalkableAt(centre.x, centre.y)).toBe(false);

    new DamagePipeline().apply(state, towerId, 1_000_000, {
      attackerId: warrior,
      kind: 'weapon',
      definitionId: 'warrior',
    });
    simulation.step();

    const objects = new Map(simulation.snapshot().mapObjects?.map((object) => [object.id, object]));
    expect(state.entities.has(towerId)).toBe(false);
    // The wall the warrior hit falls with the tower, and so does the keep: their ground opens.
    expect(objects.get(`${id}-fort-wall-top`)?.isDestroyed).toBe(true);
    expect(objects.get(id)?.isDestroyed).toBe(true);
    expect(grid?.isWalkableAt(top.x, top.y)).toBe(true);
    expect(grid?.isWalkableAt(centre.x, centre.y)).toBe(true);
    expect(state.worldObjects?.blockingAt(top, 0.5)).toBeNull();
    // Every other wall stands, blocks the grid and collision, and has half a wall's health.
    for (const wall of standing) {
      const at = middle(wall);
      expect(objects.get(wall)).toMatchObject({
        isDestroyed: false,
        health: { current: 1000, max: 1000 },
      });
      expect(grid?.isWalkableAt(at.x, at.y)).toBe(false);
      expect(state.worldObjects?.blockingAt(at, 0.5)).toBe(wall);
    }
  });

  it('lets a light horde sent at an enemy spawner tower on the generated map hit it within a minute (DEC-185, playtest 2026-11-04)', () => {
    const config = createDefaultGameConfig();
    const map = new MapGenerator().generate(config, 1);
    const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
    const simulation = new Simulation({
      config,
      seed: 1,
      logger: new NullLogger(),
      // Every invariant, the heavy ones once a second, so the minute stays quick on CI.
      debug: { ...TEST_DEBUG_CONFIG, heavyEvery: config.tickRate },
      map,
      mapObjects,
    });
    const routes = new LaneRoutes(map);
    const tower = laneTowers(map).find(
      ({ kind, team, laneId }) =>
        kind === 'spawner-tower' && team === 'dark' && laneId === 'lane-1',
    );
    const lane = tower?.laneId ?? 'lane-1';
    const at = routes.distanceAlong(lane, 'light', tower?.position ?? { x: 0, y: 0 });
    const towerId =
      simulation
        .snapshot()
        .entities.find(
          ({ kind, transform }) =>
            kind === 'spawner-tower' &&
            transform?.x === tower?.position.x &&
            transform?.y === tower?.position.y,
        )?.id ?? '';
    const minions = new Set<string>();
    simulation.on('entity-spawned', ({ entityId, kind }) => {
      if (kind === 'light-mob') minions.add(entityId);
    });
    let hits = 0;
    simulation.on('damage-applied', ({ targetId, source }) => {
      if (targetId === towerId && minions.has(source.attackerId ?? '')) hits += 1;
    });
    // 40 m up-lane of the tower, past its guards' posts.
    simulation.enqueueCommand({
      type: 'dev-spawn-mobs',
      team: 'light',
      definitionId: 'light-minion',
      count: config.match.hordeSizes.light,
      origin: { kind: 'lane', lane, t: (at - 40) / routes.length(lane) },
    });
    for (let tick = 0; tick < 60 * config.tickRate && hits === 0; tick += 1) {
      simulation.step();
    }

    expect(towerId).not.toBe('');
    expect(hits).toBeGreaterThan(0);
  });

  it('blocks the walking grid under a blocking map object no map feature stands under (07 §10)', () => {
    const config = createDefaultGameConfig();
    const map = new MapGenerator().generate(config, 1);
    const path = map.lanes[0]?.path ?? [];
    const at = path[Math.floor(path.length / 2)] ?? { x: 0, y: 0 };
    const house: MapObject = {
      id: 'house',
      kind: 'house',
      isBlocking: true,
      footprints: [
        [-1, 1, 1, -1].map((dx, corner) => ({
          x: at.x + 5 * dx,
          y: at.y + 5 * (corner < 2 ? -1 : 1),
        })),
      ],
    };
    const isWalkableAt = (mapObjects: readonly MapObject[]): boolean => {
      const simulation = new Simulation({
        config,
        seed: 1,
        logger: new NullLogger(),
        map,
        mapObjects,
      });
      // The grid is internal and no snapshot carries it, so this reads it directly.
      const grid = (simulation as unknown as { readonly state: GameState }).state.world?.grid;
      const cell = grid?.cellAt(at) ?? null;
      return cell !== null && grid?.isWalkable(cell.col, cell.row) === true;
    };

    expect(isWalkableAt([])).toBe(true);
    expect(isWalkableAt([house])).toBe(false);
  });

  it('opens every tower toward where its hordes march: a doorway in its up-lane wall (DEC-133)', () => {
    const config = createDefaultGameConfig();
    const map = new MapGenerator().generate(config, 1);
    const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
    const routes = new LaneRoutes(map);
    const towers = laneTowers(map);

    // The line from the tower's centre to its up-lane wall, snapped to the fort's axes, from past
    // the keep to past the outer wall, crosses no wall.
    const walled = towers.filter((tower) => {
      const { left, right } = wallBox(mapObjects, tower.id);
      const forward = marchDirection(routes, tower);
      const isAlongX = Math.abs(forward.x) >= Math.abs(forward.y);
      const ax = isAlongX ? Math.sign(forward.x) : 0;
      const ay = isAlongX ? 0 : Math.sign(forward.y);
      const half = (right - left) / 2;
      const footprints = mapObjects.find(({ id }) => id === tower.id)?.footprints ?? [];
      return Array.from({ length: 21 }, (_, step) => half * (0.6 + step * 0.03)).some((along) =>
        footprints.some((footprint) =>
          isPointInPolygon(
            { x: tower.position.x + ax * along, y: tower.position.y + ay * along },
            footprint,
          ),
        ),
      );
    });
    expect(towers).toHaveLength(4 * config.map.numLanes);
    expect(walled.map(({ id }) => id)).toEqual([]);
  });

  it('lets only the other side attack what a side built; scenery takes attacks from both (DEC-121 (a))', () => {
    const config = createDefaultGameConfig();
    const map = new MapGenerator().generate(config, 1);
    const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
    const simulation = new Simulation({
      config,
      seed: 1,
      logger: new NullLogger(),
      map,
      mapObjects,
    });
    for (const team of ['light', 'dark'] as const) {
      simulation.enqueueCommand({
        type: 'dev-spawn',
        kind: 'warrior',
        definitionId: 'warrior',
        team,
        at: { x: 400, y: 450 },
        count: 1,
      });
    }
    simulation.step();
    const { entities, mapObjects: objects = [] } = simulation.snapshot();
    const warrior = (team: string) => entities.find((e) => e.kind === 'warrior' && e.team === team);
    const entityOf = (id: string) => objects.find((o) => o.id === id)?.entityId ?? '';
    const lightPalaceWall = mapObjects.find(
      (o) => o.buildingId === 'light-stronghold' && o.kind === 'wall',
    );
    const tree = mapObjects.find((o) => o.kind === 'tree');
    const rejected: string[] = [];
    simulation.on('command-rejected', ({ command, reason }) => {
      rejected.push(`${'targetId' in command ? String(command.targetId) : ''}:${reason}`);
    });
    const targets = [
      entityOf('light-stronghold'),
      entityOf(lightPalaceWall?.id ?? ''),
      entityOf(tree?.id ?? ''),
    ];
    for (const actor of [warrior('light'), warrior('dark')]) {
      for (const targetId of targets) {
        simulation.enqueueCommand({ type: 'attack-target', actorId: actor?.id ?? '', targetId });
      }
    }
    simulation.step();

    expect(targets.every((id) => id.startsWith('entity-'))).toBe(true);
    expect(rejected).toEqual([
      `${targets[0] ?? ''}:invalid-target`,
      `${targets[1] ?? ''}:invalid-target`,
    ]);
  });

  // Fort walls reach past a tower's collider, so the plain guard ring lands in them (seeds 1, 2:
  // 35 guards); one spawner-tower post per team is blocked straight out to past its leash.
  it.each([1, 2])(
    'stands every tower guard clear of map objects and inside its leash (seed %i)',
    (seed) => {
      const config = createDefaultGameConfig();
      const map = new MapGenerator().generate(config, seed);
      const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
      const simulation = new Simulation({
        config,
        seed,
        logger: new NullLogger(),
        map,
        mapObjects,
        debug: TEST_DEBUG_CONFIG,
      });

      // Every invariant, every tick, throwing: `no-map-object-overlap` and `guard-within-leash`.
      expect(() => {
        for (let tick = 0; tick < 2; tick += 1) {
          simulation.step();
        }
      }).not.toThrow();
      const guards = simulation
        .snapshot()
        .entities.filter(({ definitionId }) => definitionId.endsWith('-guard'));
      expect(guards.length).toBeGreaterThan(0);
    },
  );

  // A camp's fire blocks its posts and, on the coarse nav grid, its whole leash (seed 1: two
  // mirrored camps); the camp mobs must still stand clear of it.
  it.each([1, 2])(
    'stands every camp mob clear of map objects once camps fill (seed %i)',
    (seed) => {
      const config = createDefaultGameConfig({ match: { countdownSeconds: 1 } });
      const map = new MapGenerator().generate(config, seed);
      const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
      const simulation = new Simulation({
        config,
        seed,
        logger: new NullLogger(),
        map,
        mapObjects,
        debug: TEST_DEBUG_CONFIG,
      });

      expect(() => {
        for (let tick = 0; tick < config.tickRate + 3; tick += 1) {
          simulation.step();
        }
      }).not.toThrow();
      const campMobs = simulation
        .snapshot()
        .entities.filter(({ definitionId }) => definitionId.endsWith('-camp-mob'));
      expect(campMobs.length).toBeGreaterThan(0);
    },
  );
});

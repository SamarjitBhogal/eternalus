import { describe, expect, it } from 'vitest';

import { Deploying } from './components/Deploying';
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
});

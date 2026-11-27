import { describe, expect, it } from 'vitest';
import { STRUCTURE_DEFINITIONS } from './content/structures/structureCatalogue';
import { WALL_TURRET } from './content/ai/turret';
import { MapGenerator } from './map/MapGenerator';
import { MapObjectBuilder } from './map/MapObjectBuilder';
import { MapPresentationBuilder } from './map/MapPresentationBuilder';
import { Health } from './components/Health';
import { isPointInAnyPolygon, isPointInBlockingArea } from './utils/geometry';
import { doesCircleOverlapPolygon } from './utils/circlePolygon';
import { TeamMembership } from './components/TeamMembership';
import { Transform } from './components/Transform';
import { ProjectilePayload } from './components/ProjectilePayload';
import { Turret } from './entities/structures/Turret';
import { AreaHitQuery } from './state/AreaHitQuery';
import { TURRET_BOLT } from './content/projectiles/turretBolt';
import {
  config,
  TURRET_FEATURES,
  setUp,
  outside,
  LIGHT_TURRET,
  COUNTDOWN,
  spawnDark,
} from './__fixtures__/turretMatch';

describe('Simulation wall turrets: launch shape (DEC-334)', () => {
  /** The match's hit rule for areas; stateless, so a new one reads as the match's does. */
  const areas = new AreaHitQuery();

  it.each([1, 2, 3, 4, 5, 6, 7, 8])(
    'launches each bolt inside no body outline that would stop it, so the body stop needs no launch rule (seed %i)',
    (seed) => {
      const map = new MapGenerator().generate(config, seed);
      const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
      const { state, run } = setUp({ seed, map, mapObjects });
      run(1);
      const turretIds: string[] = [];
      state.entities.forEach((entity) => {
        if (entity instanceof Turret) turretIds.push(entity.id);
      });
      expect(turretIds).toHaveLength(map.features.filter(({ kind }) => kind === 'turret').length);
      expect(turretIds.length).toBeGreaterThan(0);

      for (const turretId of turretIds) {
        const team = state.entities.teamOf(turretId);
        const launch = state.entities.placeOf(turretId)?.position;
        if (team === undefined || launch === undefined) throw new Error('A turret has no place.');
        state.entities.forEach((entity) => {
          const outline = state.entities.outlineOf(entity.id);
          const health = entity.findComponent(Health);
          if (outline === undefined || health === undefined) return;
          if (!isPointInAnyPolygon(launch, outline.polygons)) return;
          const body = {
            entity,
            health,
            membership: entity.findComponent(TeamMembership),
            outline,
          };
          expect(
            areas.stopsShot(
              state.entities,
              { ownerId: turretId, team, targetId: null },
              body,
            ),
          ).toBe(false);
        });
      }
    },
  );

  it('fires along its wall at each neighbour turret over its range: the bolt leaves its pylon, though it starts on the joint of two wall pieces (DEC-334)', () => {
    const { state } = setUp();
    const pylonRadius = STRUCTURE_DEFINITIONS.get('turret').footprintRadius;
    const byId = new Map(TURRET_FEATURES.map((turret) => [turret.id, turret]));
    const stopped: string[] = [];

    for (const { id, team, position } of TURRET_FEATURES) {
      const index = Number(id.slice(id.lastIndexOf('-') + 1));
      for (const step of [-1, 1]) {
        const neighbour = byId.get(`${team}-turret-${String(index + step)}`)?.position;
        if (neighbour === undefined) continue;
        const length = Math.hypot(neighbour.x - position.x, neighbour.y - position.y);
        const direction = {
          x: (neighbour.x - position.x) / length,
          y: (neighbour.y - position.y) / length,
        };
        const reach =
          state.collisions?.reach(
            position,
            direction,
            WALL_TURRET.range,
            TURRET_BOLT.footprintRadius,
            position,
          ) ?? 0;
        if (reach <= pylonRadius)
          stopped.push(`${id} -> ${String(index + step)}: ${reach.toFixed(2)}`);
      }
    }

    expect(TURRET_FEATURES.length).toBeGreaterThan(0);
    expect(stopped).toEqual([]);
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8])(
    'launches each bolt where every wall, gate and pylon it touches holds its centre, so none of them stops it at launch (DEC-334, seed %i)',
    (seed) => {
      const map = new MapGenerator().generate(config, seed);
      const mapObjects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
      const shieldKinds: readonly string[] = ['wall', 'gate', 'turret'];
      const radius = TURRET_BOLT.footprintRadius;
      let touched = 0;
      const notHeld = map.features
        .filter(({ kind }) => kind === 'turret')
        .flatMap(({ id, position }) =>
          mapObjects.flatMap((object) => {
            if (!object.isBlocking || !shieldKinds.includes(object.kind)) return [];
            const shapes = object.footprints.filter((shape) =>
              doesCircleOverlapPolygon(position, radius, shape),
            );
            touched += shapes.length;
            return shapes.some((shape) => !isPointInBlockingArea(position, shape, object.passages))
              ? [`${id}: ${object.id}`]
              : [];
          }),
        );

      // Each bolt touches at least its own pylon and the wall piece under it.
      expect(touched).toBeGreaterThan(map.features.filter(({ kind }) => kind === 'turret').length);
      expect(notHeld).toEqual([]);
    },
  );

  it('lets a bolt that starts on the joint of a wall segment and a gate leave its pylon, and the map object check passes it (light-turret-1, seed 1)', () => {
    const match = setUp();
    const { state, run, turretOf, logger } = match;
    const feature = TURRET_FEATURES.find(({ id }) => id === 'light-turret-1');
    if (feature === undefined || LIGHT_TURRET === undefined)
      throw new Error('The generated map has no light-turret-1.');
    const turretId = turretOf(feature)?.id ?? '';
    // 90 degrees off light-turret-0's outward line: light-turret-1 fires at it along its wall.
    spawnDark(match, 'light-mob', 'training-dummy', outside(LIGHT_TURRET, 4, 90));
    let boltId = '';
    state.events.on('entity-spawned', ({ entityId, kind }) => {
      const owner = state.entities.get(entityId)?.findComponent(ProjectilePayload)?.ownerId;
      if (kind === 'projectile' && boltId === '' && owner === turretId) boltId = entityId;
    });
    let farthest = 0;

    // The invariants run every tick and throw on a violation (TEST_DEBUG_CONFIG).
    for (let tick = 0; tick < COUNTDOWN + 30; tick += 1) {
      run(1);
      const at = state.entities.get(boltId)?.findComponent(Transform)?.position;
      if (at !== undefined)
        farthest = Math.max(
          farthest,
          Math.hypot(at.x - feature.position.x, at.y - feature.position.y),
        );
    }

    expect(boltId).not.toBe('');
    expect(farthest).toBeGreaterThan(STRUCTURE_DEFINITIONS.get('turret').footprintRadius);
    expect(logger.records.filter(({ severityText }) => severityText !== 'INFO')).toEqual([]);
  });
});

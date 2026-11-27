import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { MapDecoration, MapDefinition } from '../content/maps/maps.types';
import { MapGenerator } from './MapGenerator';
import { BUILDING_GEOMETRY as G } from '../content/maps/buildingGeometry';
import { DEFAULT_MAP_LAYOUT } from '../content/maps/defaultMapLayout';
import { MapSceneryBuilder } from './MapSceneryBuilder';
import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import { boundsOf, doesPolygonOverlapRect, doPolygonsOverlap } from '../utils/geometry';
import { isInLaneFortKeepOut, laneFortKeepOuts } from './fortInWorld';
import { WALL_RING_KINDS } from './MapSceneryBuilder.constants';
import { MapObjectBuilder } from './MapObjectBuilder';
import { MapPresentationBuilder } from './MapPresentationBuilder';
import { CAMP_ART, campHalfExtent, isCampArtKind } from './campArtByKind';

const generate = (): MapDefinition => new MapGenerator().generate(createDefaultGameConfig(), 1);

const xSpan = (shape: readonly { readonly x: number }[]): number =>
  Math.max(...shape.map((point) => point.x)) - Math.min(...shape.map((point) => point.x));

describe('MapSceneryBuilder', () => {
  it('surrounds the battlefield with mountains and local, bridged biomes', () => {
    const map = generate();
    const scenery = new MapSceneryBuilder(map).build();
    for (const edge of ['north', 'south', 'west', 'east']) {
      const masses = scenery.filter(
        (piece) => piece.id.startsWith(`mountain-${edge}-`) && piece.id.endsWith('-mass'),
      );
      expect(masses.length).toBeGreaterThan(10);
      const axis = edge === 'north' || edge === 'south' ? 'x' : 'y';
      const coordinates = masses.flatMap((piece) => piece.shape.map((point) => point[axis]));
      expect(Math.min(...coordinates)).toBe(0);
      expect(Math.max(...coordinates)).toBe(axis === 'x' ? map.width : map.height);
      expect(new Set(masses.map((piece) => xSpan(piece.shape))).size).toBeGreaterThan(5);
    }
    for (const prefix of [
      'snow-pocket-',
      'lava-weathering-',
      'lava-river-',
      'lava-bridge-',
      'lake-deep-',
      'hill-',
      'tree-',
      'village-',
      'cathedral-nave-roof',
    ])
      expect(scenery.some((piece) => piece.id.startsWith(prefix))).toBe(true);
  });

  it('dresses each generated stronghold, camp and capture point at its anchor', () => {
    const map = generate();
    const scenery = new MapSceneryBuilder(map).build();
    const strongholds = map.features.filter((feature) => feature.kind === 'stronghold');
    expect(strongholds).toHaveLength(2);
    for (const { id } of strongholds) {
      const court = scenery.find((piece) => piece.id === `${id}-stronghold-court`);
      expect(court?.layer).toBe('ground');
      expect(xSpan(court?.shape ?? [])).toBeCloseTo(
        2 *
          (G.stronghold.radiusX - G.stronghold.wallThickness) *
          ((DEFAULT_MAP_LAYOUT.wallRing.radius -
            DEFAULT_MAP_LAYOUT.wallRing.thickness -
            G.stronghold.clearance) /
            G.stronghold.extent),
      );
    }
    const camps = map.features.filter((f) => f.kind === 'camp' || f.kind === 'corner-camp');
    expect(camps.length).toBeGreaterThan(0);
    for (const { id } of camps)
      expect(scenery.some((piece) => piece.id === `${id}-camp-clearing`)).toBe(true);
    const roofs = map.features
      .filter((feature) => feature.kind === 'capture-point')
      .map((feature) => scenery.find((piece) => piece.id === `${feature.id}-fort-keep-roof`));
    expect(roofs).toHaveLength(2);
    // The northern capture point is snowy, the southern one volcanic.
    expect(roofs[0]?.color).not.toBe(roofs[1]?.color);
  });

  it('is repeatable and keeps scenery inside the world with unique ids and valid polygons', () => {
    const map = generate();
    const scenery = new MapSceneryBuilder(map).build();
    expect(new MapSceneryBuilder(map).build()).toEqual(scenery);
    expect(scenery.length).toBeGreaterThan(1000);
    expect(new Set(scenery.map((piece) => piece.id)).size).toBe(scenery.length);
    for (const piece of scenery) {
      expect(piece.shape.length).toBeGreaterThanOrEqual(3);
      for (const point of piece.shape) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(map.width);
        expect(point.y).toBeLessThanOrEqual(map.height);
      }
    }
  });

  it('stretches the sketch-space scenery to a larger world', () => {
    const config = createDefaultGameConfig();
    const big = new MapGenerator().generate(
      { ...config, map: { ...config.map, worldWidth: 3200, worldHeight: 1800 } },
      1,
    );
    const nave = (map: MapDefinition): number =>
      xSpan(new MapSceneryBuilder(map).build().find((p) => p.id === 'cathedral-nave')?.shape ?? []);
    expect(nave(big)).toBeCloseTo(nave(generate()) * 2);
  });
  it('keeps every blocking object of another building out of every lane tower fort box and its clearance, 3 and 5 lanes, across seeds (DEC-315)', () => {
    const config = createDefaultGameConfig();
    const overlaps: string[] = [];
    for (const numLanes of [3, 5]) {
      for (const seed of [1, 1234, 7, 10, 42, 99, 2026]) {
        const map = new MapGenerator().generate({ map: { ...config.map, numLanes } }, seed);
        const objects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
        const towers = map.features.filter(
          ({ definitionId }) => MAP_FEATURE_DEFINITIONS[definitionId]?.isCourt === true,
        );
        // One box per tower, in feature order: its fort grown by the clearance (`laneTowerClearance`).
        const keepOuts = laneFortKeepOuts(map.features, map);
        for (const [index, tower] of towers.entries()) {
          const box = keepOuts[index];
          if (box === undefined) throw new Error('Every lane tower has a keep-out');
          for (const object of objects) {
            const isOwn = object.id === tower.id || object.partOf === tower.id;
            if (!object.isBlocking || isOwn) continue;
            if (object.footprints.some((shape) => doesPolygonOverlapRect(shape, box))) {
              overlaps.push(
                `${String(numLanes)} lanes, seed ${String(seed)}: ${tower.id} ~ ${object.id}`,
              );
            }
          }
        }
      }
    }

    expect(overlaps).toEqual([]);
  });

  it('keeps every mountain off the Stronghold wall, its turrets and gates, 3 and 5 lanes, across seeds and world sizes (HC-Q95)', () => {
    const config = createDefaultGameConfig();
    const touches: string[] = [];
    // 2000 × 900 stretches the sketch in x only, so wall footprints need their own x and y scale.
    const runs = [3, 5].flatMap((numLanes) => [
      { numLanes },
      { numLanes, worldWidth: 2000, worldHeight: 900 },
    ]);
    for (const run of runs) {
      for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
        const map = new MapGenerator().generate({ map: { ...config.map, ...run } }, seed);
        const objects = new MapObjectBuilder().build(map, new MapPresentationBuilder().build(map));
        const mountains = objects.filter(({ id }) => /^(mountain|hill)-/.test(id));
        for (const feature of map.features.filter(({ kind }) => WALL_RING_KINDS.has(kind))) {
          const area = feature.footprint ?? [feature.position];
          for (const mountain of mountains) {
            if (mountain.footprints.some((shape) => doPolygonsOverlap(shape, area))) {
              touches.push(
                `${String(run.numLanes)} lanes, ${String(map.width)}x${String(map.height)}, seed ${String(seed)}: ${feature.id} ~ ${mountain.id}`,
              );
            }
          }
        }
      }
    }

    expect(touches).toEqual([]);
  });

  it('keeps every camp whole: each blocking piece of its art still blocks, 3 and 5 lanes, across seeds (DEC-315)', () => {
    const config = createDefaultGameConfig();
    const lost: string[] = [];
    for (const numLanes of [3, 5]) {
      for (const seed of [1, 1234, 7, 10, 42, 99, 2026]) {
        const map = new MapGenerator().generate({ map: { ...config.map, numLanes } }, seed);
        const scenery = new MapSceneryBuilder(map).build();
        let camps = 0;
        for (const camp of map.features) {
          if (!isCampArtKind(camp.kind)) continue;
          camps += 1;
          const isBlocking = (piece: MapDecoration): boolean => piece.object?.isFootprint === true;
          const authored = CAMP_ART[camp.kind](camp).filter(isBlocking).length;
          const blocking = scenery.filter((p) => p.replacesFeature === camp.id && isBlocking(p));
          if (blocking.length !== authored) {
            lost.push(
              `${String(numLanes)} lanes, seed ${String(seed)}: ${camp.id} blocks with ${String(blocking.length)} of ${String(authored)} pieces`,
            );
          }
        }
        expect(camps).toBeGreaterThan(0);
      }
    }

    expect(lost).toEqual([]);
  });

  it('leaves out the pieces of a camp that cannot move that stand in a fort, and keeps its ground (DEC-318 (BTD4))', () => {
    // 5 lanes with 2 + 3 towers per lane: corridor 0's camp has no step clear of the forts.
    const config = createDefaultGameConfig();
    const crowded = { ...config.map, numLanes: 5, spawnTowersPerLane: 2, buffTowersPerLane: 3 };
    for (const seed of [1234, 7]) {
      const map = new MapGenerator().generate({ map: crowded }, seed);
      const keepOuts = laneFortKeepOuts(map.features, map);
      const camp = map.features.find(({ id }) => id === 'west-camp-corridor-0-0');
      if (camp === undefined || !isCampArtKind(camp.kind)) throw new Error('No corridor 0 camp');
      const art = CAMP_ART[camp.kind](camp);
      const drawn = new MapSceneryBuilder(map)
        .build()
        .filter((piece) => piece.replacesFeature === camp.id);
      const inFort = drawn.filter(
        (piece) => piece.layer !== 'ground' && isInLaneFortKeepOut(boundsOf(piece.shape), keepOuts),
      );

      expect(drawn.length).toBeLessThan(art.length);
      expect(inFort.map(({ id }) => id)).toEqual([]);
      expect(drawn.filter(({ layer }) => layer === 'ground')).toHaveLength(
        art.filter(({ layer }) => layer === 'ground').length,
      );
    }
  });

  it('fills exactly the box the generator clears for a camp, so art and generation cannot drift apart (campHalfExtent)', () => {
    // At the default world, 1 sketch unit is 1 m, so the sketch-unit extent applies as it is.
    const map = generate();
    const scenery = new MapSceneryBuilder(map).build();
    const misfits: string[] = [];
    let camps = 0;
    for (const { id, kind, position } of map.features) {
      if (!isCampArtKind(kind)) continue;
      camps += 1;
      const halfExtent = campHalfExtent(kind);
      const points = scenery
        .filter((piece) => piece.replacesFeature === id)
        .flatMap(({ shape }) => shape);
      const reach = {
        x: Math.max(...points.map(({ x }) => Math.abs(x - position.x))),
        y: Math.max(...points.map(({ y }) => Math.abs(y - position.y))),
      };
      if (Math.abs(reach.x - halfExtent.x) > 1e-9 || Math.abs(reach.y - halfExtent.y) > 1e-9) {
        misfits.push(`${id}: reaches ${String(reach.x)} x ${String(reach.y)}`);
      }
    }

    expect(camps).toBeGreaterThan(0);
    expect(misfits).toEqual([]);
  });
});

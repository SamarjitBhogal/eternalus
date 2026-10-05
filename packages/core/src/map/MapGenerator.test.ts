import { describe, expect, it } from 'vitest';

import { DEFAULT_MAP_CONFIG } from '../content/maps/defaultMapConfig';
import { DEFAULT_MAP_LAYOUT } from '../content/maps/defaultMapLayout';
import type {
  MapDefinition,
  MapFeature,
  MapFeatureKind,
  MapLayout,
} from '../content/maps/maps.types';
import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import { MAP_1_PRESET } from '../content/maps/presets/map1Preset';
import { distanceToPath, isPointInPolygon, lerpPoint } from '../utils/geometry';
import { MapGenerationError } from './MapGenerationError';
import { MapGenerator } from './MapGenerator';
import { findAsymmetries } from './mapSymmetry';
import type { MapConfig } from './MapGenerator.types';

const SEED = 1234;
/** FNV-1a of the default map's JSON at SEED; see the golden-hash test. */
const GOLDEN_HASH = 672_747_009;
const EPSILON = 1e-6;

type Ground = 'map-1' | 'generated';

/** The default config without a preset: plain generated ground, straight lanes. */
const GENERATED_GROUND: MapConfig = (() => {
  const config: { -readonly [K in keyof MapConfig]: MapConfig[K] } = { ...DEFAULT_MAP_CONFIG };
  delete config.presetId;
  return config;
})();

const generate = (
  overrides: Partial<MapConfig> = {},
  seed = SEED,
  ground: Ground = 'map-1',
): MapDefinition => {
  const base = ground === 'map-1' ? DEFAULT_MAP_CONFIG : GENERATED_GROUND;
  return new MapGenerator().generate({ map: { ...base, ...overrides } }, seed);
};

const ofKind = (map: MapDefinition, kind: MapFeatureKind): readonly MapFeature[] =>
  map.features.filter((feature) => feature.kind === kind);

const countFor = (map: MapDefinition, kind: MapFeatureKind, team: string): number =>
  ofKind(map, kind).filter((feature) => feature.team === team).length;

// Both the authored map-1 look and the plain generated ground must pass every rule.
const GROUNDS: readonly Ground[] = ['map-1', 'generated'];

describe('MapGenerator', () => {
  it('is deterministic: the same config and seed give deep-equal maps', () => {
    expect(generate()).toEqual(generate());
  });

  it('changes only the scattered obstacles when the seed changes', () => {
    const notObstacle = (map: MapDefinition): readonly MapFeature[] =>
      map.features.filter(
        (feature) => feature.kind !== 'obstacle' || feature.definitionId === 'bridge-segment',
      );
    const a = generate({}, 1);
    const b = generate({}, 2);

    expect(notObstacle(a)).toEqual(notObstacle(b));
    expect(a.lanes).toEqual(b.lanes);
    expect(ofKind(a, 'obstacle')).not.toEqual(ofKind(b, 'obstacle'));
  });

  it('returns a frozen map', () => {
    const map = generate();

    expect(Object.isFrozen(map)).toBe(true);
    expect(Object.isFrozen(map.features[0]?.position)).toBe(true);
  });

  it.each(GROUNDS)('mirrors every Light feature onto a Dark one (%s ground)', (ground) => {
    const map = generate({}, SEED, ground);
    const light = map.features.filter((feature) => feature.team === 'light');
    const dark = map.features.filter((feature) => feature.team === 'dark');

    expect(light.length).toBeGreaterThan(0);
    expect(dark).toHaveLength(light.length);
    for (const feature of light) {
      const mirror = dark.find((other) => other.id === feature.id.replace(/^light-/, 'dark-'));
      expect(mirror?.kind).toBe(feature.kind);
      expect(mirror?.laneId).toBe(feature.laneId);
      expect(mirror?.position.x).toBeCloseTo(map.width - feature.position.x, 6);
      expect(mirror?.position.y).toBeCloseTo(feature.position.y, 6);
      // Same footprint shape, mirrored (corner order may differ).
      for (const point of feature.footprint ?? []) {
        const twin = mirror?.footprint?.find(
          (other) =>
            Math.abs(other.x - (map.width - point.x)) < EPSILON &&
            Math.abs(other.y - point.y) < EPSILON,
        );
        expect(twin).toBeDefined();
      }
    }
  });

  it.each(GROUNDS)(
    'gives every lane, terrain shape and feature a unique id (%s ground)',
    (ground) => {
      const map = generate({}, SEED, ground);
      const ids = [...map.lanes, ...map.terrain, ...map.features].map((item) => item.id);

      expect(new Set(ids).size).toBe(ids.length);
    },
  );

  it.each(GROUNDS)('keeps every point inside the world (%s ground)', (ground) => {
    const map = generate({}, SEED, ground);
    const points = [
      ...map.lanes.flatMap((lane) => lane.path),
      ...map.terrain.flatMap((piece) => piece.shape),
      ...map.features.map((feature) => feature.position),
    ];
    const isInside = (x: number, y: number): boolean =>
      x >= -EPSILON && x <= map.width + EPSILON && y >= -EPSILON && y <= map.height + EPSILON;

    expect(points.every((point) => isInside(point.x, point.y))).toBe(true);
  });

  it('places Light in the west and Dark in the east', () => {
    const map = generate();
    const [light] = ofKind(map, 'stronghold').filter((feature) => feature.team === 'light');
    const [dark] = ofKind(map, 'stronghold').filter((feature) => feature.team === 'dark');

    expect(light?.position.x).toBeLessThan(map.width / 2);
    expect(dark?.position.x).toBeGreaterThan(map.width / 2);
  });

  it('builds the MVP map from the default config', () => {
    const map = generate();

    expect(map.lanes).toHaveLength(3);
    expect(countFor(map, 'stronghold', 'light')).toBe(1);
    expect(countFor(map, 'spawner-tower', 'light')).toBe(3);
    expect(countFor(map, 'buff-tower', 'dark')).toBe(3);
    expect(countFor(map, 'gate', 'light')).toBe(3);
    expect(ofKind(map, 'capture-point')).toHaveLength(2);
    expect(ofKind(map, 'cathedral')).toHaveLength(1);
    expect(countFor(map, 'camp', 'neutral')).toBe(2 * DEFAULT_MAP_CONFIG.campsPerSide);
    expect(ofKind(map, 'corner-camp')).toHaveLength(DEFAULT_MAP_CONFIG.cornerCamps);
  });

  it.each(GROUNDS)(
    'follows the config: numLanes 3 -> 5 needs no code change (%s ground)',
    (ground) => {
      const map = generate({ numLanes: 5 }, SEED, ground);
      const laneIds = map.lanes.map((lane) => lane.id);

      expect(map.lanes).toHaveLength(5);
      expect(ofKind(map, 'capture-point').length + ofKind(map, 'cathedral').length).toBe(5);
      expect(ofKind(map, 'cathedral')[0]?.laneId).toBe('lane-2');
      for (const team of ['light', 'dark']) {
        expect(countFor(map, 'spawner-tower', team)).toBe(5);
        expect(countFor(map, 'buff-tower', team)).toBe(5);
        expect(countFor(map, 'gate', team)).toBe(5);
        const gates = ofKind(map, 'gate').filter((feature) => feature.team === team);
        expect(gates.map((gate) => gate.laneId).sort()).toEqual([...laneIds].sort());
      }
      // 6 camps per side spread over the 4 corridors between 5 lanes, none lost.
      expect(countFor(map, 'camp', 'neutral')).toBe(2 * DEFAULT_MAP_CONFIG.campsPerSide);
      const corridors = new Set(ofKind(map, 'camp').map((camp) => camp.id.split('-')[3]));
      expect(corridors.size).toBe(4);
    },
  );

  it('places spawnTowersPerLane and buffTowersPerLane towers on every lane, SpawnerTowers in front', () => {
    const map = generate({ numLanes: 5, spawnTowersPerLane: 2, buffTowersPerLane: 3 });

    for (const lane of map.lanes) {
      const onLane = (kind: MapFeatureKind): readonly MapFeature[] =>
        ofKind(map, kind).filter(
          (feature) => feature.laneId === lane.id && feature.team === 'light',
        );
      expect(onLane('spawner-tower')).toHaveLength(2);
      expect(onLane('buff-tower')).toHaveLength(3);
      const rearmostSpawner = Math.min(...onLane('spawner-tower').map((tower) => tower.position.x));
      const frontmostBuff = Math.max(...onLane('buff-tower').map((tower) => tower.position.x));
      expect(rearmostSpawner).toBeGreaterThan(frontmostBuff);
      for (const tower of [...onLane('spawner-tower'), ...onLane('buff-tower')]) {
        expect(distanceToPath(tower.position, lane.path)).toBeLessThan(EPSILON);
      }
    }
  });

  it('starts every lane at its Light gate and ends it at its Dark gate', () => {
    const map = generate();

    for (const lane of map.lanes) {
      const gate = (team: string): MapFeature | undefined =>
        ofKind(map, 'gate').find((feature) => feature.team === team && feature.laneId === lane.id);
      expect(lane.path[0]?.x).toBeCloseTo(gate('light')?.position.x ?? Number.NaN, 6);
      expect(lane.path[0]?.y).toBeCloseTo(gate('light')?.position.y ?? Number.NaN, 6);
      expect(lane.path.at(-1)?.x).toBeCloseTo(gate('dark')?.position.x ?? Number.NaN, 6);
      expect(lane.path.at(-1)?.y).toBeCloseTo(gate('dark')?.position.y ?? Number.NaN, 6);
    }
  });

  it('puts a turret on every wall ring corner: one per gate or wall segment', () => {
    const map = generate();
    const ringPieces = countFor(map, 'gate', 'light') + countFor(map, 'wall-segment', 'light');

    expect(countFor(map, 'turret', 'light')).toBe(ringPieces);
  });

  it('puts the capture points on the centre line and the Cathedral on the middle lane', () => {
    const map = generate({}, SEED, 'generated');
    const points = [...ofKind(map, 'capture-point'), ...ofKind(map, 'cathedral')];

    expect(points.every((point) => Math.abs(point.position.x - map.width / 2) < EPSILON)).toBe(
      true,
    );
    expect(ofKind(map, 'cathedral')[0]?.position).toEqual({ x: map.width / 2, y: map.height / 2 });
  });

  it('makes camps heavier the deeper they sit between lanes (DISC-42)', () => {
    const map = generate({ campsPerSide: 10 });
    const rank = (id: string): number =>
      ['forest-camp-light', 'forest-camp-medium', 'forest-camp-heavy'].indexOf(id);
    const camps = ofKind(map, 'camp').map((camp) => ({
      weight: rank(camp.definitionId),
      depth: Math.min(...map.lanes.map((lane) => distanceToPath(camp.position, lane.path))),
    }));

    expect(new Set(camps.map((camp) => camp.weight)).size).toBeGreaterThan(1);
    // A camp clearly deeper than another must never be lighter than it.
    const inversions = camps.filter((deeper) =>
      camps.some(
        (shallower) => deeper.depth > shallower.depth + 1 && deeper.weight < shallower.weight,
      ),
    );
    expect(inversions).toEqual([]);
  });

  it('keeps team features and lanes out of the rift and out-of-bounds terrain', () => {
    const map = generate({ numLanes: 5 });
    const shapes = map.terrain.map((piece) => piece.shape);
    const teamFeatures = map.features.filter((feature) => feature.team !== 'neutral');

    expect(
      teamFeatures.some((feature) =>
        shapes.some((shape) => isPointInPolygon(feature.position, shape)),
      ),
    ).toBe(false);
    // Walk every lane in 1-unit steps: no step may land in the rift or out of bounds.
    const lanePoints = map.lanes.flatMap((lane) =>
      lane.path.slice(1).flatMap((to, index) => {
        const from = lane.path[index] ?? to;
        const steps = Math.ceil(Math.abs(to.x - from.x) + Math.abs(to.y - from.y));
        return Array.from({ length: steps }, (_, step) => lerpPoint(from, to, step / steps));
      }),
    );
    expect(lanePoints.length).toBeGreaterThan(1000);
    expect(
      lanePoints.filter((point) => shapes.some((shape) => isPointInPolygon(point, shape))),
    ).toEqual([]);
    expect(map.terrain.filter((piece) => piece.kind === 'rift').length).toBeGreaterThan(0);
  });

  it('cuts one bridge gap in the rift per lane, with a bridge segment in it', () => {
    const map = generate({ numLanes: 5 }, SEED, 'generated');
    const bridges = map.features.filter((feature) => feature.definitionId === 'bridge-segment');

    expect(bridges).toHaveLength(5);
    expect(map.terrain.filter((piece) => piece.kind === 'rift')).toHaveLength(6);
  });

  it('keeps scattered obstacles off the lanes', () => {
    const map = generate();
    const scattered = ofKind(map, 'obstacle').filter(
      (feature) => feature.definitionId !== 'bridge-segment',
    );

    expect(scattered.length).toBeGreaterThan(0);
    for (const obstacle of scattered) {
      for (const lane of map.lanes) {
        expect(distanceToPath(obstacle.position, lane.path)).toBeGreaterThanOrEqual(
          DEFAULT_MAP_LAYOUT.obstacles.laneClearance,
        );
      }
    }
  });

  it('gives each feature its definition id and minimap glyph', () => {
    const map = generate();
    const tower = ofKind(map, 'spawner-tower')[0];

    expect(tower?.definitionId).toBe('spawner-tower');
    expect(tower?.minimapGlyph).toEqual({ shape: 'square', size: 5, colourRole: 'team' });
    expect(tower?.footprint?.length).toBe(DEFAULT_MAP_LAYOUT.footprintSides);
  });

  it('keeps the traced map-1 lane bends and corner objectives from feat/map', () => {
    const map = generate();
    const north = map.lanes[0]?.path ?? [];
    const traced = [
      { x: 180, y: 350 },
      { x: 295, y: 315 },
      { x: 480, y: 175 },
      { x: 645, y: 115 },
      { x: 800, y: 100 },
    ];

    for (const point of traced) {
      expect(distanceToPath(point, north)).toBeLessThan(1);
    }
    expect(map.lanes.map((lane) => lane.path[Math.floor(lane.path.length / 2)]?.y)).toEqual([
      100, 450, 800,
    ]);
    expect(ofKind(map, 'corner-camp').map((camp) => camp.position)).toContainEqual({
      x: 320,
      y: 80,
    });
    expect(ofKind(map, 'cathedral')[0]?.position).toEqual({ x: 800, y: 450 });
  });

  it.each<[string, Partial<MapConfig>]>([
    ['an even lane count', { numLanes: 4 }],
    ['zero lanes', { numLanes: 0 }],
    ['a negative tower count', { spawnTowersPerLane: -1 }],
    ['a fractional camp count', { campsPerSide: 1.5 }],
    ['an odd corner camp count', { cornerCamps: 3 }],
    ['camps with a single lane', { numLanes: 1 }],
    ['an empty world', { worldWidth: 0 }],
    ['an unknown preset', { presetId: 'no-such-map' }],
    ['an endless world', { worldWidth: Number.POSITIVE_INFINITY }],
  ])('rejects %s with a MapGenerationError', (_, overrides) => {
    expect(() => generate(overrides)).toThrow(MapGenerationError);
  });

  it('rejects a seed that is not a whole number', () => {
    expect(() => generate({}, 2.5)).toThrow(/seed must be a whole number/);
  });

  it.each<[string, Partial<MapLayout>]>([
    ['spawner band behind the buff band', { laneBands: { spawner: [0.1, 0.2], buff: [0.3, 0.4] } }],
    [
      'unsorted camp weight classes',
      {
        camps: {
          band: [0.4, 0.8],
          weightClasses: [
            { minDepth: 0, definitionId: 'forest-camp-light' },
            { minDepth: 0.9, definitionId: 'forest-camp-heavy' },
            { minDepth: 0.5, definitionId: 'forest-camp-medium' },
          ],
        },
      },
    ],
    ['a two-sided footprint', { footprintSides: 2 }],
  ])('rejects layout content with %s', (_, overrides) => {
    const generator = new MapGenerator({ layout: { ...DEFAULT_MAP_LAYOUT, ...overrides } });

    expect(() => generator.generate({ map: DEFAULT_MAP_CONFIG }, SEED)).toThrow(
      /Invalid map layout/,
    );
  });

  it('allows a single lane when there are no camps', () => {
    const map = generate({ numLanes: 1, campsPerSide: 0 });

    expect(map.lanes).toHaveLength(1);
    expect(ofKind(map, 'cathedral')).toHaveLength(1);
  });

  it('rejects a preset whose ground does not fit the configured lanes', () => {
    const generator = new MapGenerator({
      presets: {
        'flooded-west': {
          id: 'flooded-west',
          displayName: 'Flooded west',
          // Out of bounds over the whole middle band of the west half: every lane runs into it.
          westOutOfBounds: [
            [
              { x: 0.2, y: 0 },
              { x: 0.45, y: 0 },
              { x: 0.45, y: 1 },
              { x: 0.2, y: 1 },
            ],
          ],
          riftProfile: [
            { y: 0, halfWidth: 7 },
            { y: 1, halfWidth: 7 },
          ],
        },
      },
    });

    expect(() =>
      generator.generate({ map: { ...DEFAULT_MAP_CONFIG, presetId: 'flooded-west' } }, SEED),
    ).toThrow(/runs through terrain/);
  });

  it('refuses to build a gate its turrets would close (too many lanes for the ring)', () => {
    expect(() => generate({ numLanes: 9 })).toThrow(/minGateOpening/);
    const narrowArc = new MapGenerator({
      layout: {
        ...DEFAULT_MAP_LAYOUT,
        wallRing: { ...DEFAULT_MAP_LAYOUT.wallRing, exitArcDegrees: 40 },
      },
    });
    expect(() => narrowArc.generate({ map: { ...DEFAULT_MAP_CONFIG, numLanes: 5 } }, SEED)).toThrow(
      /gate of lane-\d/,
    );
  });

  it.each([1, 3, 5, 7])(
    'is mirror-symmetric in every feature, terrain shape and lane (%i lanes)',
    (numLanes) => {
      for (const ground of GROUNDS) {
        const map = generate({ numLanes, campsPerSide: numLanes > 1 ? 6 : 0 }, SEED, ground);
        expect(findAsymmetries(map)).toEqual([]);
      }
    },
  );

  it('never freezes or shares the content it reads', () => {
    const map = generate();
    const tower = map.features.find((feature) => feature.kind === 'spawner-tower');

    expect(Object.isFrozen(MAP_FEATURE_DEFINITIONS['spawner-tower']?.minimapGlyph)).toBe(false);
    expect(Object.isFrozen(MAP_1_PRESET.westOutOfBounds[0])).toBe(false);
    expect(tower?.minimapGlyph).not.toBe(MAP_FEATURE_DEFINITIONS['spawner-tower']?.minimapGlyph);
  });

  it('scales a preset to any world size', () => {
    const map = generate({ worldWidth: 3200, worldHeight: 1800 });
    const westBounds = map.terrain.find((piece) => piece.id === 'west-bounds-0');

    expect(map.width).toBe(3200);
    expect(westBounds?.shape[1]).toEqual({ x: 550, y: 0 });
    expect(findAsymmetries(map)).toEqual([]);
  });

  it('only uses terrain polygons with at least three points', () => {
    for (const ground of GROUNDS) {
      const map = generate({ numLanes: 5 }, SEED, ground);
      expect(map.terrain.every((piece) => piece.shape.length >= 3)).toBe(true);
    }
  });

  it('matches its golden hash, so a change in output (or in platform maths) is caught', () => {
    // FNV-1a over the JSON of the default map. If you change generation on purpose,
    // update this number in the same commit and say why in the PR.
    const json = JSON.stringify(generate());
    let hash = 0x811c9dc5;
    for (let index = 0; index < json.length; index += 1) {
      hash = Math.imul(hash ^ json.charCodeAt(index), 0x01000193) >>> 0;
    }

    expect(hash).toBe(GOLDEN_HASH);
  });

  it('rejects a feature that names an unknown definition', () => {
    const generator = new MapGenerator({ definitions: {} });

    expect(() => generator.generate({ map: DEFAULT_MAP_CONFIG }, SEED)).toThrow(
      /unknown definition/,
    );
  });
});

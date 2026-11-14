import { describe, expect, it } from 'vitest';

import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import type { MapDefinition, MapFeature } from '../content/maps/maps.types';
import type { MapObject } from '../content/maps/mapObjects.types';
import { MapGenerationError } from './MapGenerationError';
import type { Polygon } from '../utils/geometry.types';
import { MatchGrid } from './MatchGrid';

const CELL = 2.5;
const OPTIONS = { cellSize: CELL, features: MAP_FEATURE_DEFINITIONS };

const box = (x0: number, y0: number, x1: number, y1: number): Polygon => [
  { x: x0, y: y0 },
  { x: x1, y: y0 },
  { x: x1, y: y1 },
  { x: x0, y: y1 },
];

const placed = (id: string, definitionId: string, footprint: Polygon): MapFeature => ({
  id,
  kind: definitionId as MapFeature['kind'],
  team: 'neutral',
  definitionId,
  position: footprint[0] ?? { x: 0, y: 0 },
  minimapGlyph: { shape: 'dot', size: 1, colourRole: 'team' },
  footprint,
});

const object = (id: string, isBlocking: boolean, footprint: Polygon): MapObject => ({
  id,
  kind: isBlocking ? 'wall' : 'stronghold',
  isBlocking,
  footprints: [footprint],
});

/** A 1600 x 900 map: a tower court, a wall segment, and a Stronghold floor that is walkable. */
const mapOf = (width: number, height: number): MapDefinition => ({
  id: 'match-grid-test-map',
  displayName: 'Match grid',
  width,
  height,
  seed: 1,
  lanes: [],
  terrain: [],
  features: [
    placed('tower', 'spawner-tower', box(200, 200, 260, 260)),
    placed('segment', 'wall-segment', box(600, 200, 640, 240)),
    placed('floor', 'stronghold', box(800, 200, 900, 300)),
  ],
});

const TOWER = object('tower', true, box(220, 220, 240, 240));
const SEGMENT = object('segment', true, box(600, 200, 640, 240));
const FLOOR = object('floor', false, box(800, 200, 900, 300));

describe('MatchGrid', () => {
  it('stamps a court feature inside its fort as court ground and a plain blocking feature as a footprint', () => {
    const { grid } = MatchGrid.build(mapOf(1600, 900), [TOWER, SEGMENT, FLOOR], OPTIONS);

    // Between the court's edge and the fort's wall: closed, but court ground.
    expect(grid.isWalkableAt(205, 205)).toBe(false);
    expect(grid.isCourt(Math.floor(205 / CELL), Math.floor(205 / CELL))).toBe(true);
    // The wall segment is a plain footprint: closed, and no court.
    expect(grid.isWalkableAt(620, 220)).toBe(false);
    expect(grid.isCourt(Math.floor(620 / CELL), Math.floor(220 / CELL))).toBe(false);
  });

  it('does not stamp a feature whose map object is walkable', () => {
    const { grid } = MatchGrid.build(mapOf(1600, 900), [TOWER, SEGMENT, FLOOR], OPTIONS);

    expect(grid.isWalkableAt(850, 250)).toBe(true);
  });

  it('stamps a feature with no object of its id as a plain footprint, even a court feature', () => {
    const { grid } = MatchGrid.build(mapOf(1600, 900), [], OPTIONS);

    expect(grid.isWalkableAt(205, 205)).toBe(false);
    expect(grid.isCourt(Math.floor(205 / CELL), Math.floor(205 / CELL))).toBe(false);
  });

  it('reopens the court behind a destroyed object, and returns the cells that changed', () => {
    const matchGrid = MatchGrid.build(mapOf(1600, 900), [TOWER, SEGMENT, FLOOR], OPTIONS);

    const cells = matchGrid.reopen(TOWER);

    expect(cells.length).toBeGreaterThan(0);
    expect(matchGrid.grid.isWalkableAt(205, 205)).toBe(true);
    expect(matchGrid.grid.isWalkableAt(230, 230)).toBe(true);
    expect(matchGrid.grid.isCourt(Math.floor(205 / CELL), Math.floor(205 / CELL))).toBe(false);
    // Another object's stamp stays.
    expect(matchGrid.grid.isWalkableAt(620, 220)).toBe(false);
  });

  it('reopens the footprint behind a destroyed plain object', () => {
    const matchGrid = MatchGrid.build(mapOf(1600, 900), [TOWER, SEGMENT, FLOOR], OPTIONS);

    expect(matchGrid.reopen(SEGMENT).length).toBeGreaterThan(0);
    expect(matchGrid.grid.isWalkableAt(620, 220)).toBe(true);
  });

  it('refuses a court on a world too small for its fort walls', () => {
    // 400 x 225: a lane tower fort wall is 0.8 units thick, thinner than a 2.5 cell.
    const map = mapOf(400, 225);

    expect(() => MatchGrid.build(map, [TOWER], OPTIONS)).toThrow(MapGenerationError);
    expect(() => MatchGrid.build(map, [], OPTIONS)).not.toThrow();
  });
});

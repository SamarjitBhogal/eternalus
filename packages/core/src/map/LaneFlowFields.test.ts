import { describe, expect, it } from 'vitest';

import { createDefaultGameConfig } from '../config/defaultGameConfig';
import type { MapDefinition } from '../content/maps/maps.types';
import { MAP_FEATURE_DEFINITIONS } from '../content/maps/mapFeatureDefinitions';
import { regularPolygon } from '../utils/geometry';
import {
  DIRECTION_COLS,
  DIRECTION_PREFERENCE,
  DIRECTION_ROWS,
  NO_DIRECTION,
  UNREACHED,
} from './FlowField.constants';
import type { FlowField } from './FlowField';
import { LaneFlowFields } from './LaneFlowFields';
import { MapGenerator } from './MapGenerator';
import { WorldMap } from './WorldMap';

const isBlocking = (definitionId: string): boolean =>
  MAP_FEATURE_DEFINITIONS[definitionId]?.isBlocking ?? false;

/** The generated map for `numLanes`, its grid and its fields. */
const world = (numLanes: number) => {
  const config = createDefaultGameConfig({ map: { numLanes } });
  const map = new MapGenerator().generate(config, 1);
  const grid = WorldMap.fromDefinition(map, config.map.navCellSize, isBlocking);
  const fields = new LaneFlowFields(grid, map, config.map.flowFieldCorridorHalfWidth);
  return { config, map, grid, fields };
};

const THREE = world(3);
const FIVE = world(5);

const stepCost = (step: number): number => (step < 4 ? 10 : 14);

/** The cell `cell`'s direction leads to. */
const nextCell = (grid: WorldMap, field: FlowField, cell: number): number => {
  const step = field.direction[cell] ?? NO_DIRECTION;
  return cell + (DIRECTION_ROWS[step] ?? 0) * grid.cols + (DIRECTION_COLS[step] ?? 0);
};

/** Every open corridor cell that cannot reach the goal through open cells (8-way, no corner cuts). */
const unreachedOpenCells = (field: FlowField): number[] =>
  Array.from(field.mask.keys()).filter(
    (cell) => field.isOpen(cell) && field.integration[cell] === UNREACHED,
  );

describe('LaneFlowFields', () => {
  it.each([
    [3, THREE],
    [5, FIVE],
  ])('builds one field per lane and team: %i lanes', (numLanes, { map, fields }) => {
    expect(fields.fields).toHaveLength(2 * numLanes);
    for (const lane of map.lanes) {
      expect(fields.field(lane.id, 'light')?.team).toBe('light');
      expect(fields.field(lane.id, 'dark')?.laneId).toBe(lane.id);
    }
    expect(fields.field('no-such-lane', 'light')).toBeUndefined();
    expect(fields.pending).toBe(0);
  });

  it.each([
    [3, THREE],
    [5, FIVE],
  ])(
    'reaches every walkable corridor cell and points downhill: %i lanes',
    (_, { grid, fields }) => {
      for (const field of fields.fields) {
        expect(field.isOpen(field.goal)).toBe(true);
        expect(field.integration[field.goal]).toBe(0);
        expect(unreachedOpenCells(field)).toEqual([]);
        for (let cell = 0; cell < field.mask.length; cell += 1) {
          const cost = field.integration[cell] ?? UNREACHED;
          if (cell === field.goal || cost === UNREACHED) {
            continue;
          }
          const step = field.direction[cell] ?? NO_DIRECTION;
          const next = nextCell(grid, field, cell);
          expect(field.isOpen(next)).toBe(true);
          expect((field.integration[next] ?? UNREACHED) + stepCost(step)).toBe(cost);
        }
      }
    },
  );

  it('covers the ground from the Stronghold out through its gate', () => {
    const { map, grid, fields } = THREE;
    const stronghold = map.features.find(
      (feature) => feature.kind === 'stronghold' && feature.team === 'light',
    );
    const field = fields.fields[0];
    const lane = map.lanes.find(({ id }) => id === field?.laneId);
    const gate = lane?.path[0];
    if (stronghold === undefined || field === undefined || gate === undefined) {
      throw new Error('the generated map has no light Stronghold or lane');
    }
    // Halfway from the Stronghold's footprint edge to the gate, inside the wall ring.
    const footprint = MAP_FEATURE_DEFINITIONS.stronghold?.footprintRadius ?? 0;
    const along =
      (footprint +
        (Math.hypot(gate.x - stronghold.position.x, gate.y - stronghold.position.y) - footprint) /
          2) /
      Math.hypot(gate.x - stronghold.position.x, gate.y - stronghold.position.y);
    const inside = grid.cellAt({
      x: stronghold.position.x + (gate.x - stronghold.position.x) * along,
      y: stronghold.position.y + (gate.y - stronghold.position.y) * along,
    });
    const cell = inside === null ? -1 : inside.row * grid.cols + inside.col;

    expect(field.mask[cell]).toBe(1);
    expect(field.integration[cell]).toBeLessThan(UNREACHED);
  });

  it.each([
    [3, THREE],
    [5, FIVE],
  ])(
    "mirrors each lane's Light field onto its Dark field: %i lanes",
    (_, { grid, map, fields }) => {
      const mirrorStep = DIRECTION_PREFERENCE.dark;
      for (const lane of map.lanes) {
        const light = fields.field(lane.id, 'light');
        const dark = fields.field(lane.id, 'dark');
        for (let row = 0; row < grid.rows; row += 1) {
          for (let col = 0; col < grid.cols; col += 1) {
            const cell = row * grid.cols + col;
            const twin = row * grid.cols + (grid.cols - 1 - col);
            expect(dark?.mask[twin]).toBe(light?.mask[cell]);
            expect(dark?.integration[twin]).toBe(light?.integration[cell]);
            const step = light?.direction[cell] ?? NO_DIRECTION;
            expect(dark?.direction[twin]).toBe(step === NO_DIRECTION ? step : mirrorStep[step]);
          }
        }
      }
    },
  );

  it('re-routes a field within ceil(cells / budget) ticks of a gate change, the old one serving', () => {
    const { config, map, grid } = world(3);
    const fields = new LaneFlowFields(grid, map, config.map.flowFieldCorridorHalfWidth);
    const field = fields.fields[0];
    const gate = map.lanes.find(({ id }) => id === field?.laneId)?.path[0];
    if (field === undefined || gate === undefined) {
      throw new Error('the generated map has no lane');
    }
    const serving = field.integration;
    const before = Uint16Array.from(serving);
    const budget = 500;
    // Half-close the first lane's Light gate: a blocker over the middle of its opening.
    const changed = grid.stampFootprint(regularPolygon(gate, 4, 12));
    fields.markDirty(changed);

    const settled = [fields.rebuildDirty(budget)];
    const servedMidway =
      field.integration === serving &&
      field.integration.every((cost, cell) => cost === before[cell]);
    while (field.integration === serving) {
      settled.push(fields.rebuildDirty(budget));
    }

    expect(changed.length).toBeGreaterThan(0);
    expect(field.cellCount).toBeGreaterThan(budget);
    expect(servedMidway).toBe(true);
    expect(settled.length).toBeLessThanOrEqual(Math.ceil(field.cellCount / budget));
    expect(Math.max(...settled)).toBeLessThanOrEqual(budget);
    expect(changed.map((cell) => field.integration[cell])).toEqual(changed.map(() => UNREACHED));
    expect(field.integration).not.toEqual(before);
    expect(unreachedOpenCells(field)).toEqual([]);
  });

  it('rebuilds the first dirty field within ceil(cells / budget) ticks', () => {
    const { config, map, grid } = world(3);
    const fields = new LaneFlowFields(grid, map, config.map.flowFieldCorridorHalfWidth);
    const field = fields.fields[0];
    if (field === undefined) {
      throw new Error('no field');
    }
    const budget = 300;
    const holdingGoal = fields.fields.filter(({ mask }) => mask[field.goal] === 1).length;
    fields.markDirty([field.goal]);
    expect(fields.pending).toBe(holdingGoal);
    // Marking the same cells again queues nothing twice.
    fields.markDirty([field.goal]);
    expect(fields.pending).toBe(holdingGoal);
    const queued = fields.pending;
    let ticks = 0;
    while (fields.pending === queued) {
      fields.rebuildDirty(budget);
      ticks += 1;
    }

    expect(queued).toBeGreaterThanOrEqual(1);
    expect(ticks).toBeLessThanOrEqual(Math.ceil(field.cellCount / budget));
    expect(fields.rebuildDirty(0)).toBe(0);
  });

  it('leaves a field unreached when its goal is blocked, and stays idle with nothing dirty', () => {
    const map: MapDefinition = {
      id: 'tiny',
      displayName: 'Tiny',
      width: 50,
      height: 20,
      seed: 0,
      lanes: [
        {
          id: 'lane-0',
          index: 0,
          path: [
            { x: 5, y: 10 },
            { x: 45, y: 10 },
          ],
        },
      ],
      terrain: [
        {
          id: 'rift',
          kind: 'rift',
          shape: [
            { x: 40, y: 5 },
            { x: 50, y: 5 },
            { x: 50, y: 15 },
            { x: 40, y: 15 },
          ],
        },
      ],
      features: [],
    };
    const grid = WorldMap.fromDefinition(map, 5, isBlocking);
    const fields = new LaneFlowFields(grid, map, 5);

    expect(fields.field('lane-0', 'light')?.integration.every((cost) => cost === UNREACHED)).toBe(
      true,
    );
    expect(fields.field('lane-0', 'dark')?.integration.some((cost) => cost === 0)).toBe(true);
    expect(fields.rebuildDirty(100)).toBe(0);
  });
});

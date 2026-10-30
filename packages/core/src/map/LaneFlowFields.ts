import type { MapDefinition, MapLane } from '../content/maps/maps.types';
import type { PlayableTeam } from '../teams/teams.types';
import { distance, distanceToPath } from '../utils/geometry';
import type { Vec2 } from '../utils/geometry.types';
import { FlowField } from './FlowField';
import { FlowFieldBuilder } from './FlowFieldBuilder';
import type { WorldMap } from './WorldMap';
import { CELL_EDGE_SLACK } from './WorldMap.constants';

/**
 * Every lane's flow field for each team (architecture 06 §6, 10 §9, FR-038): `numLanes` lanes
 * give `2 × numLanes` fields. A field's corridor is every cell within `corridorHalfWidth` of the
 * lane as its team walks it, plus the ground inside the team's wall ring, from the Stronghold out
 * to the gate (18 §3.2), less any walkable sliver the enemy end cannot reach at match start; it
 * flows to the lane's enemy end. All fields are built at match start;
 * after a terrain change `markDirty` queues the fields it touches and `rebuildDirty` rebuilds them
 * a cell budget per tick, each old field serving until its new one is finished.
 */
export class LaneFlowFields {
  /** Every field, by lane index, Light before Dark. */
  public readonly fields: readonly FlowField[];
  private readonly byLane = new Map<string, Readonly<Record<PlayableTeam, FlowField>>>();
  private readonly builder: FlowFieldBuilder;
  private readonly queue: FlowField[] = [];

  /**
   * Builds every field to completion.
   *
   * @param grid - The match's walkability grid.
   * @param map - The generated map: its lanes and the Strongholds.
   * @param corridorHalfWidth - How far from the lane, in world units, the corridor reaches.
   */
  public constructor(grid: WorldMap, map: MapDefinition, corridorHalfWidth: number) {
    this.builder = new FlowFieldBuilder(grid);
    const fields: FlowField[] = [];
    for (const lane of [...map.lanes].sort((a, b) => a.index - b.index)) {
      const light = LaneFlowFields.fieldOf(grid, map, lane, 'light', corridorHalfWidth);
      const dark = LaneFlowFields.fieldOf(grid, map, lane, 'dark', corridorHalfWidth);
      this.byLane.set(lane.id, { light, dark });
      fields.push(light, dark);
    }
    this.fields = fields;
    for (const field of fields) {
      this.builder.begin(field);
      this.builder.step(Number.POSITIVE_INFINITY);
      field.trimUnreached();
    }
  }

  /** How many fields wait for a rebuild, the one being rebuilt included. */
  public get pending(): number {
    return this.queue.length + (this.builder.isBusy ? 1 : 0);
  }

  /** The field `team` follows down `laneId`, or `undefined` for a lane the map does not have. */
  public field(laneId: string, team: PlayableTeam): FlowField | undefined {
    return this.byLane.get(laneId)?.[team];
  }

  /**
   * Queues for a rebuild every field whose corridor holds one of `cells` (the changed cells
   * `WorldMap.stampFootprint` and `clearFootprint` return). A field already queued stays in its
   * place; one being rebuilt is queued again, since its fill may have read the old cells.
   */
  public markDirty(cells: readonly number[]): void {
    for (const field of this.fields) {
      if (!this.queue.includes(field) && cells.some((cell) => field.mask[cell] === 1)) {
        this.queue.push(field);
      }
    }
  }

  /**
   * Rebuilds the queued fields in order, settling at most `cellBudget` cells this call, and
   * returns how many it settled. A field whose rebuild finishes is swapped in at once.
   */
  public rebuildDirty(cellBudget: number): number {
    let settled = 0;
    while (settled < cellBudget) {
      if (!this.builder.isBusy) {
        const next = this.queue.shift();
        if (next === undefined) {
          break;
        }
        this.builder.begin(next);
      }
      settled += this.builder.step(cellBudget - settled);
    }
    return settled;
  }

  private static fieldOf(
    grid: WorldMap,
    map: MapDefinition,
    lane: MapLane,
    team: PlayableTeam,
    corridorHalfWidth: number,
  ): FlowField {
    const path = team === 'light' ? lane.path : [...lane.path].reverse();
    const start = path[0] ?? { x: 0, y: 0 };
    const end = path[path.length - 1] ?? start;
    const home = map.features.find(
      (feature) => feature.kind === 'stronghold' && feature.team === team,
    )?.position;
    const mask = LaneFlowFields.corridorOf(grid, path, corridorHalfWidth, home, start);
    // Nudged back along the lane, so an end on a cell edge picks the cell its mirror twin picks.
    const before = path[path.length - 2] ?? end;
    const goal = grid.cellAt({
      x: end.x + (before.x - end.x) * CELL_EDGE_SLACK,
      y: end.y + (before.y - end.y) * CELL_EDGE_SLACK,
    });
    return new FlowField(
      grid,
      lane.id,
      team,
      mask,
      goal === null ? -1 : goal.row * grid.cols + goal.col,
    );
  }

  /** 1 for every cell whose centre lies near `path` or inside the home disc out to the gate. */
  private static corridorOf(
    grid: WorldMap,
    path: readonly Vec2[],
    halfWidth: number,
    home: Vec2 | undefined,
    gate: Vec2,
  ): Uint8Array {
    const mask = new Uint8Array(grid.cols * grid.rows);
    const homeRadius = home === undefined ? -1 : distance(home, gate);
    // Only the cells inside the bounding box of the lane band and the home disc can qualify.
    const reach = [...path, ...(home === undefined ? [] : [home])];
    const pad = Math.max(halfWidth, homeRadius);
    const cellOf = (value: number, cells: number): number =>
      Math.min(Math.max(Math.floor(value / grid.cellSize), 0), cells - 1);
    const firstCol = cellOf(Math.min(...reach.map(({ x }) => x)) - pad, grid.cols);
    const lastCol = cellOf(Math.max(...reach.map(({ x }) => x)) + pad, grid.cols);
    const firstRow = cellOf(Math.min(...reach.map(({ y }) => y)) - pad, grid.rows);
    const lastRow = cellOf(Math.max(...reach.map(({ y }) => y)) + pad, grid.rows);
    for (let row = firstRow; row <= lastRow; row += 1) {
      for (let col = firstCol; col <= lastCol; col += 1) {
        const centre = { x: (col + 0.5) * grid.cellSize, y: (row + 0.5) * grid.cellSize };
        const isHome = home !== undefined && distance(centre, home) <= homeRadius;
        if (isHome || distanceToPath(centre, path) <= halfWidth) {
          mask[row * grid.cols + col] = 1;
        }
      }
    }
    return mask;
  }
}

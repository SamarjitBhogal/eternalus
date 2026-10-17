import type { PlayableTeam } from '../teams/teams.types';
import { sqrt } from '../utils/deterministicMath';
import type { MutableVec2 } from '../utils/vec2.types';
import {
  DIRECTION_XS,
  DIRECTION_YS,
  LINE_STEP_FRACTION,
  NO_DIRECTION,
  UNREACHED,
} from './FlowField.constants';
import type { WorldMap } from './WorldMap';

/**
 * One lane's flow field for one team (architecture 06 §6, 10 §9): for every cell of the lane's
 * corridor, the octile path cost to the enemy end (`integration`) and the neighbour to step to
 * (`direction`, an index into `FlowField.constants`). Built and rebuilt by `FlowFieldBuilder` from
 * the `WorldMap`, never authored; the arrays are swapped in whole, so the field a reader sees is
 * always a finished one.
 */
export class FlowField {
  private cells: number;
  private integrationCells: Uint16Array;
  private directionCells: Int8Array;

  /**
   * @param grid - The walkability grid the field routes over.
   * @param laneId - The lane the field leads along.
   * @param team - The team walking it, toward the enemy end.
   * @param mask - 1 for every cell of the corridor, row-major like `grid.walkable`.
   * @param goal - The cell of the lane's enemy end.
   */
  public constructor(
    public readonly grid: WorldMap,
    public readonly laneId: string,
    public readonly team: PlayableTeam,
    public readonly mask: Uint8Array,
    public readonly goal: number,
  ) {
    this.cells = mask.reduce((sum, cell) => sum + cell, 0);
    this.integrationCells = new Uint16Array(mask.length).fill(UNREACHED);
    this.directionCells = new Int8Array(mask.length).fill(NO_DIRECTION);
  }

  /** Cells in the corridor mask, walkable or not. */
  public get cellCount(): number {
    return this.cells;
  }

  /** Path cost to the goal per cell (`UNREACHED` when there is no way). */
  public get integration(): Uint16Array {
    return this.integrationCells;
  }

  /** The direction index to step in per cell (`NO_DIRECTION` when there is none). */
  public get direction(): Int8Array {
    return this.directionCells;
  }

  /** Whether the field may route through `cell`: in the corridor and walkable now. */
  public isOpen(cell: number): boolean {
    return this.mask[cell] === 1 && this.grid.walkable[cell] === 1;
  }

  /**
   * Drops from the corridor every walkable cell the last build did not reach: slivers at the
   * band's edge whose only walkable neighbours lie outside it. Called once, after the first build.
   */
  public trimUnreached(): void {
    for (let cell = 0; cell < this.mask.length; cell += 1) {
      if (this.isOpen(cell) && this.integrationCells[cell] === UNREACHED) {
        this.mask[cell] = 0;
        this.cells -= 1;
      }
    }
  }

  /** Replaces both arrays with finished ones of the same size. Called by `FlowFieldBuilder`. */
  public adopt(integration: Uint16Array, direction: Int8Array): void {
    this.integrationCells = integration;
    this.directionCells = direction;
  }

  /**
   * Writes the field's unit direction at a world position into `out`, bilinearly interpolated
   * from the four surrounding cell centres (architecture 10 §9); cells without a direction are
   * left out, and where they cancel out the cell underfoot decides. Returns `false`, leaving
   * `out` as it was, where there is no direction.
   */
  public directionAt(x: number, y: number, out: MutableVec2): boolean {
    const { cellSize, cols, rows } = this.grid;
    const gridX = x / cellSize - 0.5;
    const gridY = y / cellSize - 0.5;
    const col = Math.floor(gridX);
    const row = Math.floor(gridY);
    const fracX = gridX - col;
    const fracY = gridY - row;
    let sumX = 0;
    let sumY = 0;
    for (let corner = 0; corner < 4; corner += 1) {
      const cornerCol = col + (corner & 1);
      const cornerRow = row + (corner >> 1);
      if (cornerCol < 0 || cornerRow < 0 || cornerCol >= cols || cornerRow >= rows) {
        continue;
      }
      const step = this.directionCells[cornerRow * cols + cornerCol] ?? NO_DIRECTION;
      if (step === NO_DIRECTION) {
        continue;
      }
      const weight =
        ((corner & 1) === 1 ? fracX : 1 - fracX) * (corner >> 1 === 1 ? fracY : 1 - fracY);
      sumX += (DIRECTION_XS[step] ?? 0) * weight;
      sumY += (DIRECTION_YS[step] ?? 0) * weight;
    }
    const size = sqrt(sumX * sumX + sumY * sumY);
    if (size === 0) {
      // A saddle, where the field splits around an obstacle: take the cell underfoot's way.
      const here = this.grid.cellAt({ x, y });
      const step =
        here === null
          ? NO_DIRECTION
          : (this.directionCells[here.row * cols + here.col] ?? NO_DIRECTION);
      if (step === NO_DIRECTION) {
        return false;
      }
      out.x = DIRECTION_XS[step] ?? 0;
      out.y = DIRECTION_YS[step] ?? 0;
      return true;
    }
    out.x = sumX / size;
    out.y = sumY / size;
    return true;
  }

  /**
   * Whether the first `maxDistance` of the straight line from `(fromX, fromY)` to `(toX, toY)`
   * crosses only walkable cells. The start itself is not checked, so a unit standing on a blocked
   * cell can still see open ground ahead. Allocates nothing.
   */
  public isLineClear(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    maxDistance: number,
  ): boolean {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const span = sqrt(dx * dx + dy * dy);
    const reach = Math.min(span, maxDistance);
    const stride = this.grid.cellSize * LINE_STEP_FRACTION;
    const steps = Math.ceil(reach / stride);
    for (let step = 1; step <= steps; step += 1) {
      const along = Math.min(step * stride, reach) / span;
      const col = Math.floor((fromX + dx * along) / this.grid.cellSize);
      const row = Math.floor((fromY + dy * along) / this.grid.cellSize);
      if (!this.grid.isWalkable(col, row)) {
        return false;
      }
    }
    return true;
  }
}

import { describe, expect, it } from 'vitest';

import { BLOCKED_LANE_MAP } from './__fixtures__/blockedLaneMap';
import { stampWalledCourt, WALLED_COURT } from './__fixtures__/walledCourt';
import { CourtExitField } from './CourtExitField';
import type { ExitWay } from './CourtExitField.types';
import { WorldMap } from './WorldMap';

/** An open 120 x 40 map on 2 m cells (60 columns) with `WALLED_COURT` stamped. */
const courtGrid = (): WorldMap => {
  const grid = WorldMap.fromDefinition({ ...BLOCKED_LANE_MAP, terrain: [] }, 2, () => false);
  stampWalledCourt(grid);
  return grid;
};
const cellOf = (col: number, row: number): number => row * 60 + col;

/** A search stub that answers `way` for every cell and counts its calls. */
const stubSearch = (way: ExitWay) => {
  const calls: number[] = [];
  const search = (cell: number, out: ExitWay): void => {
    calls.push(cell);
    out.next = way.next;
    out.end = way.end;
  };
  return { calls, search };
};

describe('CourtExitField (the way out of a court, kept per cell, DEC-235 (B1))', () => {
  it('answers nothing on open ground and searches nothing', () => {
    const { calls, search } = stubSearch({ next: cellOf(13, 10), end: cellOf(13, 10) });
    const field = new CourtExitField(courtGrid(), search);
    const out = { x: 0, y: 0 };

    expect(field.waypoint({ x: 5, y: 5 }, out)).toBe(false);
    expect(out).toEqual({ x: 0, y: 0 });
    expect(calls).toEqual([]);
  });

  it('searches a blocked cell once, heads for its next cell, and keeps the answer', () => {
    const { calls, search } = stubSearch({ next: cellOf(13, 10), end: cellOf(13, 10) });
    const field = new CourtExitField(courtGrid(), search);
    const out = { x: 0, y: 0 };

    expect(field.waypoint(WALLED_COURT.inside, out)).toBe(true);
    expect(out).toEqual({ x: 27, y: 21 });
    expect(field.waypoint({ x: 25.5, y: 20.5 }, out)).toBe(true);
    expect(calls).toEqual([cellOf(12, 10)]);
  });

  it('searches again once the grid changes (WorldMap.version)', () => {
    const grid = courtGrid();
    const { calls, search } = stubSearch({ next: cellOf(13, 10), end: cellOf(13, 10) });
    const field = new CourtExitField(grid, search);
    const out = { x: 0, y: 0 };
    field.waypoint(WALLED_COURT.inside, out);

    grid.clearFootprint(WALLED_COURT.walls[2]);
    field.waypoint(WALLED_COURT.inside, out);

    expect(calls).toEqual([cellOf(12, 10), cellOf(12, 10)]);
  });

  it('answers false, leaving out as it was, when the search found no way', () => {
    const { search } = stubSearch({ next: -1, end: -1 });
    const field = new CourtExitField(courtGrid(), search);
    const out = { x: 1, y: 2 };

    expect(field.waypoint(WALLED_COURT.inside, out)).toBe(false);
    expect(out).toEqual({ x: 1, y: 2 });
  });

  it('on a 2-step way heads for the open cell when it is in sight from where the walker stands, else for the next cell', () => {
    // Cell (18, 8): next is court cell (18, 9), the open cell is doorway cell (19, 9), centre (39, 19).
    const { calls, search } = stubSearch({ next: cellOf(18, 9), end: cellOf(19, 9) });
    const field = new CourtExitField(courtGrid(), search);
    const out = { x: 0, y: 0 };

    expect(field.waypoint({ x: 37.9, y: 17.9 }, out)).toBe(true);
    expect(out).toEqual({ x: 39, y: 19 });
    expect(field.waypoint({ x: 36.5, y: 16.5 }, out)).toBe(true);
    expect(out).toEqual({ x: 37, y: 19 });
    expect(calls).toHaveLength(1);
  });
});

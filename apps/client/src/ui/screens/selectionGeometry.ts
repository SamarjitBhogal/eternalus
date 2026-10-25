/**
 * Geometry shared by both selection rows (the class row of 62:125 and the Legend row of 58:271):
 * moving a frame point, the remainder past its integer floor, and the row plate a step draws.
 */
import type { RasterBox } from '../../bridge/catalogue.types';
import type { FramePoint, RowPlate } from './selectionGeometry.types';

/** `point` moved by `by`. */
export const offset = (point: FramePoint, by: FramePoint): FramePoint => ({
  x: point.x + by.x,
  y: point.y + by.y,
});

/** The remainder of `origin` past its integer floor, for `ArchCard`'s own `origin` (I-45). */
export function originRemainder(origin: FramePoint): FramePoint {
  return { x: origin.x - Math.floor(origin.x), y: origin.y - Math.floor(origin.y) };
}

/** The row plate to draw: its `url` at its `box` once both are known, else `null` (drawn live). */
export function rowPlateOf(url: string | null, box: RasterBox | null): RowPlate | null {
  return url === null || box === null ? null : { url, box };
}

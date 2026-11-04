/**
 * Geometry shared by both selection rows (the class row of 62:125 and the Legend row of 58:271):
 * moving a frame point, the remainder past its integer floor, the row plate a step draws, and the
 * px / `--art-*` inline variables both rows and the Legends strip write.
 */
import type { RasterBox } from '../../bridge/catalogue.types';
import type { FramePoint, RowPlate } from './selectionGeometry.types';

/** `point` moved by `by`. */
export const offset = (point: FramePoint, by: FramePoint): FramePoint => ({
  x: point.x + by.x,
  y: point.y + by.y,
});

/** Px to 4 decimals, finer than any Figma value they come from. */
export const px = (value: number): string => `${String(Number(value.toFixed(4)))}px`;

/** `--art-left/-top/-width/-height`: `box` relative to a root drawn at integer (`left`, `top`). */
export const artBoxVars = (
  box: RasterBox,
  left: number,
  top: number,
): Readonly<Record<`--${string}`, string>> => ({
  '--art-left': px(box.left - left),
  '--art-top': px(box.top - top),
  '--art-width': px(box.width),
  '--art-height': px(box.height),
});

/** The remainder of `origin` past its integer floor, for `ArchCard`'s own `origin` (I-45). */
export function originRemainder(origin: FramePoint): FramePoint {
  return { x: origin.x - Math.floor(origin.x), y: origin.y - Math.floor(origin.y) };
}

/** The row plate to draw: its `url` at its `box` once both are known, else `null` (drawn live). */
export function rowPlateOf(url: string | null, box: RasterBox | null): RowPlate | null {
  return url === null || box === null ? null : { url, box };
}

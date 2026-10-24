import type { RasterBox } from '../../bridge/catalogue.types';
import type { FramePoint } from './legendSelectLayout.types';

/**
 * How far, in px on either axis, a raster's integer box may sit from the origin of the node that
 * draws it and still count as baked there: its own floor (under 1 px), or the Figma's own slip
 * (61:14 sits 0.2 px off its copy's geometry, so its box is 1.19 px off the copy's art, CD-17).
 */
const BAKED_BOX_TOLERANCE = 2;

/**
 * Whether `box` was baked at `origin` (frame px), so its file may be drawn there unscaled. A
 * raster cut for one slot is drawn only at that slot: a reordered or re-laid-out row, and an
 * image with no box, draw the art live instead of a raster detached from its card.
 */
export function isBakedAt(box: RasterBox | null, origin: FramePoint): box is RasterBox {
  return (
    box !== null &&
    Math.abs(box.left - origin.x) < BAKED_BOX_TOLERANCE &&
    Math.abs(box.top - origin.y) < BAKED_BOX_TOLERANCE
  );
}

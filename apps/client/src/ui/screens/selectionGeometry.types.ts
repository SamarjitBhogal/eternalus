import type { RasterBox } from '../../bridge/catalogue.types';

/** A point in the 1920 × 1080 artboard's px (Figma frame px; may be fractional). */
export type FramePoint = { readonly x: number; readonly y: number };

/** A row plate ready to draw (the class row's or the Legend row's): its URL at its full box. */
export type RowPlate = { readonly url: string; readonly box: RasterBox };

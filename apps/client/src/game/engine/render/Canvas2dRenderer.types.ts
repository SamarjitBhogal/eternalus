import type { WorldPoint } from './Renderer.types';

/**
 * The parts of the Canvas 2D context the renderer uses. Keeping it this small lets tests
 * pass a fake context instead of a real canvas. Only `Canvas2dRenderer` holds one.
 */
export type DrawContext = Pick<
  CanvasRenderingContext2D,
  | 'beginPath'
  | 'closePath'
  | 'drawImage'
  | 'ellipse'
  | 'fill'
  | 'fillRect'
  | 'fillStyle'
  | 'lineJoin'
  | 'lineTo'
  | 'lineWidth'
  | 'moveTo'
  | 'rect'
  | 'stroke'
  | 'strokeRect'
  | 'strokeStyle'
>;

/** A rasterized immutable colour batch and its original world bounds. */
export type CachedSurface = {
  readonly image: OffscreenCanvas;
  readonly bounds: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
};

/** Raster cache for a static presentation layer at a particular viewport size. */
export type CachedLayer = {
  readonly image: OffscreenCanvas;
  readonly revision: number;
  readonly width: number;
  readonly height: number;
};

/** Traces one glyph's outline around a screen-space centre, given its half width and height. */
export type GlyphTracer = (center: WorldPoint, halfWidth: number, halfHeight: number) => void;

/** Half the width and height of a glyph on screen, in device pixels. */
export type GlyphHalfSize = { readonly width: number; readonly height: number };

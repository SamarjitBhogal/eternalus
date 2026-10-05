/**
 * The parts of the Canvas 2D context the renderer uses. Keeping it this small lets tests
 * pass a fake context instead of a real canvas.
 */
export type DrawContext = Pick<
  CanvasRenderingContext2D,
  | 'beginPath'
  | 'closePath'
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

/** A point in world units, as used by `@eternalus/core`. */
export type WorldPoint = { readonly x: number; readonly y: number };

/** A rectangle in screen pixels. `x`/`y` is the top-left corner. */
export type ScreenRect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** A rectangle in world units. `x`/`y` is the top-left corner. */
export type WorldRect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** The marker shapes the renderer can draw. `ring` is outlined; the others are filled. */
export type GlyphShape = 'dot' | 'square' | 'diamond' | 'ring';

/** A marker: its shape and its size (width and height). */
export type GlyphSpec = { readonly shape: GlyphShape; readonly size: number };

/** Traces one glyph's outline around a centre, with half its width and height. */
export type GlyphTracer = (
  context: DrawContext,
  center: WorldPoint,
  halfWidth: number,
  halfHeight: number,
) => void;

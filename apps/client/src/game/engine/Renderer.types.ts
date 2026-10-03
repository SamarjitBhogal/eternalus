/**
 * The parts of the Canvas 2D context the renderer uses. Keeping it this small lets tests
 * pass a fake context instead of a real canvas.
 */
export type DrawContext = Pick<
  CanvasRenderingContext2D,
  | 'beginPath'
  | 'closePath'
  | 'fill'
  | 'fillRect'
  | 'fillStyle'
  | 'lineJoin'
  | 'lineTo'
  | 'lineWidth'
  | 'moveTo'
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

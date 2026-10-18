import type { WorldPoint } from './Renderer.types';

/**
 * The parts of the Canvas 2D context the renderer uses. Keeping it this small lets tests
 * pass a fake context instead of a real canvas. Only `Canvas2dRenderer` holds one.
 */
export type DrawContext = Pick<
  CanvasRenderingContext2D,
  | 'beginPath'
  | 'clip'
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
  | 'restore'
  | 'save'
  | 'stroke'
  | 'strokeRect'
  | 'strokeStyle'
>;

/**
 * What `Canvas2dRenderer.fromCanvas` needs of a canvas: its 2D context. An `HTMLCanvasElement`
 * satisfies it; tests pass a fake.
 */
export type DrawSurface = { getContext(contextId: '2d'): DrawContext | null };

/** Traces one glyph's outline around a screen-space centre, given its half width and height. */
export type GlyphTracer = (center: WorldPoint, halfWidth: number, halfHeight: number) => void;

/** Half the width and height of a glyph on screen, in device pixels. */
export type GlyphHalfSize = { readonly width: number; readonly height: number };

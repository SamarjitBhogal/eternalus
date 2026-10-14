import type { GlyphShape } from './Renderer.types';

/** Glyph shapes drawn as an outline; every other shape is filled. */
export const OUTLINED_GLYPHS: ReadonlySet<GlyphShape> = new Set<GlyphShape>(['ring']);

/** Outline width of outlined glyphs, in CSS pixels. */
export const GLYPH_OUTLINE_WIDTH = 1.5;

/** One full turn in radians, for drawing whole ellipses. */
export const FULL_TURN = 2 * Math.PI;
/** Raster density for cached material detail at the default player view. */
export const SURFACE_PIXELS_PER_UNIT = 24;

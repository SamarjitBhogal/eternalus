import type { GlyphShape } from './Renderer.types';

/** Glyph shapes drawn as an outline; every other shape is filled. */
export const OUTLINED_GLYPHS: ReadonlySet<GlyphShape> = new Set<GlyphShape>(['ring']);

/** Outline width of outlined glyphs, in CSS pixels. */
export const GLYPH_OUTLINE_WIDTH = 1.5;

/** One full turn in radians, for drawing whole ellipses. */
export const FULL_TURN = 2 * Math.PI;

/** Maximum number of prepared destination-size frames per renderer. */
export const SPRITE_FRAME_CACHE_LIMIT = 360;

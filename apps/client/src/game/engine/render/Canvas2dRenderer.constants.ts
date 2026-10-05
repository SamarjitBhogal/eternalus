import type { GlyphShape, GlyphTracer } from './Renderer.types';

const FULL_TURN = 2 * Math.PI;

/** How each glyph shape is traced. A new shape is one entry here, never a branch in code. */
export const GLYPH_TRACERS: Readonly<Record<GlyphShape, GlyphTracer>> = {
  dot: (context, center, halfWidth, halfHeight) => {
    context.ellipse(center.x, center.y, halfWidth, halfHeight, 0, 0, FULL_TURN);
  },
  ring: (context, center, halfWidth, halfHeight) => {
    context.ellipse(center.x, center.y, halfWidth, halfHeight, 0, 0, FULL_TURN);
  },
  square: (context, center, halfWidth, halfHeight) => {
    context.rect(center.x - halfWidth, center.y - halfHeight, halfWidth * 2, halfHeight * 2);
  },
  diamond: (context, center, halfWidth, halfHeight) => {
    context.moveTo(center.x, center.y - halfHeight);
    context.lineTo(center.x + halfWidth, center.y);
    context.lineTo(center.x, center.y + halfHeight);
    context.lineTo(center.x - halfWidth, center.y);
    context.closePath();
  },
};

/** Glyph shapes drawn as an outline; every other shape is filled. */
export const OUTLINED_GLYPHS: ReadonlySet<GlyphShape> = new Set<GlyphShape>(['ring']);

/** Outline width of outlined glyphs, in CSS pixels. */
export const GLYPH_OUTLINE_WIDTH = 1.5;

import type { GlyphShape } from '../engine/render/Renderer.types';

/**
 * How a feature kind looks in the main view: a glyph `size` world units wide, or `footprint`
 * to fill the feature's own footprint polygon (walls and gates).
 */
export type FeatureStyle = { readonly shape: GlyphShape | 'footprint'; readonly size: number };

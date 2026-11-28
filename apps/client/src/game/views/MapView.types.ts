import type { GlyphShape } from '../engine/render/Renderer.types';

/**
 * How a feature kind looks in the main view: a glyph `size` world units wide, `footprint`
 * to fill the feature's own footprint polygon (walls and gates), or `entity` when its entity's view
 * draws it (lane towers, `StructureView`).
 */
export type FeatureStyle = {
  readonly shape: GlyphShape | 'footprint' | 'entity';
  readonly size: number;
};

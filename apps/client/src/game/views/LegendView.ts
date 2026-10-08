import type { Renderer } from '../engine/render/Renderer';
import type { GlyphSpec } from '../engine/render/Renderer.types';
import { DefaultEntityView } from './DefaultEntityView';
import type { EntityDrawState } from './EntityView.types';
import {
  LEGEND_OUTLINE_COLOR,
  LEGEND_OUTLINE_SCALE,
  MINIMAP_LEGEND_GLYPH,
} from './entityViews.constants';

/**
 * The placeholder look for Legends (the characters): the default disc with a white outline, so a
 * player stands out among mobs, and a bigger minimap dot. Final class art replaces it later.
 */
export class LegendView extends DefaultEntityView {
  /** Draws the white outline, then the team disc and focus ring on top. */
  public override draw(state: EntityDrawState, renderer: Renderer): void {
    const diameter = (state.entity.transform?.radius ?? 0) * 2;
    renderer.drawWorldGlyph(
      { shape: 'dot', size: diameter * LEGEND_OUTLINE_SCALE },
      state.position,
      LEGEND_OUTLINE_COLOR,
    );
    super.draw(state, renderer);
  }

  protected override minimapGlyph(): GlyphSpec {
    return MINIMAP_LEGEND_GLYPH;
  }
}

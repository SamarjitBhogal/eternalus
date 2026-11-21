import type { Renderer } from '../engine/render/Renderer';
import { DefaultEntityView } from './DefaultEntityView';
import type { EntityDrawState } from './EntityView.types';
import { drawFacingChevron } from './facingChevron';
import {
  LEGEND_OUTLINE_COLOR,
  LEGEND_OUTLINE_SCALE,
  MINI_MAP_LEGEND_GLYPH,
  MINI_MAP_LEGEND_LAYER,
} from './entityViews.constants';

/**
 * The placeholder look for Legends (the characters): the default disc with a white outline, so a
 * player stands out among mobs. Final class art replaces it later. On the mini map a Legend is a
 * large dot, drawn over the mobs' (DEC-187).
 */
export class LegendView extends DefaultEntityView {
  /** Legends' markers sit over the mobs'. */
  public readonly minimapLayer = MINI_MAP_LEGEND_LAYER;

  protected override readonly minimapGlyph = MINI_MAP_LEGEND_GLYPH;

  /** Draws the white outline and the facing chevron, then the team disc and focus ring on top. */
  public override draw(state: EntityDrawState, renderer: Renderer): void {
    const diameter = (state.entity.transform?.radius ?? 0) * 2;
    renderer.drawWorldGlyph(
      { shape: 'dot', size: diameter * LEGEND_OUTLINE_SCALE },
      state.position,
      LEGEND_OUTLINE_COLOR,
    );
    drawFacingChevron(state, renderer);
    super.draw(state, renderer);
  }
}

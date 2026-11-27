import { drawFacingChevron } from './facingChevron';
import type { Renderer } from '../engine/render/Renderer';
import { DefaultEntityView } from './DefaultEntityView';
import type { EntityDrawState } from './EntityView.types';
import {
  LEGEND_OUTLINE_COLOR,
  LEGEND_OUTLINE_SCALE,
  LEGEND_VISUAL_DIAMETER,
  LEGEND_FOCUS_RING_SCALE,
  FOCUS_RING_COLOR,
  MINI_MAP_LEGEND_GLYPH,
  MINI_MAP_LEGEND_LAYER,
} from './entityViews.constants';
import { withVisualRadius } from './entityVisualState';

/**
 * The placeholder look for Legends (the characters): the default disc with a white outline, so a
 * player stands out among mobs. Final class art replaces it later. On the mini map a Legend is a
 * large dot, drawn over the mobs' (DEC-187).
 */
export class LegendView extends DefaultEntityView {
  /** Legends' markers sit over the mobs'. */
  public readonly minimapLayer = MINI_MAP_LEGEND_LAYER;

  protected override readonly minimapGlyph = MINI_MAP_LEGEND_GLYPH;

  /** Returns the displayed Legend radius (DEC-238). */
  public visualRadiusOf(): number {
    return LEGEND_VISUAL_DIAMETER / 2;
  }

  /** Draws the white outline and the facing chevron, then the team disc and focus ring on top. */
  public override draw(state: EntityDrawState, renderer: Renderer): number | undefined {
    const visual = withVisualRadius(state, this.visualRadiusOf());
    const diameter = (visual.entity.transform?.radius ?? 0) * 2;
    renderer.drawWorldGlyph(
      { shape: 'dot', size: diameter * LEGEND_OUTLINE_SCALE },
      state.position,
      LEGEND_OUTLINE_COLOR,
    );
    drawFacingChevron(visual, renderer);
    super.draw({ ...visual, isFocused: false }, renderer);
    if (state.isFocused)
      renderer.drawWorldGlyph(
        { shape: 'ring', size: diameter * LEGEND_FOCUS_RING_SCALE },
        state.position,
        FOCUS_RING_COLOR,
      );
    return undefined;
  }
}

import type { Renderer } from '../engine/render/Renderer';
import { DefaultEntityView } from './DefaultEntityView';
import type { EntityDrawState } from './EntityView.types';
import {
  LEGEND_OUTLINE_COLOR,
  LEGEND_OUTLINE_SCALE,
  LEGEND_VISUAL_DIAMETER,
  LEGEND_FOCUS_RING_SCALE,
  FOCUS_RING_COLOR,
} from './entityViews.constants';
import { withVisualRadius } from './entityVisualState';
import { MINI_MAP_LEGEND_GLYPH, MINI_MAP_LEGEND_LAYER } from './entityViews.constants';

/**
 * The placeholder look for Legends (the characters): the default disc with a white outline, so a
 * player stands out among mobs. Final class art replaces it later. On the mini map a Legend is a
 * large dot, drawn over the mobs' (DEC-187).
 */
export class LegendView extends DefaultEntityView {
  /** Legends' markers sit over the mobs'. */
  public readonly minimapLayer = MINI_MAP_LEGEND_LAYER;

  protected override readonly minimapGlyph = MINI_MAP_LEGEND_GLYPH;

  /** Draws the white outline, then the team disc and focus ring on top. */
  public override draw(state: EntityDrawState, renderer: Renderer): void {
    const visual = withVisualRadius(state, LEGEND_VISUAL_DIAMETER / 2);
    const diameter = (visual.entity.transform?.radius ?? 0) * 2;
    renderer.drawWorldGlyph(
      { shape: 'dot', size: diameter * LEGEND_OUTLINE_SCALE },
      state.position,
      LEGEND_OUTLINE_COLOR,
    );
    super.draw({ ...visual, isFocused: false }, renderer);
    if (state.isFocused)
      renderer.drawWorldGlyph(
        { shape: 'ring', size: diameter * LEGEND_FOCUS_RING_SCALE },
        state.position,
        FOCUS_RING_COLOR,
      );
  }
}

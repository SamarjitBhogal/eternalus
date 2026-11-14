import type { Renderer } from '../engine/render/Renderer';
import { DefaultEntityView } from './DefaultEntityView';
import type { EntityDrawState } from './EntityView.types';
import { MOB_OUTLINE_COLOR, MOB_OUTLINE_SCALE, MOB_VISUAL_SCALE } from './entityViews.constants';
import { withVisualRadius } from './entityVisualState';
import { MINI_MAP_MOB_GLYPH } from './entityViews.constants';

/**
 * The placeholder look for mobs (minions, camp units): the default disc on a dark outline, so a
 * mob stays visible over ground painted in its own team's colour. Final mob art replaces it. On
 * the mini map a mob is a small dot (DEC-187).
 */
export class MobView extends DefaultEntityView {
  protected override readonly minimapGlyph = MINI_MAP_MOB_GLYPH;

  /** Draws the dark outline, then the team disc and focus ring on top. */
  public override draw(state: EntityDrawState, renderer: Renderer): void {
    const visual = withVisualRadius(
      state,
      (state.entity.transform?.radius ?? 0) * MOB_VISUAL_SCALE,
    );
    const diameter = (visual.entity.transform?.radius ?? 0) * 2;
    renderer.drawWorldGlyph(
      { shape: 'dot', size: diameter * MOB_OUTLINE_SCALE },
      state.position,
      MOB_OUTLINE_COLOR,
    );
    super.draw(visual, renderer);
  }
}

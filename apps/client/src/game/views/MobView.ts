import type { Renderer } from '../engine/render/Renderer';
import { DefaultEntityView } from './DefaultEntityView';
import type { EntityDrawState } from './EntityView.types';
import { MOB_OUTLINE_COLOR, MOB_OUTLINE_SCALE } from './entityViews.constants';

/**
 * The placeholder look for mobs (minions, camp units): the default disc on a dark outline, so a
 * mob stays visible over ground painted in its own team's colour. Final mob art replaces it.
 */
export class MobView extends DefaultEntityView {
  /** Draws the dark outline, then the team disc and focus ring on top. */
  public override draw(state: EntityDrawState, renderer: Renderer): void {
    const diameter = (state.entity.transform?.radius ?? 0) * 2;
    renderer.drawWorldGlyph(
      { shape: 'dot', size: diameter * MOB_OUTLINE_SCALE },
      state.position,
      MOB_OUTLINE_COLOR,
    );
    super.draw(state, renderer);
  }
}

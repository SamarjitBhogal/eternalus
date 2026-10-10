import type { Renderer } from '../engine/render/Renderer';
import type { EntityDrawState, EntityView } from './EntityView.types';
import { FOCUS_RING_COLOR, FOCUS_RING_SCALE, NEUTRAL_ENTITY_COLOR } from './entityViews.constants';
import { TEAM_COLORS } from './MapView.constants';

/**
 * The view for any entity without a view of its own: a disc of its footprint radius in its
 * team's colour, and a ring when the player controls it.
 */
export class DefaultEntityView implements EntityView {
  /** Draws the team-coloured disc, and the focus ring when focused. */
  public draw({ entity, position, isFocused }: EntityDrawState, renderer: Renderer): void {
    const diameter = (entity.transform?.radius ?? 0) * 2;
    renderer.drawWorldGlyph({ shape: 'dot', size: diameter }, position, this.colorOf(entity.team));
    if (isFocused) {
      renderer.drawWorldGlyph(
        { shape: 'ring', size: diameter * FOCUS_RING_SCALE },
        position,
        FOCUS_RING_COLOR,
      );
    }
  }

  /** The colour of `team`, or the neutral colour for no team or `neutral`. */
  protected colorOf(team: EntityDrawState['entity']['team']): string {
    return team === null || team === 'neutral' ? NEUTRAL_ENTITY_COLOR : TEAM_COLORS[team];
  }
}

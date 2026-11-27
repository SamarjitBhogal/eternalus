import type { Renderer } from '../engine/render/Renderer';
import type { GlyphSpec } from '../engine/render/Renderer.types';
import type { EntityDrawState, EntityView } from './EntityView.types';
import {
  FOCUS_RING_COLOR,
  FOCUS_RING_SCALE,
  MINI_MAP_OUTLINE_COLORS,
  MINI_MAP_OUTLINE_WIDTH,
  NEUTRAL_ENTITY_COLOR,
} from './entityViews.constants';
import { TEAM_COLORS } from './MapView.constants';

/**
 * The view for any entity without a view of its own: a disc of its footprint radius in its
 * team's colour, and a ring when the player controls it. It has no mini map marker; a subclass
 * that sets `minimapGlyph` gets one.
 */
export class DefaultEntityView implements EntityView {
  /** The marker on the mini map, or `null` for none (only Legends and mobs have one, DEC-187). */
  protected readonly minimapGlyph: GlyphSpec | null = null;

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

  /**
   * Draws `minimapGlyph` in the team's colour on its team outline (13 §7: never colour alone);
   * draws nothing without a glyph.
   */
  public drawMinimap({ entity, position }: EntityDrawState, renderer: Renderer): void {
    const glyph = this.minimapGlyph;
    if (glyph === null) return;
    const outline = { shape: glyph.shape, size: glyph.size + MINI_MAP_OUTLINE_WIDTH * 2 };
    renderer.drawGlyph(outline, position, MINI_MAP_OUTLINE_COLORS[entity.team ?? 'neutral']);
    renderer.drawGlyph(glyph, position, this.colorOf(entity.team));
  }

  /** The colour of `team`, or the neutral colour for no team or `neutral`. */
  protected colorOf(team: EntityDrawState['entity']['team']): string {
    return team === null || team === 'neutral' ? NEUTRAL_ENTITY_COLOR : TEAM_COLORS[team];
  }
}

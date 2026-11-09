import type { Renderer } from '../engine/render/Renderer';
import type { EntityDrawState, EntityView } from './EntityView.types';
import { LegendView } from './LegendView';
import { KNIGHT_ATLAS, KNIGHT_ROWS } from './KnightAnimation.constants';
import type { KnightAtlas, KnightPose } from './KnightAnimation.types';
import { TEAM_COLORS } from './MapView.constants';

/** Replaces the controlled hero only; other heroes retain their registered appearance. */
export class PlayerKnightView implements EntityView {
  private readonly fallback = new LegendView();

  /** Takes decoded art and animation samples without owning loading or time. */
  public constructor(
    private readonly atlas: () => KnightAtlas | null,
    private readonly pose: () => KnightPose,
  ) {}

  /** Paints a team ring and one strictly cropped, feet-anchored frame. */
  public draw(state: EntityDrawState, renderer: Renderer): void {
    const atlas = this.atlas();
    if (!state.isFocused || atlas === null) {
      this.fallback.draw(state, renderer);
      return;
    }
    const { row, frame } = this.pose();
    const crop = KNIGHT_ROWS[row] ?? KNIGHT_ROWS[0];
    const scaleX = atlas.width / KNIGHT_ATLAS.width;
    const scaleY = atlas.height / KNIGHT_ATLAS.height;
    const height = ((crop.bottom - crop.top) / KNIGHT_ATLAS.stride) * KNIGHT_ATLAS.size;
    renderer.drawWorldGlyph(
      { shape: 'ring', size: 4.8 },
      state.position,
      state.entity.team === 'dark' ? TEAM_COLORS.dark : TEAM_COLORS.light,
    );
    renderer.drawSprite({
      image: atlas.image,
      source: {
        x: (KNIGHT_ATLAS.left + frame * KNIGHT_ATLAS.stride) * scaleX,
        y: crop.top * scaleY,
        width: KNIGHT_ATLAS.stride * scaleX,
        height: (crop.bottom - crop.top) * scaleY,
      },
      destination: {
        x: state.position.x - KNIGHT_ATLAS.size / 2,
        y: state.position.y - ((crop.foot - crop.top) / KNIGHT_ATLAS.stride) * KNIGHT_ATLAS.size,
        width: KNIGHT_ATLAS.size,
        height,
      },
    });
  }
}

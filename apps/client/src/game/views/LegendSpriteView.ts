import type { EntitySnapshot } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import { FOCUS_RING_COLOR } from './entityViews.constants';
import type { EntityDrawState } from './EntityView.types';
import { drawFacingChevron } from './facingChevron';
import { LEGEND_SPRITE_RING_SCALE } from './LegendSpriteView.constants';
import type { LegendSpriteSource } from './LegendSpriteView.types';
import { LegendView } from './LegendView';

/**
 * Draws a Legend as an atlas sprite with its feet on the entity's position: the view passes only
 * the position and the width, and the renderer stands the sprite on its feet (the sheet's own
 * data; DEC-398, card PR170 (8)). The frame comes from the draw state's frame time (DEC-398, card
 * PR170 (12)). A Legend that has no sprite this frame (no sheet, an atlas that did not load, or
 * dead) keeps the ordinary Legend view. Each Legend is decided on its own (DEC-378 (2)).
 */
export class LegendSpriteView extends LegendView {
  /** @param sprites - Each Legend's sprite size and frame (`LegendSprites`). */
  public constructor(private readonly sprites: LegendSpriteSource) {
    super();
  }

  /** Draws the sprite, then its team ring, its facing chevron and, when focused, the focus ring. */
  public override draw(state: EntityDrawState, renderer: Renderer): void {
    const { position, entity, isFocused, frameTick } = state;
    const size = this.sprites.sizeOf(entity);
    const frame = size === null ? null : this.sprites.frameOf(entity, frameTick);
    if (size === null || frame === null) {
      super.draw(state, renderer);
      return;
    }
    renderer.drawSprite(frame, position, size.width);
    const ring = { shape: 'ring', size: size.width * LEGEND_SPRITE_RING_SCALE } as const;
    renderer.drawWorldGlyph(ring, position, this.colorOf(entity.team));
    drawFacingChevron(state, renderer);
    if (isFocused) {
      renderer.drawWorldGlyph({ shape: 'ring', size: size.width }, position, FOCUS_RING_COLOR);
    }
  }

  /**
   * The click area: half the sprite's width (DEC-424; the Warrior's 5.2 m sprite keeps DEC-238's
   * 2.6 m). A Legend without a sprite, and `LegendView`'s own draw (no entity), give
   * `LegendView`'s radius.
   */
  public override visualRadiusOf(entity?: EntitySnapshot): number {
    const size = entity === undefined ? null : this.sprites.sizeOf(entity);
    return size === null ? super.visualRadiusOf() : size.width / 2;
  }

  /**
   * How far the sprite's top stands above the entity's position, so the health bar sits above
   * the sprite. A Legend without a sprite gives `LegendView`'s radius.
   */
  public visualTopOf(state: EntityDrawState): number {
    return this.sprites.sizeOf(state.entity)?.top ?? super.visualRadiusOf();
  }
}

import type { EntitySnapshot } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import { FOCUS_RING_COLOR } from './entityViews.constants';
import type { EntityDrawState } from './EntityView.types';
import { drawFacingChevron } from './facingChevron';
import { LEGEND_SPRITE_RING_SCALE } from './LegendSpriteView.constants';
import type { LegendSpriteFrame } from './LegendSpriteView.types';
import { LegendView } from './LegendView';

/**
 * Draws a Legend as an atlas sprite with its feet on the entity's position: the view passes only
 * the position and the width, and the renderer stands the sprite on its feet (the sheet's own
 * data; DEC-398, card PR170 (8)). A Legend that has no sprite this frame (`spriteOf` gives
 * `null`: no sheet, an atlas that did not load, or dead) keeps the ordinary Legend view. Each
 * Legend is decided on its own (DEC-378 (2)).
 */
export class LegendSpriteView extends LegendView {
  /**
   * @param spriteOf - The sprite to draw for an entity (its frame and its top above the feet), or
   *   `null` for the ordinary Legend view.
   * @param width - The sprite's width in world units; the cells are square, so also its height.
   */
  public constructor(
    private readonly spriteOf: (entity: EntitySnapshot) => LegendSpriteFrame | null,
    private readonly width: number,
  ) {
    super();
  }

  /** Draws the sprite, then its team ring, its facing chevron and, when focused, the focus ring. */
  public override draw(state: EntityDrawState, renderer: Renderer): void {
    const { position, entity, isFocused } = state;
    const sprite = this.spriteOf(entity);
    if (sprite === null) {
      super.draw(state, renderer);
      return;
    }
    renderer.drawSprite(sprite.frame, position, this.width);
    const ring = { shape: 'ring', size: this.width * LEGEND_SPRITE_RING_SCALE } as const;
    renderer.drawWorldGlyph(ring, position, this.colorOf(entity.team));
    drawFacingChevron(state, renderer);
    if (isFocused) {
      renderer.drawWorldGlyph({ shape: 'ring', size: this.width }, position, FOCUS_RING_COLOR);
    }
  }

  /**
   * How far the sprite's top stands above the entity's position, so the health bar sits above
   * the sprite. A Legend that this view draws without a sprite gives `LegendView`'s radius. The
   * click area stays `LegendView`'s `visualRadiusOf` (DEC-238).
   */
  public visualTopOf(entity: EntitySnapshot): number {
    const sprite = this.spriteOf(entity);
    return sprite === null ? this.visualRadiusOf() : sprite.top;
  }
}

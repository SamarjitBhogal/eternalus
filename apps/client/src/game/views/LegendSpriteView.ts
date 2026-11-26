import type { EntitySnapshot } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import type { SpriteRef } from '../engine/render/Renderer.types';
import { FOCUS_RING_COLOR } from './entityViews.constants';
import type { EntityDrawState } from './EntityView.types';
import { drawFacingChevron } from './facingChevron';
import { LEGEND_SPRITE_RING_SCALE } from './LegendSpriteView.constants';
import { LegendView } from './LegendView';

/**
 * Draws the player's Legend as an atlas sprite with its feet on the entity's position; every
 * other Legend (`frameOf` gives `null`) keeps the ordinary Legend view. The match registers it
 * only when the renderer holds the player's atlas.
 */
export class LegendSpriteView extends LegendView {
  /**
   * @param frameOf - The frame to draw for an entity, or `null` for the ordinary Legend view.
   * @param width - The sprite's width in world units; the cells are square, so also its height.
   * @param groundOffset - The feet's height above the cell's bottom edge, as a share of the
   *   cell's height (the sheet's `groundOffset`, given by the composition root).
   */
  public constructor(
    private readonly frameOf: (entity: EntitySnapshot) => SpriteRef | null,
    private readonly width: number,
    private readonly groundOffset: number,
  ) {
    super();
  }

  /** Draws the sprite, then its team ring, its facing chevron and, when focused, the focus ring. */
  public override draw(state: EntityDrawState, renderer: Renderer): void {
    const { position, entity, isFocused } = state;
    const frame = this.frameOf(entity);
    if (frame === null) {
      super.draw(state, renderer);
      return;
    }
    const anchor = { x: position.x, y: position.y + this.width * this.groundOffset };
    renderer.drawSprite(frame, anchor, this.width);
    const ring = { shape: 'ring', size: this.width * LEGEND_SPRITE_RING_SCALE } as const;
    renderer.drawWorldGlyph(ring, position, this.colorOf(entity.team));
    drawFacingChevron(state, renderer);
    if (isFocused) {
      renderer.drawWorldGlyph({ shape: 'ring', size: this.width }, position, FOCUS_RING_COLOR);
    }
  }

  /**
   * How far the sprite's top stands above the entity's position, so the health bar sits above
   * the sprite; the footprint radius for a Legend this view draws without a sprite.
   */
  public visualRadiusOf(entity: EntitySnapshot): number {
    return this.frameOf(entity) === null
      ? (entity.transform?.radius ?? 0)
      : this.width * (1 - this.groundOffset);
  }
}

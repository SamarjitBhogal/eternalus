import type { EntitySnapshot } from '@eternalus/core';
import type { Renderer } from '../engine/render/Renderer';
import type { SpriteRef } from '../engine/render/Renderer.types';
import { LegendView } from './LegendView';
import type { EntityDrawState } from './EntityView.types';
import { drawFacingChevron } from './facingChevron';
import { drawSwingWedge } from './swingWedge';
import { FOCUS_RING_COLOR } from './entityViews.constants';

import {
  MAGUS_ATLAS_IDS,
  MAGUS_GROUND_OFFSET,
  REPACKED_GROUND_OFFSET,
  RING_SCALE,
} from './LegendSpriteView.constants';

/** Draws the selected Legend's sprite and falls back to the ordinary Legend view. */
export class LegendSpriteView extends LegendView {
  /** Receives presentation frames and their world size. */
  public constructor(
    private readonly frameOf: (entity: EntitySnapshot) => SpriteRef | null,
    private readonly size: number,
  ) {
    super();
  }

  /** Draws the swing wedge (DEC-304) under a sprite, its team marker, facing and focus. */
  public override draw(state: EntityDrawState, renderer: Renderer): number | undefined {
    const { position, entity, isFocused } = state;
    const frame = this.frameOf(entity);
    const groundOffset = MAGUS_ATLAS_IDS.has(frame?.atlasId ?? '')
      ? MAGUS_GROUND_OFFSET
      : REPACKED_GROUND_OFFSET;
    const feet = { x: position.x, y: position.y + this.size * groundOffset };
    drawSwingWedge(state, renderer);
    if (frame === null || !renderer.drawSprite(frame, feet, this.size)) {
      this.drawBody(state, renderer);
      return undefined;
    }
    const size = this.size * RING_SCALE;
    renderer.drawWorldGlyph({ shape: 'ring', size }, position, this.colorOf(entity.team));
    drawFacingChevron(state, renderer);
    if (isFocused)
      renderer.drawWorldGlyph({ shape: 'ring', size: this.size }, position, FOCUS_RING_COLOR);
    return this.size * (1 - groundOffset);
  }
}

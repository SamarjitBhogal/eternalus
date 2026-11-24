import type { EntitySnapshot } from '@eternalus/core';
import type { Renderer } from '../engine/render/Renderer';
import type { SpriteRef } from '../engine/render/Renderer.types';
import { RANGED_LEGEND_SKINS } from '../LegendAnimation.constants';
import { LegendView } from './LegendView';
import type { EntityDrawState } from './EntityView.types';
import { drawFacingChevron } from './facingChevron';
import { FOCUS_RING_COLOR } from './entityViews.constants';

const MAGUS_GROUND_OFFSET = 0.35;
const REPACKED_GROUND_OFFSET = 9 / 128;
const MAGUS_ATLAS_IDS = new Set([...RANGED_LEGEND_SKINS].map((spec) => spec + '-sprites'));
const RING_SCALE = 0.55;

/** Draws the selected Legend's sprite and falls back to the ordinary Legend view. */
export class LegendSpriteView extends LegendView {
  /** Receives presentation frames and their world size. */
  public constructor(
    private readonly frameOf: (entity: EntitySnapshot) => SpriteRef | null,
    private readonly size: number,
  ) {
    super();
  }

  /** Draws a sprite, its team marker, facing and focus. */
  public override draw(state: EntityDrawState, renderer: Renderer): number | undefined {
    const { position, entity, isFocused } = state;
    const frame = this.frameOf(entity);
    const groundOffset = MAGUS_ATLAS_IDS.has(frame?.atlasId ?? '')
      ? MAGUS_GROUND_OFFSET
      : REPACKED_GROUND_OFFSET;
    const feet = { x: position.x, y: position.y + this.size * groundOffset };
    if (frame === null || !renderer.drawSprite(frame, feet, this.size)) {
      super.draw(state, renderer);
      return;
    }
    const size = this.size * RING_SCALE;
    renderer.drawWorldGlyph({ shape: 'ring', size }, position, this.colorOf(entity.team));
    drawFacingChevron(state, renderer);
    if (isFocused)
      renderer.drawWorldGlyph({ shape: 'ring', size: this.size }, position, FOCUS_RING_COLOR);
    return this.size * (1 - groundOffset);
  }
}

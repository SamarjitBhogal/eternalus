import type { EntitySnapshot } from '@eternalus/core';

import type { SpriteRef } from '../engine/render/Renderer.types';

/** One Legend's sprite size, in world units. */
export type LegendSpriteSize = {
  /** The sprite's width. */
  readonly width: number;
  /**
   * How far the sprite's top stands above the feet (`Renderer.spriteTop`: the sheet's own data),
   * so the health bar sits above the sprite.
   */
  readonly top: number;
};

/** What a `LegendSpriteView` asks about a Legend; `LegendSprites` answers. */
export interface LegendSpriteSource {
  /** The Legend's sprite size, or `null` when it has no sprite (no sheet, or its atlas did not load). */
  sizeOf(entity: EntitySnapshot): LegendSpriteSize | null;
  /**
   * The frame the Legend draws at `frameTick` (the draw state's frame time), or `null` for the
   * ordinary Legend view (no sprite, or dead).
   */
  frameOf(entity: EntitySnapshot, frameTick: number): SpriteRef | null;
}

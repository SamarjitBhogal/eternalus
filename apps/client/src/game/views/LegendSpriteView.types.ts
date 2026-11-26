import type { SpriteRef } from '../engine/render/Renderer.types';

/** One Legend's sprite this frame: the atlas frame to draw and where the feet stand in its cell. */
export type LegendSpriteFrame = {
  readonly frame: SpriteRef;
  /**
   * The feet's height above the cell's bottom edge, as a share of the cell's height (the
   * Legend's sheet's `groundOffset`). The cells are square, so it is also a share of the width.
   */
  readonly groundOffset: number;
};

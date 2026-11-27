import type { SpriteRef } from '../engine/render/Renderer.types';

/** One Legend's sprite this frame: the atlas frame to draw and how far its top stands above the feet. */
export type LegendSpriteFrame = {
  readonly frame: SpriteRef;
  /**
   * How far the sprite's top stands above the feet, in world units (`Renderer.spriteTop`: the
   * sheet's own data), so the health bar sits above the sprite.
   */
  readonly top: number;
};

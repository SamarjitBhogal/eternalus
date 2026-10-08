import type { Renderer } from '../engine/render/Renderer';

/**
 * Anything that draws itself in world units: the map, obstacles, units, effects.
 * Every layer in the scene shows up in both the main view and the mini map.
 */
export interface WorldLayer {
  /** Draws this layer for the main view, in world units. */
  draw(renderer: Renderer): void;
  /** Draws this layer for the mini map: the same things, as minimap markers. */
  drawMinimap(renderer: Renderer): void;
}

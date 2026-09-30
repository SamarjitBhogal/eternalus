import type { Renderer } from '../engine/Renderer';

/**
 * Anything that draws itself in world units: the map, obstacles, units, effects.
 * Every layer in the scene shows up in both the main view and the mini map.
 */
export interface WorldLayer {
  /** Draws this layer through the renderer, in world units. */
  draw(renderer: Renderer): void;
}

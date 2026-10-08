import type { Renderer } from '../engine/render/Renderer';
import type { WorldLayer } from './SceneView.types';

/**
 * The single place that decides draw order. Layers are drawn in list order, so later layers
 * appear on top. The main view and the mini map both draw this same scene, so any layer added
 * here (for example obstacles) appears in both with no other code change.
 */
export class SceneView implements WorldLayer {
  private readonly layers: readonly WorldLayer[];

  /** Creates a scene from layers, listed bottom first. */
  public constructor(layers: readonly WorldLayer[]) {
    this.layers = layers;
  }

  /** Draws every layer for the main view, bottom first. */
  public draw(renderer: Renderer): void {
    for (const layer of this.layers) {
      layer.draw(renderer);
    }
  }

  /** Draws every layer for the mini map, bottom first. */
  public drawMinimap(renderer: Renderer): void {
    for (const layer of this.layers) {
      layer.drawMinimap(renderer);
    }
  }
}

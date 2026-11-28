import type { WorldPoint } from '../engine/render/Renderer.types';

/** The point `alpha` of the way from `from` to `to` (08 §8: views draw `prev + (current - prev) × alpha`). */
export function lerpPoint(from: WorldPoint, to: WorldPoint, alpha: number): WorldPoint {
  return { x: from.x + (to.x - from.x) * alpha, y: from.y + (to.y - from.y) * alpha };
}

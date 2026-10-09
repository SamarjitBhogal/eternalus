import type { WorldPoint } from '../render/Renderer.types';
import type { ScreenPoint } from './InputDevice.types';

/**
 * Turns a point on the canvas into a point in the world (architecture 08 §5). The match's camera
 * provides it, so input never needs to know about cameras or screen sizes.
 */
export interface Projection {
  /** The world point under a canvas point (CSS pixels). */
  screenToWorld(point: ScreenPoint): WorldPoint;
}

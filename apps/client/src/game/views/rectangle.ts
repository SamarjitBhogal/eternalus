import type { WorldPoint } from '../engine/render/Renderer.types';

/** The four corners of a rectangle, clockwise from its top-left corner `(x, y)`. */
export const rectangle = (x: number, y: number, width: number, height: number): WorldPoint[] => [
  { x, y },
  { x: x + width, y },
  { x: x + width, y: y + height },
  { x, y: y + height },
];

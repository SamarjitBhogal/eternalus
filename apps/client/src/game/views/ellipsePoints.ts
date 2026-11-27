import type { WorldPoint } from '../engine/render/Renderer.types';

/**
 * The corners of an ellipse, for `Renderer.fillPolygon`: `segments` points evenly spaced by angle
 * from the +x axis, on the ellipse with the given radii around `centre` (world units). Equal radii
 * give a circle. The `Renderer` has no oval of its own, so views build one as a polygon.
 */
export const ellipsePoints = (
  centre: WorldPoint,
  radiusX: number,
  radiusY: number,
  segments: number,
): WorldPoint[] =>
  Array.from({ length: segments }, (_, corner) => {
    const angle = (2 * Math.PI * corner) / segments;
    return {
      x: centre.x + radiusX * Math.cos(angle),
      y: centre.y + radiusY * Math.sin(angle),
    };
  });

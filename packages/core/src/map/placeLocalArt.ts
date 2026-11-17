import type { MapDecoration } from '../content/maps/maps.types';
import type { Vec2 } from '../utils/geometry.types';
/**
 * Places camp polygons with an explicit flip flag. `mirrorWidth` retains canonical reflection
 * arithmetic: simplifying it to origin.x - dx changes floating-point coordinates and hashes.
 */
export const placeLocalArt = (
  pieces: readonly MapDecoration[],
  origin: Vec2,
  scale: number,
  isFlipped: boolean,
  mirrorWidth = 0,
): readonly MapDecoration[] =>
  pieces.map((piece) => ({
    ...piece,
    shape: piece.shape.map((point) => ({
      x: isFlipped
        ? mirrorWidth - (mirrorWidth - origin.x + point.x * scale)
        : origin.x + point.x * scale,
      y: origin.y + point.y * scale,
    })),
  }));

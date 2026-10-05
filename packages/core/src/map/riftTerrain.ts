import { lerpPoint } from '../utils/geometry';
import type { Polygon, Vec2 } from '../utils/geometry.types';

/** Smallest rift piece worth keeping, in world units; thinner slivers are dropped. */
const MIN_PIECE_HEIGHT = 1;

/** The centre line's x at height `y` (the line runs top to bottom). */
export const centrelineXAtY = (centreline: readonly Vec2[], y: number): number => {
  const index = centreline.findIndex(
    (point, i) => y >= point.y && y <= (centreline[i + 1]?.y ?? point.y),
  );
  const from = centreline[Math.max(index, 0)] ?? { x: 0, y };
  const to = centreline[Math.max(index, 0) + 1] ?? from;
  return to.y === from.y ? from.x : lerpPoint(from, to, (y - from.y) / (to.y - from.y)).x;
};

/** One strip of rift between heights `top` and `bottom`, `halfWidth` either side of the line. */
const riftStrip = (
  centreline: readonly Vec2[],
  top: number,
  bottom: number,
  halfWidth: number,
): Polygon => {
  const heights = [
    top,
    ...centreline.map((point) => point.y).filter((y) => y > top && y < bottom),
    bottom,
  ];
  const centre = heights.map((y) => ({ x: centrelineXAtY(centreline, y), y }));
  return [
    ...centre.map((point) => ({ x: point.x - halfWidth, y: point.y })),
    ...centre.reverse().map((point) => ({ x: point.x + halfWidth, y: point.y })),
  ];
};

/**
 * The rift as strips along its centre line, with a gap `bridgeWidth` tall wherever a lane
 * crosses (at each height in `crossings`). The gaps are where the bridges go.
 */
export const carveRift = (
  centreline: readonly Vec2[],
  crossings: readonly number[],
  size: { readonly height: number; readonly halfWidth: number; readonly bridgeWidth: number },
): readonly Polygon[] => {
  const gaps = [...crossings].sort((a, b) => a - b);
  const edges = [
    0,
    ...gaps.flatMap((y) => [y - size.bridgeWidth / 2, y + size.bridgeWidth / 2]),
    size.height,
  ];
  const pieces: Polygon[] = [];
  for (let index = 0; index < edges.length; index += 2) {
    const top = Math.max(edges[index] ?? 0, 0);
    const bottom = Math.min(edges[index + 1] ?? size.height, size.height);
    if (bottom - top >= MIN_PIECE_HEIGHT) {
      pieces.push(riftStrip(centreline, top, bottom, size.halfWidth));
    }
  }
  return pieces;
};

/** A straight rift down the middle of the world, used when no preset shapes it. */
export const defaultCentreline = (width: number, height: number): readonly Vec2[] => [
  { x: width / 2, y: 0 },
  { x: width / 2, y: height },
];

/** Two corner triangles on the west edge, used when no preset shapes the bounds. */
export const defaultWestBounds = (cornerSize: number, height: number): readonly Polygon[] => [
  [
    { x: 0, y: 0 },
    { x: cornerSize, y: 0 },
    { x: 0, y: cornerSize },
  ],
  [
    { x: 0, y: height },
    { x: 0, y: height - cornerSize },
    { x: cornerSize, y: height },
  ],
];

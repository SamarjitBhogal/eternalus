import type { RiftWidthKnot } from '../content/maps/maps.types';
import type { Polygon } from '../utils/geometry.types';

/** Smallest rift piece worth keeping, in world units; thinner slivers are dropped. */
const MIN_PIECE_HEIGHT = 1;

/** The world the rift is carved into, and how wide each lane's bridge gap is. */
export type RiftArea = {
  readonly width: number;
  readonly height: number;
  readonly bridgeWidth: number;
};

/** The rift's half-width at height `y` (world units), interpolated between knots. */
const riftHalfWidthAt = (profile: readonly RiftWidthKnot[], y: number): number => {
  const index = profile.findIndex((knot, i) => y >= knot.y && y <= (profile[i + 1]?.y ?? knot.y));
  const from = profile[Math.max(index, 0)];
  const to = profile[Math.max(index, 0) + 1] ?? from;
  if (from === undefined || to === undefined || to.y === from.y) {
    return from?.halfWidth ?? 0;
  }
  return from.halfWidth + ((y - from.y) / (to.y - from.y)) * (to.halfWidth - from.halfWidth);
};

/** One strip of rift between two heights, centred on the symmetry axis (self-mirroring). */
const riftStrip = (
  profile: readonly RiftWidthKnot[],
  centreX: number,
  heights: { readonly top: number; readonly bottom: number },
): Polygon => {
  const ys = [
    heights.top,
    ...profile.map((knot) => knot.y).filter((y) => y > heights.top && y < heights.bottom),
    heights.bottom,
  ];
  return [
    ...ys.map((y) => ({ x: centreX - riftHalfWidthAt(profile, y), y })),
    ...[...ys].reverse().map((y) => ({ x: centreX + riftHalfWidthAt(profile, y), y })),
  ];
};

/**
 * The rift as strips along the symmetry axis, `profile` wide (heights in world units), with a
 * gap `bridgeWidth` tall wherever a lane crosses (at each height in `crossings`). The gaps are
 * where the bridges go. Every strip mirrors onto itself, so the map stays symmetric.
 */
export const carveRift = (
  profile: readonly RiftWidthKnot[],
  crossings: readonly number[],
  area: RiftArea,
): readonly Polygon[] => {
  const gaps = [...crossings].sort((a, b) => a - b);
  const edges = [
    0,
    ...gaps.flatMap((y) => [y - area.bridgeWidth / 2, y + area.bridgeWidth / 2]),
    area.height,
  ];
  const pieces: Polygon[] = [];
  for (let index = 0; index < edges.length; index += 2) {
    const top = Math.max(edges[index] ?? 0, 0);
    const bottom = Math.min(edges[index + 1] ?? area.height, area.height);
    if (bottom - top >= MIN_PIECE_HEIGHT) {
      pieces.push(riftStrip(profile, area.width / 2, { top, bottom }));
    }
  }
  return pieces;
};

/** A rift of constant half-width, used when no preset shapes it (heights as fractions). */
export const defaultRiftProfile = (halfWidth: number): readonly RiftWidthKnot[] => [
  { y: 0, halfWidth },
  { y: 1, halfWidth },
];

/** Two corner triangles on the west edge (world units), used when no preset shapes the bounds. */
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

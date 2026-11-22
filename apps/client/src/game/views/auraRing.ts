import type { WorldPoint, WorldRect } from '../engine/render/Renderer.types';
import type { AuraRing } from './auraRing.types';

/** A quarter turn, in radians: the arc of one rounded corner. */
const QUARTER_TURN = Math.PI / 2;

/**
 * The outline of the ground within `radius` of `box` (DEC-323 (3)): the box grown by `radius`,
 * each corner rounded by an arc of that radius about the box's corner, drawn with
 * `cornerSegments` straight pieces. It runs clockwise on screen (y down) from the bottom end of
 * the right edge and is closed. A box of no size gives a circle of `radius` about its corner.
 */
export const auraRing = (box: WorldRect, radius: number, cornerSegments: number): AuraRing => {
  const right = box.x + box.width;
  const bottom = box.y + box.height;
  // Each corner's centre and the angle its arc starts at (y down: a quarter turn is south).
  const corners = [
    { x: right, y: bottom, from: 0 },
    { x: box.x, y: bottom, from: QUARTER_TURN },
    { x: box.x, y: box.y, from: 2 * QUARTER_TURN },
    { x: right, y: box.y, from: 3 * QUARTER_TURN },
  ];
  const outline = corners.flatMap(({ x, y, from }) =>
    Array.from({ length: cornerSegments + 1 }, (_, step) => {
      const angle = from + (QUARTER_TURN * step) / cornerSegments;
      return { x: x + radius * Math.cos(angle), y: y + radius * Math.sin(angle) };
    }),
  );
  const points = [...outline, ...outline.slice(0, 1)];
  let walked = 0;
  const lengths = points.map((point, index) => {
    const before = points[index - 1];
    walked += before === undefined ? 0 : Math.hypot(point.x - before.x, point.y - before.y);
    return walked;
  });
  return { points, lengths, perimeter: walked };
};

/**
 * The point `distance` along `ring` from its first point, going round as often as needed (a
 * negative distance goes back). The first point for a ring of no length.
 */
export const pointOnRing = (ring: AuraRing, distance: number): WorldPoint => {
  const { points, lengths, perimeter } = ring;
  const first = points[0] ?? { x: 0, y: 0 };
  if (!(perimeter > 0)) return first;
  const along = ((distance % perimeter) + perimeter) % perimeter;
  for (let index = 1; index < points.length; index += 1) {
    const end = lengths[index] ?? perimeter;
    if (along < end) {
      const start = lengths[index - 1] ?? 0;
      const from = points[index - 1] ?? first;
      const to = points[index] ?? first;
      const share = (along - start) / (end - start);
      return { x: from.x + (to.x - from.x) * share, y: from.y + (to.y - from.y) * share };
    }
  }
  return first;
};

import type { Vec2 } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import {
  AIM_CIRCLE_SEGMENTS,
  AIM_OVERLAY_FILL_COLOR,
  AIM_OVERLAY_OUTLINE_COLOR,
  AIM_OVERLAY_OUTLINE_WIDTH,
} from './AimOverlayView.constants';
import type { ShapePainters } from './AimOverlayView.types';
import { ellipsePoints } from './ellipsePoints';

/** Fills a closed outline and strokes it. */
function paint(corners: readonly Vec2[], renderer: Renderer): void {
  const [first] = corners;
  if (first === undefined) return;
  renderer.fillPolygon(corners, AIM_OVERLAY_FILL_COLOR);
  renderer.strokePath([...corners, first], AIM_OVERLAY_OUTLINE_COLOR, AIM_OVERLAY_OUTLINE_WIDTH);
}

/**
 * The painters of the range overlay, one per shape kind (05 §3, §15): a circle on the frame's
 * circle centre, a path as the rectangle the dash sweeps (the dash's length by the path's width).
 * A `hit` shape (a status's on-hit step, Fury) is never aimed, so it draws nothing.
 */
export const AIM_SHAPE_PAINTERS: ShapePainters = {
  hit: () => undefined,
  circle: ({ radius }, { circleCentre }, renderer) => {
    paint(ellipsePoints(circleCentre, radius, radius, AIM_CIRCLE_SEGMENTS), renderer);
  },
  path: ({ width }, { origin, direction, pathLength }, renderer) => {
    if (pathLength === null || (direction.x === 0 && direction.y === 0)) return;
    const half = { x: (-direction.y * width) / 2, y: (direction.x * width) / 2 };
    const end = { x: origin.x + direction.x * pathLength, y: origin.y + direction.y * pathLength };
    paint(
      [
        { x: origin.x + half.x, y: origin.y + half.y },
        { x: end.x + half.x, y: end.y + half.y },
        { x: end.x - half.x, y: end.y - half.y },
        { x: origin.x - half.x, y: origin.y - half.y },
      ],
      renderer,
    );
  },
};

import type { Vec2 } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import {
  AIM_CIRCLE_SEGMENTS,
  AIM_OVERLAY_FILL_COLOR,
  AIM_OVERLAY_OUTLINE_COLOR,
  AIM_OVERLAY_OUTLINE_WIDTH,
} from './AimOverlayView.constants';
import type { ShapePainters } from './AimOverlayView.types';

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
 */
export const AIM_SHAPE_PAINTERS: ShapePainters = {
  circle: ({ radius }, { circleCentre }, renderer) => {
    paint(
      Array.from({ length: AIM_CIRCLE_SEGMENTS }, (_, corner) => {
        const angle = (2 * Math.PI * corner) / AIM_CIRCLE_SEGMENTS;
        return {
          x: circleCentre.x + radius * Math.cos(angle),
          y: circleCentre.y + radius * Math.sin(angle),
        };
      }),
      renderer,
    );
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

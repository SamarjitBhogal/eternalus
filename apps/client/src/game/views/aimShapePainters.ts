import type { Vec2 } from '@eternalus/core';

import type { Renderer } from '../engine/render/Renderer';
import {
  AIM_CIRCLE_SEGMENTS,
  AIM_CONE_CIRCLE_COLORS,
  AIM_CONE_FAN_COLORS,
  AIM_FULL_TURN_DEGREES,
  AIM_OVERLAY_COLORS,
  AIM_OVERLAY_OUTLINE_WIDTH,
  AIM_REFUSED_COLORS,
} from './AimOverlayView.constants';
import type { AimAreaColors, ShapePainters } from './AimOverlayView.types';

/** Fills a closed outline and strokes it, in `colors`. */
function paint(
  corners: readonly Vec2[],
  renderer: Renderer,
  colors: AimAreaColors = AIM_OVERLAY_COLORS,
): void {
  const [first] = corners;
  if (first === undefined) return;
  renderer.fillPolygon(corners, colors.fill);
  renderer.strokePath([...corners, first], colors.outline, AIM_OVERLAY_OUTLINE_WIDTH);
}

/** The corners of an arc of `radius` around `centre`, from angle `from` over `sweep` radians. */
function arcCorners(centre: Vec2, radius: number, from: number, sweep: number): Vec2[] {
  const segments = Math.max(1, Math.ceil((AIM_CIRCLE_SEGMENTS * Math.abs(sweep)) / (2 * Math.PI)));
  const isClosed = Math.abs(sweep) >= 2 * Math.PI;
  return Array.from({ length: isClosed ? segments : segments + 1 }, (_, corner) => {
    const angle = from + (sweep * corner) / segments;
    return { x: centre.x + radius * Math.cos(angle), y: centre.y + radius * Math.sin(angle) };
  });
}

/**
 * The painters of the range overlay, one per shape kind (05 §3, §15): a circle on the frame's
 * circle centre, a path as the rectangle the dash sweeps (the dash's length by the path's width),
 * a cone as its fan from the caster toward the pointer in darker blue, or, at a full turn, the
 * circle of its range in lighter blue (DEC-206 (3)); a cone's reach counts from the caster's body
 * edge (DEC-319). An `outline` is the body a step places (Shield Wall), drawn where it will stand:
 * its middle the outline's distance ahead of the caster toward the pointer, turned to face the
 * pointer as core's `placePolygon` turns it, in the refused colours where the cast is refused
 * (`AimFrame.isRefused`); nothing with the pointer on the caster. A `hit` shape
 * (a status's on-hit step, Fury, or a shot's, Hamstring) is never aimed, so it draws nothing.
 */
export const AIM_SHAPE_PAINTERS: ShapePainters = {
  hit: () => undefined,
  circle: ({ radius }, { circleCentre }, renderer) => {
    paint(arcCorners(circleCentre, radius, 0, 2 * Math.PI), renderer);
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
  outline: ({ corners, distance }, { origin, direction, isRefused }, renderer) => {
    if (direction.x === 0 && direction.y === 0) return;
    const centre = { x: origin.x + direction.x * distance, y: origin.y + direction.y * distance };
    paint(
      corners.map(({ x, y }) => ({
        x: centre.x + x * direction.x - y * direction.y,
        y: centre.y + x * direction.y + y * direction.x,
      })),
      renderer,
      isRefused ? AIM_REFUSED_COLORS : AIM_OVERLAY_COLORS,
    );
  },
  cone: ({ reach, arcDegrees }, { origin, casterRadius, direction }, renderer) => {
    const radius = casterRadius + reach;
    if (arcDegrees >= AIM_FULL_TURN_DEGREES) {
      paint(arcCorners(origin, radius, 0, 2 * Math.PI), renderer, AIM_CONE_CIRCLE_COLORS);
      return;
    }
    if (direction.x === 0 && direction.y === 0) return;
    const sweep = (arcDegrees * Math.PI) / 180;
    const from = Math.atan2(direction.y, direction.x) - sweep / 2;
    paint([origin, ...arcCorners(origin, radius, from, sweep)], renderer, AIM_CONE_FAN_COLORS);
  },
};

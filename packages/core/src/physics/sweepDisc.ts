import type { Vec2 } from '../utils/geometry.types';
import { endpointContact } from './sweepCircle';

/**
 * The earliest share (0 to 1) of `delta` at which a circle of `radius` moving from `start` touches
 * a disc of `discRadius` centred on `centre`: 0 when they already overlap at `start`, `null` when
 * the move never reaches it. A moving circle touches a disc when its centre is `radius +
 * discRadius` from the disc's centre, so this is the point contact `sweepCircle` uses at corners.
 */
export const sweepDisc = (
  start: Vec2,
  delta: Vec2,
  radius: number,
  centre: Vec2,
  discRadius: number,
): number | null => {
  const reach = radius + discRadius;
  const dx = start.x - centre.x;
  const dy = start.y - centre.y;
  if (dx * dx + dy * dy <= reach * reach) return 0;
  return endpointContact(start, delta, reach, centre)?.time ?? null;
};

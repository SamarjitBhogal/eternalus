import { distance } from '../utils/geometry';
import type { Vec2 } from '../utils/geometry.types';

/**
 * Where a target at `position`, moving at `velocity`, stands after a shot from `origin` at `speed`
 * flies to `through`: `position + velocity × (|through − origin| / speed)`. Any length unit, as
 * long as `velocity` and `speed` share their time unit (metres per tick in the simulation).
 * `delay` is added to the flight time (the ticks a shot waits before it moves).
 */
const lead = (
  origin: Vec2,
  position: Vec2,
  velocity: Vec2,
  speed: number,
  delay: number,
  through: Vec2,
): Vec2 => {
  const time = distance(origin, through) / speed + delay;
  return { x: position.x + velocity.x * time, y: position.y + velocity.y * time };
};

/**
 * The point to shoot at so that a shot from `origin` at `speed` meets a target at `position` moving
 * at a constant `velocity` (architecture 11 §4.5): `aimPoint = targetPos + targetVel × (distance /
 * projectileSpeed)`, then one refinement with the distance to that first point. Vectors only: no
 * angles, no `atan2`, so it is the same on every engine (11 §5). A still target is its own aim
 * point. Pure.
 *
 * @param speed - The shot's speed, in the time unit of `velocity`; must be positive.
 * @param delay - Ticks between this aim and the shot's first move, added to its flight time (an
 *   arc shot lands at its aim point, so the lead must cover them); 0 for a shot that sweeps.
 */
export const predictiveAim = (
  origin: Vec2,
  position: Vec2,
  velocity: Vec2,
  speed: number,
  delay = 0,
): Vec2 =>
  lead(
    origin,
    position,
    velocity,
    speed,
    delay,
    lead(origin, position, velocity, speed, delay, position),
  );

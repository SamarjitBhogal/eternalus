import type { GameState } from '../state/GameState';
import { cos, sin } from '../utils/deterministicMath';
import type { Vec2 } from '../utils/geometry.types';

/**
 * Where a guard of `body` radius stands for the post at `turn` on the `ring` around `home`: the
 * ring point if it is clear, else the first clear point straight out from it up to the leash
 * `edge`, else the nearest clear point around a ring, inner rings first (a fort's walls reach
 * past its structure's collider, 07 §6). Steps are one body radius, along the ray and of arc: a
 * gap the guard fits through is two radii wide, so no step skips one, even where the leash span
 * is shorter than a nav cell (a camp's). Clear means walkable on the nav grid and outside every
 * blocking map object and every `keepOut` circle (by the body's radius); when nothing inside the
 * leash is, the search runs again on the objects and circles alone, since the grid blocks every cell a footprint touches (a camp fire's 8 m stone fills 5 m
 * cells past a 7 m leash). A post with nothing clear even then keeps the ring point.
 *
 * @remarks ponytail: a linear scan once per post at load-in; a fort-aware ring (posts laid out
 * from the fort's footprint) replaces it if posts must look even around every fort.
 */
export const clearGuardPost = (
  state: GameState,
  home: Vec2,
  turn: number,
  ring: number,
  edge: number,
  body: number,
  keepOut: readonly { readonly center: Vec2; readonly radius: number }[] = [],
): Vec2 => {
  const at = (radius: number, angle: number): Vec2 => ({
    x: home.x + radius * cos(angle),
    y: home.y + radius * sin(angle),
  });
  const grid = state.world?.grid;
  const isOutsideObjects = (point: Vec2): boolean =>
    (state.worldObjects?.blockingAt(point, body) ?? null) === null &&
    keepOut.every(
      ({ center, radius }) =>
        (point.x - center.x) ** 2 + (point.y - center.y) ** 2 > (radius + body) ** 2,
    );
  const isClear = (point: Vec2): boolean =>
    (grid?.isWalkableAt(point.x, point.y) ?? true) && isOutsideObjects(point);
  const step = body > 0 ? body : (grid?.cellSize ?? edge);
  const search = (isOpen: (point: Vec2) => boolean): Vec2 | null => {
    for (let radius = ring; radius <= edge; radius += step) {
      if (isOpen(at(radius, turn))) return at(radius, turn);
    }
    for (let radius = ring; radius <= edge; radius += step) {
      for (let arc = step; arc <= Math.PI * radius; arc += step) {
        for (const angle of [turn + arc / radius, turn - arc / radius]) {
          if (isOpen(at(radius, angle))) return at(radius, angle);
        }
      }
    }
    return null;
  };
  return search(isClear) ?? search(isOutsideObjects) ?? at(ring, turn);
};

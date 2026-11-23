import { Transform } from '../components/Transform';
import type { EntityId } from '../state/EntityStore.types';
import { sqrt } from '../utils/deterministicMath';
import type { BossMoveLanding } from './BossMoveSystem.types';

/**
 * The units of `landing` whose centres lie on the strip from the boss along its facing: at most
 * `length` ahead (none behind) and within `width / 2` of the strip's line, in id order.
 */
export const unitsAlong = (
  { state, at, facing, unitsWithin }: BossMoveLanding,
  length: number,
  width: number,
): EntityId[] =>
  unitsWithin(length + width / 2).filter((id) => {
    const position = state.entities.get(id)?.findComponent(Transform)?.position;
    if (position === undefined) return false;
    const dx = position.x - at.x;
    const dy = position.y - at.y;
    const ahead = dx * facing.x + dy * facing.y;
    const aside = dx * facing.y - dy * facing.x;
    return ahead >= 0 && ahead <= length && Math.abs(aside) <= width / 2;
  });

/**
 * `length`, cut to where the boss's line along its facing leaves its zone (its guard post's
 * circle), so a strip move never reaches out of the zone (FR-045). Uncut off a post.
 */
export const reachInZone = (
  { state, bossId, at, facing }: BossMoveLanding,
  length: number,
): number => {
  const post = state.guards.slotOf(bossId);
  if (post === undefined) return length;
  const radius = post.homeRadius + post.leashRadius;
  const ox = at.x - post.homeX;
  const oy = at.y - post.homeY;
  // |at + t·facing − home| = radius: t = −b + √(b² − c), with b = o·facing and c = |o|² − r².
  const b = ox * facing.x + oy * facing.y;
  const c = ox * ox + oy * oy - radius * radius;
  const edge = -b + sqrt(Math.max(0, b * b - c));
  return Math.max(0, Math.min(length, edge));
};

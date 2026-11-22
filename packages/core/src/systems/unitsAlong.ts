import { Transform } from '../components/Transform';
import type { EntityId } from '../state/EntityStore.types';
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

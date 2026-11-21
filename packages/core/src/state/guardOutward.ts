import type { MutableVec2 } from '../utils/vec2.types';
import type { GuardSlot } from './GuardStore.types';

/**
 * Writes into `out` the way a guard on `post` faces on guard: out from its home's centre through
 * its post, of any length (a tower guard DEC-216 (6), a camp mob DEC-220 (2)). A guard spawns
 * facing it (`GuardRoster`) and turns back to it at its post (`PathingSystem`, DEC-220 (3)).
 *
 * @returns `out`, so nothing allocates.
 */
export const guardOutward = (
  { postX, postY, homeX, homeY }: Pick<GuardSlot, 'postX' | 'postY' | 'homeX' | 'homeY'>,
  out: MutableVec2,
): MutableVec2 => {
  out.x = postX - homeX;
  out.y = postY - homeY;
  return out;
};

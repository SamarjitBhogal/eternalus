import type { FormationDefinition } from '../content/mobs/formations/formations.types';
import type { Vec2 } from '../utils/geometry.types';
import type { MutableVec2 } from '../utils/vec2.types';

/**
 * Where one member of a horde stands (architecture 18 §5.1): the leader (`follower` −1) on the
 * anchor; follower `i` in rank `floor(i / ranksWidth) + 1` behind it and file
 * `i % ranksWidth − (ranksWidth − 1) / 2` across, `slotSpacing` apart. Vectors only (ADR 0012).
 *
 * @param anchor - The formation anchor on the lane.
 * @param forward - The lane's unit direction at the anchor.
 * @param follower - The member's index in `memberIds` with the leader left out; −1 for the leader.
 * @param out - Written and returned, so nothing allocates.
 */
export const formationSlot = (
  anchor: Vec2,
  forward: Vec2,
  follower: number,
  formation: FormationDefinition,
  out: MutableVec2,
): MutableVec2 => {
  if (follower < 0) {
    out.x = anchor.x;
    out.y = anchor.y;
    return out;
  }
  const back = (Math.floor(follower / formation.ranksWidth) + 1) * formation.slotSpacing;
  const across =
    ((follower % formation.ranksWidth) - (formation.ranksWidth - 1) / 2) * formation.slotSpacing;
  // `right` is `forward` turned a quarter: (-forward.y, forward.x).
  out.x = anchor.x - forward.x * back - forward.y * across;
  out.y = anchor.y - forward.y * back + forward.x * across;
  return out;
};

/**
 * A member's `follower` index for `formationSlot`: its place in `memberIds` with the leader left
 * out, or −1 for the leader (architecture 18 §5.1). Every member counts, whether or not it moves
 * this tick, so one member's state never shifts another's slot.
 */
export const followerIndex = (
  memberIds: readonly string[],
  leaderId: string,
  id: string,
): number => {
  if (id === leaderId) {
    return -1;
  }
  let ahead = 0;
  for (const member of memberIds) {
    if (member === id) {
      break;
    }
    ahead += member === leaderId ? 0 : 1;
  }
  return ahead;
};

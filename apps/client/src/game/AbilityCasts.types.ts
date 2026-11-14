import type { InputIntent, Vec2 } from '@eternalus/core';

/** What `AbilityCasts.apply` reads from one tick of the player's intent. */
export type CastInput = {
  /** The ability and gadget slots pressed this tick (`InputIntent.triggered`). */
  readonly triggered: InputIntent['triggered'];
  /** The world point under the pointer, or `null` while there is none. */
  readonly aim: Vec2 | null;
  /** Whether the main button is held and no canvas gesture owns it (`PlayerCommands`). */
  readonly isAttacking: boolean;
};

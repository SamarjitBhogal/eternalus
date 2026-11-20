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

/** What `AbilityCasts` asks the match about the ability a slot holds now. */
export type CastSlots = {
  /**
   * Whether the ability in `slot` reads the aim (`AbilityDisplay.usesAim`). `true` for a slot with
   * no known ability, so it takes the usual aimed paths.
   */
  readonly usesAim: (slot: CastInput['triggered'][number]) => boolean;
  /** Where the player's Legend stands in the latest snapshot, or `null` before it spawns. */
  readonly legendAt: () => Vec2 | null;
};

import type { Vec2 } from '@eternalus/core';

import type { InputAction } from '../../bridge/Binding.types';

/** The actions active this frame. `pressed` and `released` are the edges since the last frame. */
export type ActionState = {
  readonly held: ReadonlySet<InputAction>;
  readonly pressed: ReadonlySet<InputAction>;
  readonly released: ReadonlySet<InputAction>;
};

/** The actions that cast an ability or gadget; their ids equal the ability slot names. */
export type CastSlot = Extract<InputAction, `ability-${string}` | `gadget-${string}`>;

/**
 * What the player wants this frame, with no key names in it (architecture 11 §4.1, 13 §6.2).
 * TODO(sam): replace with the `InputIntent` exported by `@eternalus/core` once it exists.
 */
export type InputIntent = {
  /** Movement direction, screen axes (y down), length 1 on diagonals; zero when idle. */
  readonly move: Vec2;
  /** Where the pointer is in the world, or `null` when it is off the canvas. */
  readonly aim: Vec2 | null;
  /** Attack was pressed this frame. */
  readonly attack: boolean;
  /** The ability or gadget pressed this frame (the first in slot order if several were). */
  readonly cast: CastSlot | null;
  /** Sprint is held. */
  readonly isSprinting: boolean;
  /** Interact (pick up, drop, enter a turret) was pressed this frame. */
  readonly interact: boolean;
  /** Turret control toggle was pressed this frame. */
  readonly turretToggle: boolean;
  /** Turret ammo switch was pressed this frame. */
  readonly turretAmmo: boolean;
};

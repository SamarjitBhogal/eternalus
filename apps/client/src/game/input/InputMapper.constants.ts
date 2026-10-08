import type { AbilitySlot } from '@eternalus/core';

import type { InputAction } from '../../bridge/Binding.types';

/** How each movement action pushes the move vector (screen axes: y grows downwards). */
export const MOVE_AXES: readonly (readonly [InputAction, number, number])[] = [
  ['move-up', 0, -1],
  ['move-down', 0, 1],
  ['move-left', -1, 0],
  ['move-right', 1, 0],
];

/** The actions that cast from an ability bar slot; their ids equal the slot ids (13 §6.1). */
export const SLOT_ACTIONS: readonly (InputAction & AbilitySlot)[] = [
  'ability-1',
  'ability-2',
  'ability-3',
  'ability-4',
  'gadget-1',
  'gadget-2',
];

/** `PointerEvent.buttons` bit of each mouse chord button (0 left, 1 middle, 2 right, 3 back, 4 forward). */
export const MOUSE_BUTTON_BITS: readonly number[] = [1, 4, 2, 8, 16];

import type { AbilitySlot } from '@eternalus/core';

import type { ChordModifier, InputAction } from '../../bridge/Binding.types';
import type { KeyPress } from './InputMapper.types';

/** The actions that cast from an ability bar slot; their ids equal the slot ids (13 §6.1). */
export const CAST_SLOTS: readonly (InputAction & AbilitySlot)[] = [
  'ability-1',
  'ability-2',
  'ability-3',
  'ability-4',
  'gadget-1',
  'gadget-2',
];

/** Each chord modifier and the `KeyPress` flag that says it is held. */
export const MODIFIER_FLAGS: readonly (readonly [ChordModifier, keyof Omit<KeyPress, 'code'>])[] = [
  ['Alt', 'altKey'],
  ['Control', 'ctrlKey'],
  ['Meta', 'metaKey'],
  ['Shift', 'shiftKey'],
];

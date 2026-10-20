import type { AbilitySlot } from '@eternalus/core';

import type { InputAction } from '../../bridge/Binding.types';

/** The actions that cast from an ability bar slot; their ids equal the slot ids (13 §6.1). */
export const CAST_SLOTS: readonly (InputAction & AbilitySlot)[] = [
  'ability-1',
  'ability-2',
  'ability-3',
  'ability-4',
  'gadget-1',
  'gadget-2',
];

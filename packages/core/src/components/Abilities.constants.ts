import type { AbilitySlot } from '../content/abilities/AbilityDefinition.types';

/** Every bar slot in bar order (05 §15): the kit's abilities, the ultimate, the gadgets, the default action. */
export const ABILITY_SLOTS: readonly AbilitySlot[] = [
  'ability-1',
  'ability-2',
  'ability-3',
  'ability-4',
  'gadget-1',
  'gadget-2',
  'default-action',
];

/** The slot that holds the ultimate (DEC-209 (2): key 4). */
export const ULTIMATE_SLOT: AbilitySlot = 'ability-4';

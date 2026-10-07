import type { CastSlot } from './InputMapper.types';

/** Cast slots in priority order, for the rare frame where two are pressed together. */
export const CAST_SLOTS: readonly CastSlot[] = [
  'ability-1',
  'ability-2',
  'ability-3',
  'ability-4',
  'gadget-1',
  'gadget-2',
];

import type { AbilitySlot } from '@eternalus/core';

/** The largest client message the server reads, in UTF-16 code units (ADR 0016 point 7). */
export const MAX_CLIENT_MESSAGE_LENGTH = 1024;

/** The highest `intent.seq` accepted: JSON numbers stay exact up to here. */
export const MAX_INTENT_SEQ = Number.MAX_SAFE_INTEGER;

/** Every `AbilitySlot`, so a remote `triggered` list is checked against the union at run time. */
export const ABILITY_SLOTS: ReadonlySet<AbilitySlot> = new Set<AbilitySlot>([
  'ability-1',
  'ability-2',
  'ability-3',
  'ability-4',
  'gadget-1',
  'gadget-2',
  'default-action',
]);

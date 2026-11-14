import type { InputIntent } from '@eternalus/core';

/** The intent of a player holding nothing: sent when input is released while no tick will send one. */
export const NEUTRAL_INTENT: InputIntent = {
  isAttacking: false,
  move: { x: 0, y: 0 },
  aim: null,
  triggered: [],
};

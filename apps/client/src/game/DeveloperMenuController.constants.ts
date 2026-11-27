import type { ControllerId } from '@eternalus/core';

/**
 * The controller ids sim mode sends in `dev-set-controller` (architecture 11 §2, core's
 * `CONTROLLER_IDS`): the human's, and the two bots' a developer can pick (the Rover's and the lane
 * bot's, DEC-356). Typed as core's `ControllerId`, so a renamed id fails the typecheck here
 * instead of being refused at runtime.
 */
export const SIM_MODE_CONTROLLER_IDS = {
  player: 'player',
  rover: 'rover',
  laner: 'bot-legend',
} as const satisfies Readonly<Record<'player' | 'rover' | 'laner', ControllerId>>;

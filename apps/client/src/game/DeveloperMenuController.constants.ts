import type { ControllerId } from '@eternalus/core';

/**
 * The controller ids sim mode sends in `dev-set-controller` (architecture 11 §2, core's
 * `CONTROLLER_IDS`): the human's and the Rover's. Typed as core's `ControllerId`, so a renamed id
 * fails the typecheck here instead of being refused at runtime.
 */
export const SIM_MODE_CONTROLLER_IDS = {
  player: 'player',
  rover: 'rover',
} as const satisfies Readonly<Record<'player' | 'rover', ControllerId>>;

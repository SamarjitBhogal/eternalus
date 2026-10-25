import type { ControllerId } from './ai.types';

/** Every controller id, to check a spawn's controller at runtime (architecture 11 §2). */
export const CONTROLLER_IDS: readonly ControllerId[] = [
  'player',
  'bot-legend',
  'minion',
  'guard',
  'turret',
  'boss',
  'rover',
];

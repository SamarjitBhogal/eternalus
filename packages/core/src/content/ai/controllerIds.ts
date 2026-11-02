/**
 * Every controller id (architecture 11 §2), kebab-case and never renamed once used. The one
 * source: `ControllerId` is derived from it, and spawns are checked against it at runtime.
 */
export const CONTROLLER_IDS = [
  'player',
  'bot-legend',
  'minion',
  'guard',
  'turret',
  'boss',
  'rover',
] as const;

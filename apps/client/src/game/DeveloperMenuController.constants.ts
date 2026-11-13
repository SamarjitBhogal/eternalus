import type { DeveloperMenuOption } from '../bridge/developerMenu.types';

/**
 * The mobs the developer menu can spawn as a horde: the three lane minions (architecture 18 §3).
 * `DeveloperMenuController.test.ts` spawns each one in a real simulation, so a renamed content id
 * fails there.
 */
export const DEVELOPER_MOBS: readonly DeveloperMenuOption[] = [
  { id: 'light-minion', label: 'Light Minion' },
  { id: 'medium-minion', label: 'Medium Minion' },
  { id: 'heavy-minion', label: 'Heavy Minion' },
];

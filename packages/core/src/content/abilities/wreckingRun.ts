import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Wrecking Run: the Sentinel passive. Its movement is the class's `movementProfile.momentum`
 * (`content/legends/sentinel.ts`, HC-B29 (2)), so it has no effect steps and nothing applies at
 * spawn (`effects: []`, DEC-338 (5)). The stun, self damage and barging are not built (05 §7,
 * 10 §12).
 */
export const WRECKING_RUN = {
  id: 'wrecking-run',
  displayName: 'Wrecking Run',
  description: 'While running, speed gradually increases to a high maximum.', // game doc Passives table, without the unbuilt sprint key
  classId: 'sentinel',
  slot: 'passive',
  cooldownSeconds: 0, // never cast
  aetherCost: 0, // never cast
  targeting: null,
  effects: [],
  restrictions: [],
  scaling: {},
} as const satisfies AuthoredAbility;

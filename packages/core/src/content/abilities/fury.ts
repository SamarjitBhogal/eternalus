import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Fury: the Vanguard's ultimate, not built yet (`effects: []`). The meter gates an ultimate, so cost and cooldown are 0 (balancing.md:183, the "meter" row).
 */
export const FURY = {
  id: 'fury',
  displayName: 'Fury',
  description:
    'Imbue yourself with light. Your attack speed is far above normal for 8 seconds, your attacks hit harder and knock enemies back, and you can dash short distances.',
  classId: 'warrior',
  slot: 'ultimate',
  cooldownSeconds: 0, // TUNE: balancing.md:183 ("meter", 0 aether); DEC-202
  aetherCost: 0, // TUNE: balancing.md:183 ("meter", 0 aether); DEC-202
  targeting: null,
  effects: [],
  restrictions: [],
  scaling: {},
} as const satisfies AuthoredAbility;

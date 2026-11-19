import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Fury: the Vanguard's ultimate, implemented through shared effect strategies. The meter gates an ultimate, so cost and cooldown are 0 (balancing.md:183, the "meter" row).
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
  targeting: { kind: 'self' },
  effects: [
    {
      kind: 'fury',
      statusId: 'fury',
      durationSeconds: 8,
      dashDistance: 3,
      dashSeconds: (0.3 * 3) / 8,
      internalCooldownSeconds: 1,
    },
  ],
  restrictions: [],
  scaling: {},
} as const satisfies AuthoredAbility;

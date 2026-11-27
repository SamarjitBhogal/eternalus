import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Berserk: the Sentinel's ultimate. Casting it puts the `berserk` status on the caster, which holds
 * every effect (size, damage dealt and taken, top speed). The meter gates an ultimate, so cost and
 * cooldown are 0 (balancing.md:189, the "meter" row). The cast needs room for the grown body where
 * the Sentinel stands, or it is refused as `no-room` and the meter stays full (the buff step's
 * check, DEC-382, `INBOX.md` HC-Q113).
 */
export const BERSERK = {
  id: 'berserk',
  displayName: 'Berserk',
  description: 'Suddenly grow in size, power, speed and durability for 12 seconds.',
  classId: 'sentinel',
  slot: 'ultimate',
  cooldownSeconds: 0, // TUNE: balancing.md:189 ("meter", 0 aether); DEC-202
  aetherCost: 0, // TUNE: balancing.md:189 ("meter", 0 aether); DEC-202
  targeting: { kind: 'self' },
  effects: [{ kind: 'buff', statusId: 'berserk' }],
  restrictions: [],
  scaling: {},
} as const satisfies AuthoredAbility;

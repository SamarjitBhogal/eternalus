import type { AuthoredAbility } from '../abilities/AbilityDefinition.types';

/**
 * Weapon Swap: the Zealot's gadget (DEC-303), an artifact (05 §11) that puts its other weapon in
 * its hand, the bow for the talons and back. The swap is instant; the next swap waits the
 * cooldown, and the attack timer carries over (owner card "PR9 swap timing", option A, until the
 * owner's answer is final). It costs no aether: no source prices it.
 */
export const WEAPON_SWAP = {
  id: 'weapon-swap',
  displayName: 'Weapon Swap', // TUNE: placeholder name, until the owner names it
  description: 'Swap between your talons and your bow.',
  classId: 'warrior',
  slot: 'gadget',
  cooldownSeconds: 1, // TUNE: owner card "PR9 swap timing" (A), proposed under DEC-305's standing rule
  aetherCost: 0, // TUNE: no source prices a gadget
  targeting: { kind: 'self' },
  effects: [{ kind: 'swap-weapon' }],
  restrictions: [],
  scaling: {},
} as const satisfies AuthoredAbility;

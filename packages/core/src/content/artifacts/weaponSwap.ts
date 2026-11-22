import type { AuthoredArtifact } from './artifacts.types';

/**
 * Weapon Swap: the Zealot's gadget (DEC-303), an artifact (05 §11) that puts its other weapon in
 * its hand, the bow for the talons and back. The swap is instant; the next swap waits the
 * cooldown, and the attack timer carries over (`INBOX.md` HC-Q81, option A, until the owner's
 * answer is final). It costs no aether (`INBOX.md` HC-Q85 (2), option A).
 */
export const WEAPON_SWAP = {
  id: 'weapon-swap',
  displayName: 'Weapon Swap', // TUNE: placeholder: INBOX.md HC-Q85 (1)
  description: 'Swap between your talons and your bow.',
  classId: 'warrior',
  slot: 'gadget',
  cooldownSeconds: 1, // TUNE: INBOX.md HC-Q81 (A), proposed under DEC-305's standing rule
  aetherCost: 0, // TUNE: INBOX.md HC-Q85 (2), option A
  canBotCast: false, // bots keep the talons: INBOX.md HC-Q83 (A)
  targeting: { kind: 'self' },
  effects: [{ kind: 'swap-weapon' }],
  restrictions: [],
  scaling: {},
} as const satisfies AuthoredArtifact;

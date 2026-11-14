import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * The dash's sweep: every unit the dash passes through. TUNE: 1.5 m across is the 05 §4 sketch
 * value (05:255) until the owner sets the path width.
 */
const PATH = { kind: 'path', width: 1.5 } as const;

/** Where the dash stops. TUNE: 1.5 m is the 05 §4 sketch value (05:255) until the owner sets it. */
const END = { kind: 'circle', radius: 1.5 } as const;

/**
 * Blade Runner, its Physical variety (DEC-199 kit): dash forward, damaging and knocking back every
 * unit on the path, then stun anyone at the end. The Magical variety (flame trail + burn) is not
 * built. TUNE: every number is balancing.md:181.
 */
export const BLADE_RUNNER = {
  id: 'blade-runner',
  displayName: 'Blade Runner',
  description:
    'Dash forward at incredible speed, dealing damage to everyone in your path. Physical: ' +
    'knocks back enemies in your way and stuns anyone at the end of your path.', // game doc Abilities table
  classId: 'warrior',
  slot: 'ability',
  cooldownSeconds: 12, // TUNE: balancing.md:181
  aetherCost: 35, // TUNE: balancing.md:181
  targeting: { kind: 'directional' },
  effects: [
    {
      kind: 'dash',
      distance: 8, // TUNE: balancing.md:181, metres
      durationSeconds: 0.3, // TUNE: balancing.md:181
      onPath: [
        {
          kind: 'damage',
          amount: 120, // TUNE: balancing.md:181
          damageType: 'physical',
          shape: PATH,
          structureMultiplier: 0.3, // TUNE: DEC-209 (1), balancing.md:123 ("everything else 0.3")
        },
        { kind: 'knockback', distance: 2, shape: PATH }, // TUNE: balancing.md:181, metres
      ],
      onEnd: [{ kind: 'debuff', statusId: 'stun', durationSeconds: 0.5, shape: END }], // TUNE: balancing.md:181
    },
  ],
  restrictions: [],
  scaling: { amount: { perLevel: 0.04 } }, // TUNE: balancing.md:208, +4% ability potency per level
} as const satisfies AuthoredAbility;

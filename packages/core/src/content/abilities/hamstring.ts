import type { AuthoredAbility } from './AbilityDefinition.types';

/**
 * Hamstring (DEC-268, DEC-269): throw a blade along the aim. It stops at the first enemy body it
 * touches: a unit takes 80 damage and 2 bleed stacks, a structure or map object 80 × 0.3 (the
 * structure multiplier of DEC-209 (1)) and no bleed, as only units hold statuses. Walls stop it;
 * it passes allies (`ProjectileSystem`). Its flight is the `hamstring-blade` projectile. No slow:
 * DEC-269 names none. Cost, cooldown and damage: balancing.md:184.
 */
export const HAMSTRING = {
  id: 'hamstring',
  displayName: 'Hamstring',
  description: 'Throw a short blade. The first enemy hit takes damage and bleeds.',
  classId: 'warrior',
  slot: 'ability',
  cooldownSeconds: 9, // TUNE: balancing.md:184
  aetherCost: 25, // TUNE: balancing.md:184
  targeting: { kind: 'directional' },
  effects: [
    {
      kind: 'projectile',
      projectileId: 'hamstring-blade',
      onHit: [
        {
          kind: 'damage',
          amount: 80, // TUNE: balancing.md:184, DEC-269
          damageType: 'physical',
          shape: { kind: 'hit' },
          structureMultiplier: 0.3, // TUNE: DEC-269, DEC-209 (1)
        },
        { kind: 'debuff', statusId: 'bleed', stacks: 2, shape: { kind: 'hit' } }, // TUNE: DEC-269
      ],
    },
  ],
  restrictions: [],
  scaling: { amount: { perLevel: 0.08 } }, // TUNE: DEC-380 (2) build default (balancing.md 0.04 was for cap 10)
} as const satisfies AuthoredAbility;
